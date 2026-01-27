// User types
export interface User {
  id: number;
  email: string;
  full_name: string | null;
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
}

// Auth types
export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

// Course types
export interface Course {
  id: number;
  title: string;
  description: string | null;
  image_src: string | null;
  order_index: number;
  locked?: boolean;
  completed?: boolean;
  units?: Unit[];
}

export interface Unit {
  id: number;
  title: string;
  description: string | null;
  course_id: number;
  order_index: number;
  locked?: boolean;
  completed?: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  unit_id: number;
  order_index: number;
  challenges?: Challenge[];
  completed?: boolean;
}

export interface Challenge {
  id: number;
  lesson_id: number;
  type: string; // "SELECT", "ASSIST", etc.
  question: string;
  correct_text?: string;
  audio_src?: string;
  order_index: number;
  options: ChallengeOption[];
}

export interface ChallengeOption {
  id: number;
  challenge_id: number;
  text: string;
  correct: boolean;
  image_src: string | null;
  audio_src: string | null;
}

// Progress types
export interface UserProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  hearts_used: number;
  points_earned: number;
}

// Streak types
export interface StreakInfo {
  streak_count: number;
  longest_streak: number;
  streak_frozen: boolean;
  last_activity_date: string | null;
}

// Quest types
export interface Quest {
  id: number;
  title: string;
  description: string;
  points: number;
  required_streak: number;
}

export interface QuestProgress extends Quest {
  completed: boolean;
}
