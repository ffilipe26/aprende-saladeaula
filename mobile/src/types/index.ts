export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  schoolName?: string;
  schoolType?: 'faculdade' | 'escola' | 'cursinho';
  subjectIds?: string[];
  enrolledSubjectIds?: string[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: string[];
  correctAnswer?: string | string[];
}

export interface Activity {
  id: string;
  subjectId: string;
  teacherId?: string;
  title: string;
  instructions?: string;
  questions: Question[];
  totalPoints: number;
  deadlineDate: string;
  startDate?: string;
  status: 'Pendente' | 'Concluída' | 'Atrasada';
  type: 'Atividade' | 'Prova';
  subjectName?: string;
  userScore?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherName?: string;
  classId?: string;
}

export interface Submission {
  id: string;
  activityId: string;
  studentId: string;
  answers: Record<string, any>;
  autoScore: number;
  finalScore?: number;
  status: 'submitted' | 'late' | 'graded';
  submittedAt: string;
}
