"use client";

import { Lesson } from "@/types/api";
import { LessonButton } from "./lesson-button";
import { UnitBanner } from "./unit-banner";

type UnitProps = {
  id: number;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
  activeLesson: Lesson | undefined;
  activeLessonPercentage: number;
  locked?: boolean;
};

export const Unit = ({
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
  locked,
}: UnitProps) => {
  return (
    <>
      <UnitBanner title={title} description={description} locked={locked} />

      <div className="relative flex flex-col items-center">
        {lessons.map((lesson, i) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = locked || (!lesson.completed && !isCurrent);

          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={i}
              totalCount={lessons.length - 1}
              current={isCurrent && !locked}
              locked={isLocked}
              percentage={activeLessonPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
