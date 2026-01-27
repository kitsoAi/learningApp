import { create } from 'zustand';
import { Course } from '@/types/api';
import { courseApi } from '@/lib/api/courses';

interface CourseState {
  activeCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  fetchCourse: (courseId: number) => Promise<void>;
  completeLesson: (lessonId: number) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  activeCourse: null,
  isLoading: false,
  error: null,

  fetchCourse: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.getCourse(courseId);
      set({ activeCourse: course, isLoading: false });
    } catch (error: any) {
        set({ error: error.message, isLoading: false });
    }
  },

  completeLesson: (lessonId) => {
    const { activeCourse } = get();
    if (!activeCourse || !activeCourse.units) return;

    const newUnits = activeCourse.units.map(unit => ({
        ...unit,
        lessons: unit.lessons?.map(lesson => {
            if (lesson.id === lessonId) {
                return { ...lesson, completed: true };
            }
            return lesson;
        })
    }));

    set({ activeCourse: { ...activeCourse, units: newUnits } });
  }
}));
