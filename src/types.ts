// ==========================================
// TIPOS DE USUÁRIO E AUTENTICAÇÃO
// ==========================================
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  avatar?: string;
  // Específico de Admin
  schoolName?: string;
  schoolType?: 'faculdade' | 'escola' | 'cursinho';
  // Específico de Teacher
  subjectIds?: string[]; // disciplinas que leciona
  // Específico de Student
  enrolledSubjectIds?: string[]; // disciplinas matriculado
  classId?: string;
}

// ==========================================
// TIPOS ACADÊMICOS
// ==========================================
export interface SchoolClass {
  id: string;
  name: string;
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
}

export interface Subject {
  id: string;
  classId?: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  color?: string; // cor de destaque do card
}

export type LessonType = 'youtube' | 'video' | 'pdf';

export interface Lesson {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  type: LessonType;
  url: string;
  date: string; // ISO string
  duration?: string; // em minutos
  thumbnail?: string;
}

export interface SchoolMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subjectIds?: string[];   // teacher: leciona / student: matriculado
  status: 'ativo' | 'inativo';
  joinedAt: string; // ISO string
  avatar?: string;
  classId?: string;
}

// ==========================================
// TIPOS DE QUESTÕES E ATIVIDADES (Ecossistema D.3)
// ==========================================
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
  subjectId: string;
  teacherId: string;
  subject: string; // nome da disciplina (mantido pra facilidade no front)
  instructions?: string;
  deadlineDate: string; // ISO string for calculation
  status: 'Pendente' | 'Em Aberto' | 'Prazo Crítico' | 'Concluída';
  questions: Question[];
  totalPoints: number;
  createdAt?: string;
}

export interface ActivitySubmission {
  id: string;
  activityId: string;
  studentId: string;
  answers: Record<string, any>;
  score: number | null;
  status: 'submitted' | 'late' | 'graded';
  submittedAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, any>;
  score: number | null;
  status: 'submitted' | 'late' | 'graded';
  submittedAt: string;
  teacherFeedback?: string; // Feedback from teacher
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;
  teacherId?: string;
  instructions?: string;
  duration: string; // in minutes (calculated from startDate → deadlineDate)
  questionsCount: number;
  startDate?: string; // ISO string for sync window start
  deadlineDate: string; // ISO string for sync window end
  weight: string;
  image: string;
  questions: Question[];
  /** Disponível = dentro da janela, Encerrada = prazo expirou sem realização, Concluída = aluno realizou */
  status: 'Disponível' | 'Encerrada' | 'Concluída';
  grade?: string;
  submittedAt?: string; // ISO string da data de entrega da submissão
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'activity' | 'exam' | 'system' | 'lesson';
  read: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
