"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, Library, Layers3, BookOpen } from "lucide-react";
import { CourseModal } from "@/components/modals/course-modal";
import { UnitModal } from "@/components/modals/unit-modal";
import { LessonModal } from "@/components/modals/lesson-modal";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { courseApi, lessonApi } from "@/lib/api/courses";
import { Course, Unit, Lesson } from "@/types/api";

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Unit State
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  // Lesson State
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);

  const fetchCourses = async () => {
    try {
      const data = await courseApi.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (data: Partial<Course>) => {
      await courseApi.createCourse(data);
      fetchCourses();
  };

  const handleUpdateCourse = async (data: Partial<Course>) => {
      if (!editingCourse) return;
      await courseApi.updateCourse(editingCourse.id, data);
      fetchCourses();
  };

  const handleDeleteCourse = async (id: number) => {
      if (confirm("Are you sure you want to delete this course?")) {
          await courseApi.deleteCourse(id);
          fetchCourses();
      }
  };

  const openCreateModal = () => {
      setEditingCourse(null);
      setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
      setEditingCourse(course);
      setIsModalOpen(true);
  };

  // Unit Operations
  const handleCreateUnit = async (data: Partial<Unit>) => {
      if (!activeCourseId) return;
      await courseApi.createUnit({ ...data, course_id: activeCourseId });
      fetchCourses();
  };

  const handleUpdateUnit = async (data: Partial<Unit>) => {
      if (!editingUnit) return;
      await courseApi.updateUnit(editingUnit.id, data);
      fetchCourses();
  };

  const handleDeleteUnit = async (id: number) => {
      if (confirm("Are you sure you want to delete this unit?")) {
          await courseApi.deleteUnit(id);
          fetchCourses();
      }
  };

  const openCreateUnitModal = (courseId: number) => {
      setActiveCourseId(courseId);
      setEditingUnit(null);
      setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: Unit) => {
      setEditingUnit(unit);
      setIsUnitModalOpen(true);
  };

  // Lesson Operations
  const handleCreateLesson = async (data: Partial<Lesson>) => {
      if (!activeUnitId) return;
      await lessonApi.createLesson({ ...data, unit_id: activeUnitId });
      fetchCourses();
  };

  const handleUpdateLesson = async (data: Partial<Lesson>) => {
      if (!editingLesson) return;
      await lessonApi.updateLesson(editingLesson.id, data);
      fetchCourses();
  };

  const handleDeleteLesson = async (id: number) => {
      if (confirm("Are you sure you want to delete this lesson?")) {
          await lessonApi.deleteLesson(id);
          fetchCourses();
      }
  };

  const openCreateLessonModal = (unitId: number) => {
      setActiveUnitId(unitId);
      setEditingLesson(null);
      setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
      setEditingLesson(lesson);
      setIsLessonModalOpen(true);
  };

  if (loading) {
    return <div className="p-6 text-sm font-medium text-neutral-500">Loading admin dashboard...</div>;
  }

  const totalUnits = courses.reduce((sum, course) => sum + (course.units?.length || 0), 0);
  const totalLessons = courses.reduce(
    (sum, course) =>
      sum + (course.units?.reduce((unitSum, unit) => unitSum + (unit.lessons?.length || 0), 0) || 0),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <CourseModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        initialData={editingCourse}
      />

      <UnitModal 
        open={isUnitModalOpen} 
        onOpenChange={setIsUnitModalOpen} 
        onSubmit={editingUnit ? handleUpdateUnit : handleCreateUnit}
        initialData={editingUnit}
      />

      <LessonModal 
        open={isLessonModalOpen} 
        onOpenChange={setIsLessonModalOpen} 
        onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
        initialData={editingLesson}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-300">
              Content Control
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="mt-3 text-base font-medium text-slate-300">
              Manage the full course structure, keep lessons organized, and update app content from one place.
            </p>
          </div>
          <Button onClick={openCreateModal} variant="secondary" className="h-[54px] px-6 text-base font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f8db] text-[#58cc02]">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-500">Courses</p>
              <p className="text-3xl font-extrabold text-neutral-900">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-500">Units</p>
              <p className="text-3xl font-extrabold text-neutral-900">{totalUnits}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-500">Lessons</p>
              <p className="text-3xl font-extrabold text-neutral-900">{totalLessons}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-xl font-extrabold text-neutral-900">{course.title}</span>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(course)}>Edit Course</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.id)}>Delete</Button>
                </div>
              </CardTitle>
              <CardDescription className="text-sm font-medium text-neutral-500">{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-6" />
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">Units</h3>
              <div className="space-y-6">
                {course.units?.length === 0 && <span className="text-muted-foreground italic">No units yet.</span>}
                {course.units?.map((unit) => (
                  <div key={unit.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="font-bold text-neutral-900">Unit {unit.order_index}: {unit.title}</h4>
                            <p className="text-sm text-neutral-500">{unit.description}</p>
                        </div>
                        <div className="flex space-x-2">
                             <Button variant="ghost" size="sm" onClick={() => openEditUnitModal(unit)}>
                                <Edit2 className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteUnit(unit.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unit.lessons?.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                             <span className="font-semibold text-sm text-neutral-800">Lesson {lesson.order_index}: {lesson.title}</span>
                             <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditLessonModal(lesson)}>
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                             </div>
                          </div>
                          <Link href={`/admin/lesson/${lesson.id}`}>
                            <Button size="sm" variant="secondary" className="w-full mt-2">
                              Edit Content
                            </Button>
                          </Link>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="h-full min-h-[80px] rounded-2xl border-dashed border-slate-300 bg-white"
                        onClick={() => openCreateLessonModal(unit.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Lesson
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                    <Button 
                        variant="ghost" 
                        className="text-neutral-500"
                        onClick={() => openCreateUnitModal(course.id)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Unit
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
