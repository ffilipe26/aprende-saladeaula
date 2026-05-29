import { supabase } from './supabase';
import { AuthUser } from '../types';

export const authService = {
  /**
   * Realiza login no Supabase Auth e busca os dados do usuário na tabela `users`
   */
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null; mustChangePassword?: boolean }> {
    try {
      // 1. Autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Usuário não retornado após autenticação.' };
      }

      // 2. Buscar perfil completo na tabela `users`
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          must_change_password,
          institution_id,
          institutions (
            name,
            school_type
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        // Se falhar ao buscar o perfil, desloga por segurança
        await supabase.auth.signOut();
        return { user: null, error: 'Perfil de usuário não encontrado no banco de dados.' };
      }

      // 3. Buscar disciplinas (subjects) vinculadas dependendo da role
      let subjectIds: string[] = [];
      
      if (profileData.role === 'teacher') {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('teacher_id', profileData.id);
        if (subjects) {
          subjectIds = subjects.map(s => s.id);
        }
      } else if (profileData.role === 'student') {
        const { data: enrollments } = await supabase
          .from('subject_enrollments')
          .select('subject_id')
          .eq('student_id', profileData.id);
        if (enrollments) {
          subjectIds = enrollments.map(e => e.subject_id);
        }
      }

      // 4. Montar objeto final AuthUser
      const institutionInfo = Array.isArray(profileData.institutions) 
        ? profileData.institutions[0] 
        : profileData.institutions;

      const user: AuthUser = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role as any,
        institutionId: profileData.institution_id,
        schoolName: institutionInfo?.name,
        schoolType: institutionInfo?.school_type as any,
      };

      if (profileData.role === 'teacher') {
        user.subjectIds = subjectIds;
      } else if (profileData.role === 'student') {
        user.enrolledSubjectIds = subjectIds;
      }

      return { 
        user, 
        error: null, 
        mustChangePassword: profileData.must_change_password 
      };

    } catch (err: any) {
      return { user: null, error: err.message || 'Erro desconhecido ao fazer login' };
    }
  },

  /**
   * Realiza o logout no Supabase
   */
  async signOut() {
    await supabase.auth.signOut();
  }
};
