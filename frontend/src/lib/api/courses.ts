import apiClient from '../api';
import type { Course, Unit, Lesson, Challenge, ChallengeOption } from '@/types/api';

export const courseApi = {
  // Get all courses
  getCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/courses');
    return response.data;
  },

  // Get course by ID
  getCourse: async (courseId: number): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${courseId}`);
    return response.data;
  },

  // Get units for a course
  getCourseUnits: async (courseId: number) => {
    const response = await apiClient.get(`/courses/${courseId}/units`);
    return response.data;
  },

  // Create course
  createCourse: async (data: Partial<Course>): Promise<Course> => {
      const response = await apiClient.post<Course>('/admin/content/courses', data);
      return response.data;
  },

  // Update course
  updateCourse: async (courseId: number, data: Partial<Course>): Promise<Course> => {
      const response = await apiClient.put<Course>(`/admin/content/courses/${courseId}`, data);
      return response.data;
  },

  // Delete course
  deleteCourse: async (courseId: number): Promise<void> => {
      await apiClient.delete(`/admin/content/courses/${courseId}`);
  },

  // Upload media
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<{ url: string; filename: string }>('/admin/content/upload', formData);
      return response.data;
  },

  // Create unit
  createUnit: async (data: Partial<Unit>): Promise<Unit> => {
      const response = await apiClient.post<Unit>('/admin/content/units', data);
      return response.data;
  },

  // Update unit
  updateUnit: async (unitId: number, data: Partial<Unit>): Promise<Unit> => {
      const response = await apiClient.put<Unit>(`/admin/content/units/${unitId}`, data);
      return response.data;
  },

  // Delete unit
  deleteUnit: async (unitId: number): Promise<void> => {
      await apiClient.delete(`/admin/content/units/${unitId}`);
  },
};

export const lessonApi = {
  // Get lesson by ID
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await apiClient.get<Lesson>(`/lessons/${lessonId}`);
    return response.data;
  },

  // Get challenges for a lesson
  getLessonChallenges: async (lessonId: number): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(`/lessons/${lessonId}/challenges`);
    return response.data;
  },

  // Update a lesson
  updateLesson: async (lessonId: number, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await apiClient.put<Lesson>(`/admin/content/lessons/${lessonId}`, data);
    return response.data;
  },

  // Update a challenge
  updateChallenge: async (challengeId: number, data: Partial<Challenge>): Promise<Challenge> => {
    const response = await apiClient.put<Challenge>(`/admin/content/challenges/${challengeId}`, data);
    return response.data;
  },
  
  // Create a challenge
  createChallenge: async (data: Partial<Challenge>): Promise<Challenge> => {
      const response = await apiClient.post<Challenge>(`/admin/content/challenges`, data);
      return response.data;
  },

  // Delete a challenge
  deleteChallenge: async (challengeId: number): Promise<void> => {
      await apiClient.delete(`/admin/content/challenges/${challengeId}`);
  },

  // Update a challenge option
  updateOption: async (optionId: number, data: Partial<ChallengeOption>): Promise<ChallengeOption> => {
    const response = await apiClient.put<ChallengeOption>(`/admin/content/options/${optionId}`, data);
    return response.data;
  },

  // Create option
  createOption: async (challengeId: number, data: Partial<ChallengeOption>): Promise<ChallengeOption> => {
      const response = await apiClient.post<ChallengeOption>(`/admin/content/challenges/${challengeId}/options`, data);
      return response.data;
  },

  // Delete option
  deleteOption: async (optionId: number): Promise<void> => {
      await apiClient.delete(`/admin/content/options/${optionId}`);
  },

  // Create lesson
  createLesson: async (data: Partial<Lesson>): Promise<Lesson> => {
      const response = await apiClient.post<Lesson>('/admin/content/lessons', data);
      return response.data;
  },

  // Delete lesson
  deleteLesson: async (lessonId: number): Promise<void> => {
      await apiClient.delete(`/admin/content/lessons/${lessonId}`);
  },
};

export const progressApi = {
  // Get user progress
  getProgress: async () => {
    const response = await apiClient.get('/progress');
    return response.data;
  },

  // Complete a lesson
  completeLesson: async (lessonId: number, heartsUsed: number, pointsEarned: number) => {
    const response = await apiClient.post(`/progress/lesson/${lessonId}/complete`, {
      hearts_used: heartsUsed,
      points_earned: pointsEarned,
    });
    return response.data;
  },
};

export const questApi = {
  // Get all quests with status
  getQuests: async () => {
    const response = await apiClient.get('/quests');
    return response.data;
  },
};
