import { supabase } from './supabase';
import { AuthUser } from '../types';

/**
 * adminService
 *
 * Operações administrativas que exigem privilégio elevado (criar/deletar usuários)
 * são delegadas às Supabase Edge Functions, onde a SERVICE_ROLE_KEY fica segura
 * no servidor, nunca exposta ao browser.
 *
 * Operações de dados normais usam o cliente regular `supabase` com as RLS Policies.
 */
export const adminService = {

  // ==========================================
  // INSTITUIÇÃO (via Edge Function)
  // ==========================================

  /**
   * Cria uma nova Instituição e o Super Admin responsável por ela.
   * Delega para a Edge Function `admin-create-institution` que usa Service Role.
   */
  async createInstitutionAndAdmin({
    schoolName,
    schoolType,
    city,
    adminName,
    adminEmail,
    adminPassword
  }: {
    schoolName: string;
    schoolType: string;
    city?: string;
    adminName: string;
    adminEmail: string;
    adminPassword?: string;
  }): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-institution', {
        body: { 
          schoolName, 
          schoolType, 
          city, 
          adminName, 
          adminEmail, 
          adminPassword: adminPassword || 'Mudar@1234' 
        }
      });

      if (error) return { user: null, error: error.message };
      if (data?.error) return { user: null, error: data.error };

      const finalUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        institutionId: data.user.institutionId,
        schoolName: data.user.schoolName,
        schoolType: data.user.schoolType,
      };

      return { user: finalUser, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro inesperado na criação' };
    }
  },

  // ==========================================
  // USUÁRIOS (via Edge Function)
  // ==========================================

  /**
   * Cria um novo usuário (Professor ou Aluno) dentro de uma instituição.
   * Delega para a Edge Function `admin-create-user` que usa Service Role.
   */
  async createUser({
    name,
    email,
    role,
    institutionId,
    classId,
    password
  }: {
    name: string;
    email: string;
    role: 'teacher' | 'student';
    institutionId: string;
    classId?: string;
    password?: string;
  }): Promise<{ user: AuthUser | null; error: string | null; tempPassword?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { name, email, role, institutionId, classId, password: password || 'Mudar@1234' }
      });

      if (error) return { user: null, error: error.message };
      if (data?.error) return { user: null, error: data.error };

      const finalUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as any,
      };

      return { user: finalUser, error: null, tempPassword: data.tempPassword };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro inesperado' };
    }
  },

  /**
   * Deleta um usuário (da tabela users + Supabase Auth).
   * Delega para a Edge Function `admin-delete-user`.
   */
  async deleteUser(userId: string): Promise<{ error: string | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao deletar usuário' };
    }
  },

  // ==========================================
  // ATIVIDADES E SUBMISSÕES
  // Usam o cliente regular (supabase) com RLS Policies.
  // Teacher: cria suas próprias atividades.
  // Student: cria suas próprias submissões.
  // ==========================================

  async createActivity(activity: {
    subjectId: string;
    teacherId: string;
    title: string;
    instructions?: string;
    questions: any[];
    totalPoints: number;
    deadlineDate: string;
    status: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          subject_id: activity.subjectId,
          teacher_id: activity.teacherId,
          title: activity.title,
          instructions: activity.instructions,
          questions: activity.questions,
          total_points: activity.totalPoints,
          deadline_date: activity.deadlineDate,
          status: activity.status
        }])
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro inesperado ao criar atividade' };
    }
  },

  async deleteActivity(activityId: string) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao excluir atividade' };
    }
  },

  async submitActivity(submission: {
    activityId: string;
    studentId: string;
    answers: Record<string, any>;
    score: number | null;
    status: 'submitted' | 'late' | 'graded';
  }) {
    try {
      const { data, error } = await supabase
        .from('activity_submissions')
        .insert([{
          activity_id: submission.activityId,
          student_id: submission.studentId,
          answers: submission.answers,
          auto_score: submission.score,
          status: submission.status
        }])
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao enviar atividade' };
    }
  },

  async createExam(exam: {
    subjectId: string;
    teacherId: string;
    title: string;
    instructions?: string;
    duration: number; // in minutes
    questionsCount: number;
    weight: string;
    image: string;
    questions: any[];
    startDate?: string;
    deadlineDate: string;
    status: string;
  }) {
    try {
      const totalPoints = exam.questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 0), 0);
      const { data, error } = await supabase
        .from('exams')
        .insert([{
          subject_id: exam.subjectId,
          teacher_id: exam.teacherId,
          title: exam.title,
          instructions: exam.instructions,
          duration_minutes: exam.duration,
          total_points: totalPoints,
          weight: Number(exam.weight) || 1.0,
          image: exam.image,
          questions: exam.questions,
          start_date: exam.startDate,
          deadline_date: exam.deadlineDate,
          status: exam.status
        }])
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro inesperado ao criar prova' };
    }
  },

  async deleteExam(examId: string) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao excluir prova' };
    }
  },

  async submitExam(submission: {
    examId: string;
    studentId: string;
    answers: Record<string, any>;
    score: number | null;
    status: 'submitted' | 'late' | 'graded';
  }) {
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .insert([{
          exam_id: submission.examId,
          student_id: submission.studentId,
          answers: submission.answers,
          auto_score: submission.score,
          status: submission.status
        }])
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao enviar prova' };
    }
  },

  async gradeSubmission(
    submissionId: string, 
    type: 'activity' | 'exam', 
    newScore: number, 
    status: string, 
    feedback?: string, 
    questionFeedback?: Record<string, string>
  ) {
    try {
      const table = type === 'activity' ? 'activity_submissions' : 'exam_submissions';
      const updateData: any = {
        manual_score: newScore,
        final_score: newScore,
        status: status
      };
      if (feedback) {
        updateData.teacher_feedback = feedback;
      }
      if (questionFeedback) {
        updateData.question_feedback = questionFeedback;
      }
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', submissionId)
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao corrigir submissão' };
    }
  },

  async publishGrades(activityId: string, type: 'activity' | 'exam') {
    try {
      const table = type === 'activity' ? 'activity_submissions' : 'exam_submissions';
      const idField = type === 'activity' ? 'activity_id' : 'exam_id';
      
      const { data, error } = await supabase
        .from(table)
        .update({ status: 'graded' })
        .eq(idField, activityId)
        .in('status', ['submitted', 'late']); // Publica tanto submissões normais quanto entregues em atraso / auto-submetidas
        
      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao publicar notas' };
    }
  },

  // Publica notas para submissões específicas selecionadas pelo professor
  async publishGradesByIds(submissionIds: string[], type: 'activity' | 'exam') {
    try {
      const table = type === 'activity' ? 'activity_submissions' : 'exam_submissions';

      const { data, error } = await supabase
        .from(table)
        .update({ status: 'graded' })
        .in('id', submissionIds);

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao publicar notas' };
    }
  },

  // ==========================================
  // AULAS E CONTEÚDOS
  // ==========================================

  async createLesson(lesson: {
    subjectId: string;
    teacherId: string;
    title: string;
    description?: string;
    type: 'youtube' | 'video' | 'pdf';
    url: string;
    duration?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          subject_id: lesson.subjectId,
          teacher_id: lesson.teacherId,
          title: lesson.title,
          description: lesson.description || null,
          type: lesson.type,
          url: lesson.url,
          duration: lesson.duration || null
        }])
        .select()
        .single();

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro inesperado ao criar aula' };
    }
  },

  async deleteLesson(lessonId: string) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      return { data, error: error?.message };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao excluir aula' };
    }
  }
};
