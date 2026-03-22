export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: any;
  points: number;
}

export interface Activity {
  id: string;
  title: string;
  subject: string;
  duration?: string; // in minutes
  deadlineDate: string; // ISO string for calculation
  status: 'Pendente' | 'Em Aberto' | 'Prazo Crítico' | 'Concluída';
  image: string;
  questions: Question[];
  score?: number;
  totalPoints: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: string; // in minutes
  questionsCount: number;
  deadlineDate: string; // ISO string for calculation
  weight: string;
  image: string;
  questions: Question[];
  status: 'Disponível' | 'Concluída';
  grade?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'activity' | 'exam' | 'system';
  read: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
