/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import type { TransactionSql } from "postgres";
import { createAccessToken, createRefreshToken, verifyToken } from "@/lib/server/auth";
import { ensureAppSchema, getSql, sql } from "@/lib/server/db";
import { uploadPublicFile } from "@/lib/server/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

type DbUser = {
  id: number;
  email: string;
  full_name: string | null;
  hashed_password: string | null;
  is_active: boolean;
  is_admin: boolean;
  image_src: string | null;
  hearts: number;
  points: number;
  xp: number;
  streak_count: number;
  last_activity_date: string | null;
  longest_streak: number;
  streak_frozen: boolean;
  created_at?: string;
  updated_at?: string;
};

type CachedValue<T> = {
  data: T;
  expiresAt: number;
};

const ADMIN_CACHE_TTL_MS = 30_000;
let adminCoursesTreeCache: CachedValue<any[]> | null = null;
let adminAnalyticsCache: CachedValue<Record<string, unknown>> | null = null;

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function errorResponse(detail: string, status = 400) {
  return json({ detail }, { status });
}

function parseId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    is_active: user.is_active,
    is_admin: user.is_admin,
    image_src: user.image_src,
    hearts: user.hearts,
    points: user.points,
    xp: user.xp,
    streak_count: user.streak_count,
    last_activity_date: user.last_activity_date,
    longest_streak: user.longest_streak,
    streak_frozen: user.streak_frozen,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readMultipartFile(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("A file is required");
  }

  return file;
}

async function getCurrentUser(request: NextRequest, requireAuth = true) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    if (requireAuth) {
      throw new Error("Unauthorized");
    }

    return null;
  }

  const payload = await verifyToken(token);
  const userId = Number(payload.sub);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const users = (await sql`
    select
      id,
      email,
      full_name,
      hashed_password,
      is_active,
      is_admin,
      image_src,
      hearts,
      points,
      xp,
      streak_count,
      last_activity_date::text,
      longest_streak,
      streak_frozen,
      created_at::text,
      updated_at::text
    from users
    where id = ${userId}
    limit 1
  `) as unknown as DbUser[];

  const user = users[0] ?? null;
  if (!user && requireAuth) {
    throw new Error("Unauthorized");
  }

  return user;
}

async function requireAdmin(request: NextRequest) {
  const user = await getRequiredUser(request);
  if (!user?.is_admin) {
    throw new Error("Forbidden");
  }
  return user;
}

async function getRequiredUser(request: NextRequest) {
  return (await getCurrentUser(request, true)) as DbUser;
}

async function fetchCourses(): Promise<any[]> {
  const [courses, units, lessons, challenges, options] = (await Promise.all([
    sql`select * from courses order by order_index asc, id asc`,
    sql`select * from units order by order_index asc, id asc`,
    sql`select * from lessons order by order_index asc, id asc`,
    sql`select * from challenges order by order_index asc, id asc`,
    sql`select * from challenge_options order by id asc`,
  ])) as unknown as [any[], any[], any[], any[], any[]];

  const optionMap = new Map<number, any[]>();
  for (const option of options) {
    const group = optionMap.get(option.challenge_id) ?? [];
    group.push(option);
    optionMap.set(option.challenge_id, group);
  }

  const challengeMap = new Map<number, any[]>();
  for (const challenge of challenges) {
    const group = challengeMap.get(challenge.lesson_id) ?? [];
    group.push({
      ...challenge,
      options: optionMap.get(challenge.id) ?? [],
    });
    challengeMap.set(challenge.lesson_id, group);
  }

  const lessonMap = new Map<number, any[]>();
  for (const lesson of lessons) {
    const group = lessonMap.get(lesson.unit_id) ?? [];
    group.push({
      ...lesson,
      challenges: challengeMap.get(lesson.id) ?? [],
    });
    lessonMap.set(lesson.unit_id, group);
  }

  const unitMap = new Map<number, any[]>();
  for (const unit of units) {
    const group = unitMap.get(unit.course_id) ?? [];
    group.push({
      ...unit,
      lessons: lessonMap.get(unit.id) ?? [],
    });
    unitMap.set(unit.course_id, group);
  }

  return courses.map((course) => ({
    ...course,
    units: unitMap.get(course.id) ?? [],
  }));
}

async function fetchAdminCoursesTree(): Promise<any[]> {
  const [courses, units, lessons] = (await Promise.all([
    sql`select * from courses order by order_index asc, id asc`,
    sql`select * from units order by order_index asc, id asc`,
    sql`select * from lessons order by order_index asc, id asc`,
  ])) as unknown as [any[], any[], any[]];

  const lessonMap = new Map<number, any[]>();
  for (const lesson of lessons) {
    const group = lessonMap.get(lesson.unit_id) ?? [];
    group.push(lesson);
    lessonMap.set(lesson.unit_id, group);
  }

  const unitMap = new Map<number, any[]>();
  for (const unit of units) {
    const group = unitMap.get(unit.course_id) ?? [];
    group.push({
      ...unit,
      lessons: lessonMap.get(unit.id) ?? [],
    });
    unitMap.set(unit.course_id, group);
  }

  return courses.map((course) => ({
    ...course,
    units: unitMap.get(course.id) ?? [],
  }));
}

async function getCachedAdminCoursesTree(): Promise<any[]> {
  if (adminCoursesTreeCache && adminCoursesTreeCache.expiresAt > Date.now()) {
    return adminCoursesTreeCache.data;
  }

  const tree = await fetchAdminCoursesTree();
  adminCoursesTreeCache = {
    data: tree,
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  };

  return tree;
}

async function getCachedAdminAnalytics() {
  if (adminAnalyticsCache && adminAnalyticsCache.expiresAt > Date.now()) {
    return adminAnalyticsCache.data;
  }

  const totalsRows = (await sql`
    select
      (select count(*) from users) as total_users,
      (select count(*) from courses) as total_courses,
      (select count(*) from units) as total_units,
      (select count(*) from lessons) as total_lessons,
      (select count(*) from challenges) as total_challenges,
      coalesce((select avg(xp) from users), 0) as average_xp,
      (select count(*) from users where xp > 0) as active_users
  `) as unknown as any[];

  const [totals] = totalsRows;
  const data = {
    ...totals,
    average_xp: Number(totals.average_xp ?? 0),
  };

  adminAnalyticsCache = {
    data,
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  };

  return data;
}

function invalidateAdminCaches() {
  adminCoursesTreeCache = null;
  adminAnalyticsCache = null;
}

async function getCompletedLessonIds(userId: number) {
  const rows = (await sql`
    select lesson_id
    from user_progress
    where user_id = ${userId} and completed = true
  `) as unknown as { lesson_id: number }[];

  return new Set(rows.map((row) => row.lesson_id));
}

async function buildCoursesResponse(userId?: number | null) {
  const courses = await fetchCourses();
  if (!userId) {
    return courses.map((course, index) => ({
      ...course,
      locked: index > 0,
      completed: false,
    }));
  }

  const completedLessonIds = await getCompletedLessonIds(userId);
  let previousCourseCompleted = true;

  return courses.map((course) => {
    const lessonIds = course.units.flatMap((unit: any) =>
      unit.lessons.map((lesson: any) => lesson.id)
    );
    const completed =
      lessonIds.length === 0 || lessonIds.every((lessonId: number) => completedLessonIds.has(lessonId));
    const shaped = {
      ...course,
      locked: !previousCourseCompleted,
      completed,
    };
    previousCourseCompleted = completed;
    return shaped;
  });
}

async function buildCourseResponse(courseId: number, userId?: number | null) {
  const courses = await fetchCourses();
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }

  if (!userId) {
    return course;
  }

  const completedLessonIds = await getCompletedLessonIds(userId);
  let previousUnitCompleted = true;

  return {
    ...course,
    units: course.units.map((unit: any) => {
      const lessons = unit.lessons.map((lesson: any) => ({
        ...lesson,
        completed: completedLessonIds.has(lesson.id),
      }));
      const completed = lessons.length > 0 && lessons.every((lesson: any) => lesson.completed);
      const shaped = {
        ...unit,
        lessons,
        completed,
        locked: !previousUnitCompleted,
      };
      previousUnitCompleted = completed;
      return shaped;
    }),
  };
}

async function getLesson(lessonId: number) {
  const courses = await fetchCourses();
  for (const course of courses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === lessonId) {
          return lesson;
        }
      }
    }
  }

  return null;
}

async function updateUserXp(tx: TransactionSql<any>, user: DbUser, xpToAdd: number) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streakCount = user.streak_count;
  let longestStreak = user.longest_streak;
  let lastActivityDate = user.last_activity_date;
  let streakFrozen = user.streak_frozen;
  let points = user.points + xpToAdd;
  const xp = user.xp + xpToAdd;

  if (lastActivityDate === today) {
    // no-op
  } else if (lastActivityDate === yesterday) {
    streakCount += 1;
    longestStreak = Math.max(longestStreak, streakCount);
    lastActivityDate = today;
    streakFrozen = false;
  } else if (!lastActivityDate) {
    streakCount = 1;
    longestStreak = Math.max(longestStreak, 1);
    lastActivityDate = today;
  } else {
    const missedDays = Math.floor(
      (new Date(today).getTime() - new Date(lastActivityDate).getTime()) / 86400000
    );

    if (streakFrozen && missedDays === 2) {
      streakFrozen = false;
      lastActivityDate = today;
    } else {
      streakCount = 1;
      longestStreak = Math.max(longestStreak, 1);
      lastActivityDate = today;
    }
  }

  const eligibleQuests = (await tx`
    select id, points
    from quests
    where required_streak <= ${streakCount}
  `) as unknown as { id: number; points: number }[];
  const completedQuestRows = (await tx`
    select quest_id
    from user_quests
    where user_id = ${user.id}
  `) as unknown as { quest_id: number }[];
  const completedQuestIds = new Set(completedQuestRows.map((row) => row.quest_id));

  for (const quest of eligibleQuests) {
    if (completedQuestIds.has(quest.id)) {
      continue;
    }

    await tx`
      insert into user_quests (user_id, quest_id, completed, completion_date)
      values (${user.id}, ${quest.id}, true, now())
    `;
    points += quest.points;
  }

  const updated = (await tx`
    update users
    set
      xp = ${xp},
      points = ${points},
      streak_count = ${streakCount},
      longest_streak = ${longestStreak},
      last_activity_date = ${lastActivityDate},
      streak_frozen = ${streakFrozen},
      updated_at = now()
    where id = ${user.id}
    returning
      id,
      email,
      full_name,
      hashed_password,
      is_active,
      is_admin,
      image_src,
      hearts,
      points,
      xp,
      streak_count,
      last_activity_date::text,
      longest_streak,
      streak_frozen,
      created_at::text,
      updated_at::text
  `) as unknown as DbUser[];

  return updated[0];
}

async function handleGet(request: NextRequest, slug: string[]) {
  if (slug[0] === "courses" && slug.length === 1) {
    let userId: number | null = null;
    try {
      const user = await getCurrentUser(request, false);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    return json(await buildCoursesResponse(userId));
  }

  if (slug[0] === "courses" && slug.length === 2) {
    const courseId = parseId(slug[1]);
    if (!courseId) {
      return errorResponse("Invalid course id", 400);
    }

    let userId: number | null = null;
    try {
      const user = await getCurrentUser(request, false);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const course = await buildCourseResponse(courseId, userId);
    return course ? json(course) : errorResponse("Course not found", 404);
  }

  if (slug[0] === "courses" && slug[2] === "units") {
    const courseId = parseId(slug[1]);
    if (!courseId) {
      return errorResponse("Invalid course id", 400);
    }
    const course = await buildCourseResponse(courseId, null);
    return course ? json(course.units) : errorResponse("Course not found", 404);
  }

  if (slug[0] === "lessons" && slug.length === 2) {
    const lessonId = parseId(slug[1]);
    if (!lessonId) {
      return errorResponse("Invalid lesson id", 400);
    }
    const lesson = await getLesson(lessonId);
    return lesson ? json(lesson) : errorResponse("Lesson not found", 404);
  }

  if (slug[0] === "lessons" && slug[2] === "challenges") {
    const lessonId = parseId(slug[1]);
    if (!lessonId) {
      return errorResponse("Invalid lesson id", 400);
    }
    const lesson = await getLesson(lessonId);
    return lesson ? json(lesson.challenges ?? []) : errorResponse("Lesson not found", 404);
  }

  if (slug[0] === "users" && slug[1] === "me" && slug.length === 2) {
    const user = await getRequiredUser(request);
    return json(serializeUser(user));
  }

  if (slug[0] === "users" && slug[1] === "me" && slug[2] === "streak") {
    const user = await getRequiredUser(request);
    return json({
      streak_count: user?.streak_count,
      longest_streak: user?.longest_streak,
      streak_frozen: user?.streak_frozen,
      last_activity_date: user?.last_activity_date,
    });
  }

  if (slug[0] === "progress" && slug.length === 1) {
    const user = await getRequiredUser(request);
    const progress = await sql`
      select
        id,
        user_id,
        lesson_id,
        completed,
        hearts_used,
        points_earned,
        created_at::text,
        updated_at::text
      from user_progress
      where user_id = ${user.id}
      order by id asc
    `;
    return json(progress);
  }

  if (slug[0] === "quests" && slug.length === 1) {
    const user = await getRequiredUser(request);
    const quests = (await sql`select * from quests order by id asc`) as unknown as any[];
    const completed = (await sql`
      select quest_id
      from user_quests
      where user_id = ${user.id} and completed = true
    `) as unknown as { quest_id: number }[];
    const completedIds = new Set(completed.map((row) => row.quest_id));
    return json(
      quests.map((quest) => ({
        ...quest,
        completed: completedIds.has(quest.id),
      }))
    );
  }

  if (slug[0] === "admin" && slug[1] === "analytics") {
    await requireAdmin(request);
    return json(await getCachedAdminAnalytics());
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "tree") {
    await requireAdmin(request);
    return json(await getCachedAdminCoursesTree());
  }

  return errorResponse("Not found", 404);
}

async function handlePost(request: NextRequest, slug: string[]) {
  if (slug[0] === "auth" && slug[1] === "login") {
    const form = await request.formData();
    const username = String(form.get("username") ?? "");
    const password = String(form.get("password") ?? "");

    const users = (await sql`
      select
        id,
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        image_src,
        hearts,
        points,
        xp,
        streak_count,
        last_activity_date::text,
        longest_streak,
        streak_frozen,
        created_at::text,
        updated_at::text
      from users
      where lower(email) = lower(${username})
      limit 1
    `) as unknown as DbUser[];
    const user = users[0];

    if (!user?.hashed_password || !(await bcrypt.compare(password, user.hashed_password))) {
      return errorResponse("Incorrect email or password", 401);
    }

    return json({
      access_token: await createAccessToken(user.id),
      token_type: "bearer",
      refresh_token: await createRefreshToken(user.id),
      user: serializeUser(user),
    });
  }

  if (slug[0] === "auth" && slug[1] === "register") {
    const body = (await readJson(request)) as {
      email?: string;
      password?: string;
      full_name?: string;
    } | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    const fullName = body?.full_name?.trim() || null;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    const existing = (await sql`
      select id
      from users
      where lower(email) = lower(${email})
      limit 1
    `) as unknown as { id: number }[];
    if (existing.length > 0) {
      return errorResponse("A user with that email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const inserted = (await sql`
      insert into users (
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        hearts,
        points,
        xp,
        streak_count,
        longest_streak,
        streak_frozen,
        created_at,
        updated_at
      )
      values (
        ${email},
        ${fullName},
        ${hashedPassword},
        true,
        false,
        5,
        0,
        0,
        0,
        0,
        false,
        now(),
        now()
      )
      returning
        id,
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        image_src,
        hearts,
        points,
        xp,
        streak_count,
        last_activity_date::text,
        longest_streak,
        streak_frozen,
        created_at::text,
        updated_at::text
    `) as unknown as DbUser[];

    return json(serializeUser(inserted[0]), { status: 201 });
  }

  if (slug[0] === "auth" && slug[1] === "refresh") {
    const body = (await readJson(request)) as { refresh_token?: string } | null;
    if (!body?.refresh_token) {
      return errorResponse("Refresh token is required", 400);
    }

    const payload = await verifyToken(body.refresh_token);
    if (!payload.refresh || !payload.sub) {
      return errorResponse("Invalid refresh token", 401);
    }

    return json({
      access_token: await createAccessToken(Number(payload.sub)),
      token_type: "bearer",
      refresh_token: await createRefreshToken(Number(payload.sub)),
    });
  }

  if (slug[0] === "users" && slug[1] === "me" && slug[2] === "hearts" && slug[3] === "refill") {
    const user = await getRequiredUser(request);
    const rows = (await sql`
      update users
      set hearts = 5, updated_at = now()
      where id = ${user.id}
      returning
        id,
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        image_src,
        hearts,
        points,
        xp,
        streak_count,
        last_activity_date::text,
        longest_streak,
        streak_frozen,
        created_at::text,
        updated_at::text
    `) as unknown as DbUser[];
    return json(serializeUser(rows[0]));
  }

  if (slug[0] === "users" && slug[1] === "me" && slug[2] === "hearts" && slug[3] === "reduce") {
    const user = await getRequiredUser(request);
    const rows = (await sql`
      update users
      set hearts = greatest(hearts - 1, 0), updated_at = now()
      where id = ${user.id}
      returning
        id,
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        image_src,
        hearts,
        points,
        xp,
        streak_count,
        last_activity_date::text,
        longest_streak,
        streak_frozen,
        created_at::text,
        updated_at::text
    `) as unknown as DbUser[];
    return json(serializeUser(rows[0]));
  }

  if (slug[0] === "users" && slug[1] === "me" && slug[2] === "xp" && slug[3] === "add") {
    const user = await getRequiredUser(request);
    const body = (await readJson(request)) as { xp?: number } | null;
    const xp = Number(body?.xp ?? 0);
    const updated = await getSql().begin(async (tx) => updateUserXp(tx, user as DbUser, xp));
    return json(serializeUser(updated));
  }

  if (slug[0] === "users" && slug[1] === "me" && slug[2] === "streak" && slug[3] === "freeze") {
    const user = await getRequiredUser(request);
    await sql`
      update users
      set streak_frozen = true, updated_at = now()
      where id = ${user.id}
    `;
    return json({ status: "streak frozen" });
  }

  if (slug[0] === "users" && slug[1] === "upload") {
    const user = await getRequiredUser(request);
    const file = await readMultipartFile(request);
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!["png", "jpg", "jpeg", "svg", "webp"].includes(extension)) {
      return errorResponse("Invalid image type", 400);
    }

    const uploaded = await uploadPublicFile(file, "avatars");
    await sql`
      update users
      set image_src = ${uploaded.url}, updated_at = now()
      where id = ${user.id}
    `;
    return json({ url: uploaded.url, filename: uploaded.filename });
  }

  if (slug[0] === "progress" && slug[1] === "lesson" && slug[3] === "complete") {
    const lessonId = parseId(slug[2]);
    if (!lessonId) {
      return errorResponse("Invalid lesson id", 400);
    }
    const user = await getRequiredUser(request);
    const body = (await readJson(request)) as {
      hearts_used?: number;
      points_earned?: number;
    } | null;
    const heartsUsed = Number(body?.hearts_used ?? 0);
    const pointsEarned = Number(body?.points_earned ?? 10);

    const progress = await getSql().begin(async (tx) => {
      const existing = (await tx`
        select id
        from user_progress
        where user_id = ${user.id} and lesson_id = ${lessonId}
        limit 1
      `) as unknown as any[];

      let row;
      if (existing[0]) {
        const updatedRows = (await tx`
          update user_progress
          set
            completed = true,
            hearts_used = ${heartsUsed},
            points_earned = ${pointsEarned},
            updated_at = now()
          where id = ${existing[0].id}
          returning
            id,
            user_id,
            lesson_id,
            completed,
            hearts_used,
            points_earned,
            created_at::text,
            updated_at::text
        `) as unknown as any[];
        row = updatedRows[0];
      } else {
        const insertedRows = (await tx`
          insert into user_progress (
            user_id,
            lesson_id,
            completed,
            hearts_used,
            points_earned,
            created_at,
            updated_at
          )
          values (${user.id}, ${lessonId}, true, ${heartsUsed}, ${pointsEarned}, now(), now())
          returning
            id,
            user_id,
            lesson_id,
            completed,
            hearts_used,
            points_earned,
            created_at::text,
            updated_at::text
        `) as unknown as any[];
        row = insertedRows[0];
      }

      await updateUserXp(tx, user as DbUser, pointsEarned);
      return row;
    });

    return json(progress);
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "upload") {
    await requireAdmin(request);
    const file = await readMultipartFile(request);
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["png", "jpg", "jpeg", "svg", "webp", "mp3", "wav", "ogg", "m4a"];

    if (!allowedExtensions.includes(extension)) {
      return errorResponse("Invalid file type", 400);
    }

    const uploaded = await uploadPublicFile(file, "admin");
    return json({ url: uploaded.url, filename: uploaded.filename });
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "courses" && slug.length === 3) {
    await requireAdmin(request);
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      insert into courses (title, description, image_src, order_index)
      values (
        ${String(body.title ?? "")},
        ${body.description ? String(body.description) : null},
        ${body.image_src ? String(body.image_src) : null},
        ${Number(body.order_index ?? 0)}
      )
      returning *
    `;
    return json(rows[0], { status: 201 });
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "units" && slug.length === 3) {
    await requireAdmin(request);
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      insert into units (title, description, course_id, order_index)
      values (
        ${String(body.title ?? "")},
        ${body.description ? String(body.description) : null},
        ${Number(body.course_id)},
        ${Number(body.order_index ?? 0)}
      )
      returning *
    `;
    return json(rows[0], { status: 201 });
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "lessons" && slug.length === 3) {
    await requireAdmin(request);
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      insert into lessons (title, unit_id, order_index)
      values (
        ${String(body.title ?? "")},
        ${Number(body.unit_id)},
        ${Number(body.order_index ?? 0)}
      )
      returning *
    `;
    return json(rows[0], { status: 201 });
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "challenges" && slug.length === 3) {
    await requireAdmin(request);
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      insert into challenges (lesson_id, type, question, correct_text, audio_src, order_index)
      values (
        ${Number(body.lesson_id)},
        ${String(body.type ?? "SELECT")},
        ${String(body.question ?? "")},
        ${body.correct_text ? String(body.correct_text) : null},
        ${body.audio_src ? String(body.audio_src) : null},
        ${Number(body.order_index ?? 0)}
      )
      returning *
    `;
    return json({ ...rows[0], options: [] }, { status: 201 });
  }

  if (
    slug[0] === "admin" &&
    slug[1] === "content" &&
    slug[2] === "challenges" &&
    slug[4] === "options"
  ) {
    await requireAdmin(request);
    const challengeId = parseId(slug[3]);
    if (!challengeId) {
      return errorResponse("Invalid challenge id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      insert into challenge_options (challenge_id, text, correct, image_src, audio_src)
      values (
        ${challengeId},
        ${String(body.text ?? "")},
        ${Boolean(body.correct ?? false)},
        ${body.image_src ? String(body.image_src) : null},
        ${body.audio_src ? String(body.audio_src) : null}
      )
      returning *
    `;
    return json(rows[0], { status: 201 });
  }

  return errorResponse("Not found", 404);
}

async function handlePatch(request: NextRequest, slug: string[]) {
  if (slug[0] === "users" && slug[1] === "me" && slug.length === 2) {
    const user = await getRequiredUser(request);
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = (await sql`
      update users
      set
        full_name = ${body.full_name ? String(body.full_name) : user?.full_name ?? null},
        image_src = ${body.image_src ? String(body.image_src) : user?.image_src ?? null},
        updated_at = now()
      where id = ${user.id}
      returning
        id,
        email,
        full_name,
        hashed_password,
        is_active,
        is_admin,
        image_src,
        hearts,
        points,
        xp,
        streak_count,
        last_activity_date::text,
        longest_streak,
        streak_frozen,
        created_at::text,
        updated_at::text
    `) as unknown as DbUser[];
    return json(serializeUser(rows[0]));
  }

  return errorResponse("Not found", 404);
}

async function handlePut(request: NextRequest, slug: string[]) {
  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "courses" && slug.length === 4) {
    await requireAdmin(request);
    const courseId = parseId(slug[3]);
    if (!courseId) {
      return errorResponse("Invalid course id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      update courses
      set
        title = ${String(body.title ?? "")},
        description = ${body.description ? String(body.description) : null},
        image_src = ${body.image_src ? String(body.image_src) : null},
        order_index = ${Number(body.order_index ?? 0)}
      where id = ${courseId}
      returning *
    `;
    return rows[0] ? json(rows[0]) : errorResponse("Course not found", 404);
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "units" && slug.length === 4) {
    await requireAdmin(request);
    const unitId = parseId(slug[3]);
    if (!unitId) {
      return errorResponse("Invalid unit id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      update units
      set
        title = ${String(body.title ?? "")},
        description = ${body.description ? String(body.description) : null},
        course_id = ${Number(body.course_id)},
        order_index = ${Number(body.order_index ?? 0)}
      where id = ${unitId}
      returning *
    `;
    return rows[0] ? json(rows[0]) : errorResponse("Unit not found", 404);
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "lessons" && slug.length === 4) {
    await requireAdmin(request);
    const lessonId = parseId(slug[3]);
    if (!lessonId) {
      return errorResponse("Invalid lesson id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      update lessons
      set
        title = ${String(body.title ?? "")},
        unit_id = ${Number(body.unit_id)},
        order_index = ${Number(body.order_index ?? 0)}
      where id = ${lessonId}
      returning *
    `;
    return rows[0] ? json(rows[0]) : errorResponse("Lesson not found", 404);
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "challenges" && slug.length === 4) {
    await requireAdmin(request);
    const challengeId = parseId(slug[3]);
    if (!challengeId) {
      return errorResponse("Invalid challenge id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      update challenges
      set
        lesson_id = ${Number(body.lesson_id)},
        type = ${String(body.type ?? "SELECT")},
        question = ${String(body.question ?? "")},
        correct_text = ${body.correct_text ? String(body.correct_text) : null},
        audio_src = ${body.audio_src ? String(body.audio_src) : null},
        order_index = ${Number(body.order_index ?? 0)}
      where id = ${challengeId}
      returning *
    `;
    if (!rows[0]) {
      return errorResponse("Challenge not found", 404);
    }
    const options = await sql`
      select *
      from challenge_options
      where challenge_id = ${challengeId}
      order by id asc
    `;
    return json({ ...rows[0], options });
  }

  if (slug[0] === "admin" && slug[1] === "content" && slug[2] === "options" && slug.length === 4) {
    await requireAdmin(request);
    const optionId = parseId(slug[3]);
    if (!optionId) {
      return errorResponse("Invalid option id", 400);
    }
    const body = (await readJson(request)) as Record<string, unknown>;
    const rows = await sql`
      update challenge_options
      set
        text = ${String(body.text ?? "")},
        correct = ${Boolean(body.correct ?? false)},
        image_src = ${body.image_src ? String(body.image_src) : null},
        audio_src = ${body.audio_src ? String(body.audio_src) : null}
      where id = ${optionId}
      returning *
    `;
    return rows[0] ? json(rows[0]) : errorResponse("Challenge option not found", 404);
  }

  return errorResponse("Not found", 404);
}

async function handleDelete(request: NextRequest, slug: string[]) {
  if (slug[0] === "admin" && slug[1] === "content") {
    await requireAdmin(request);
  }

  if (slug[0] === "admin" && slug[1] === "content") {
    const resource = slug[2];
    const id = parseId(slug[3]);

    if (!id) {
      return errorResponse("Not found", 404);
    }

    if (resource === "courses") {
      const rows = await sql`delete from courses where id = ${id} returning id`;
      return rows[0]
        ? json({ message: "course deleted successfully" })
        : errorResponse("Course not found", 404);
    }

    if (resource === "units") {
      const rows = await sql`delete from units where id = ${id} returning id`;
      return rows[0]
        ? json({ message: "unit deleted successfully" })
        : errorResponse("Unit not found", 404);
    }

    if (resource === "lessons") {
      const rows = await sql`delete from lessons where id = ${id} returning id`;
      return rows[0]
        ? json({ message: "lesson deleted successfully" })
        : errorResponse("Lesson not found", 404);
    }

    if (resource === "challenges") {
      const rows = await sql`delete from challenges where id = ${id} returning id`;
      return rows[0]
        ? json({ message: "challenge deleted successfully" })
        : errorResponse("Challenge not found", 404);
    }

    if (resource === "options") {
      const rows = await sql`delete from challenge_options where id = ${id} returning id`;
      return rows[0]
        ? json({ message: "option deleted successfully" })
        : errorResponse("Challenge option not found", 404);
    }
  }

  return errorResponse("Not found", 404);
}

async function routeRequest(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    await ensureAppSchema();
    const shouldInvalidateAdminCache =
      method !== "GET" && slug[0] === "admin" && slug[1] === "content";

    if (method === "GET") {
      return await handleGet(request, slug);
    }
    if (method === "POST") {
      const response = await handlePost(request, slug);
      if (shouldInvalidateAdminCache) {
        invalidateAdminCaches();
      }
      return response;
    }
    if (method === "PATCH") {
      const response = await handlePatch(request, slug);
      if (shouldInvalidateAdminCache) {
        invalidateAdminCaches();
      }
      return response;
    }
    if (method === "PUT") {
      const response = await handlePut(request, slug);
      if (shouldInvalidateAdminCache) {
        invalidateAdminCaches();
      }
      return response;
    }
    const response = await handleDelete(request, slug);
    if (shouldInvalidateAdminCache) {
      invalidateAdminCaches();
    }
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message === "Forbidden") {
        return errorResponse("Forbidden", 403);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse("Internal server error", 500);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return routeRequest("GET", request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return routeRequest("POST", request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return routeRequest("PATCH", request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return routeRequest("PUT", request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return routeRequest("DELETE", request, context);
}
