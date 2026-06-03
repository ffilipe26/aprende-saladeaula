import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Exams from './pages/Exams';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Insights from './pages/Insights';
import ActivityDetail from './pages/ActivityDetail';
import CalendarView from './pages/CalendarView';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChangePassword from './pages/ChangePassword';
import InstitutionOnboarding from './pages/InstitutionOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ActivityCreator from './pages/ActivityCreator';
import ExamCreator from './pages/ExamCreator';
import Lessons from './pages/Lessons';
import Submissions from './pages/Submissions';
import SubmissionDetail from './pages/SubmissionDetail';
import { Activity, Exam, Notification, AuthUser, Subject, Lesson, SchoolMember, SchoolClass } from './types';
import {
  INITIAL_ACTIVITIES,
  INITIAL_EXAMS,
  MOCK_SUBJECTS,
  MOCK_LESSONS,
  MOCK_SCHOOL_MEMBERS,
  MOCK_CLASSES
} from './constants';
import ConfirmationModal from './components/ui/ConfirmationModal';
import { supabase } from './lib/supabase';
import { adminService } from './lib/adminService';

type PublicScreen = 'landing' | 'login' | 'register' | 'onboarding';

export default function App() {
  // ==========================================
  // ESTADOS DE AUTENTICAÇÃO
  // ==========================================
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [publicScreen, setPublicScreen] = useState<PublicScreen>('landing');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ==========================================
  // ESTADOS DE NAVEGAÇÃO E LAYOUT
  // ==========================================
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ==========================================
  // ESTADOS DE CONTEÚDO
  // ==========================================
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedActivityForGrading, setSelectedActivityForGrading] = useState<string | null>(null);
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<string | null>(null);
  const [gradingType, setGradingType] = useState<'activity' | 'exam' | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>([]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedAdminSubjectId, setSelectedAdminSubjectId] = useState<string | null>(null);

  // Sistema de Notificações
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Bem-vindo!',
      message: 'Explore sua nova plataforma acadêmica inteligente.',
      time: 'Agora',
      type: 'system',
      read: false,
    },
  ]);

  // ==========================================
  // TEMA
  // ==========================================
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.body.classList.add('light-mode');
    } else {
      setIsDarkMode(true);
      document.body.classList.remove('light-mode');
    }
  }, []);

  // ==========================================
  // RECUPERAÇÃO DE SESSÃO (F5) E EXPIRAÇÃO
  // ==========================================
  useEffect(() => {
    const checkSessionExpiry = async () => {
      const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 horas
      const lastActive = localStorage.getItem('last_active_time');
      const now = Date.now();

      if (lastActive) {
        const timeDiff = now - parseInt(lastActive, 10);
        if (timeDiff > SESSION_TIMEOUT_MS) {
          console.log('[Auth] Sessão expirou por inatividade.');
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error('[Auth] Erro ao deslogar sessão expirada:', e);
          } finally {
            localStorage.removeItem('last_active_time');
            setCurrentUser(null);
            setPublicScreen('landing');
            return;
          }
        }
      }

      // Se passou da verificação de expiração, tenta recuperar a sessão
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          // Atualiza o tempo de atividade se a sessão estiver ativa
          localStorage.setItem('last_active_time', String(Date.now()));

          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            const authUser: AuthUser = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role as any,
              institutionId: userData.institution_id
            };

            if (userData.must_change_password) {
              setCurrentUser(authUser);
              setIsChangingPassword(true);
            } else {
              // Re-executa o login final para puxar os dados de Turmas e Disciplinas
              finalizeLogin(authUser, false);
            }
          }
        }
      });
    };

    checkSessionExpiry();

    // 2. Escuta mudanças na autenticação (opcional, para lidar com logout em outra aba)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        setPublicScreen('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // SISTEMA REATIVO (SUPABASE REALTIME)
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;

    // Cria a assinatura para ficar ouvindo mudanças no banco de dados e evitar o F5
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => { 
          console.log('Mudança detectada em activities!', payload);
          handleReload(); 
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exams' },
        (payload) => { 
          console.log('Mudança detectada em exams!', payload);
          handleReload(); 
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_submissions' },
        (payload) => { 
          console.log('Mudança detectada em activity_submissions!', payload);
          handleReload(); 
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_submissions' },
        (payload) => { 
          console.log('Mudança detectada em exam_submissions!', payload);
          handleReload(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================
  const handleLogin = (user: AuthUser, requirePasswordChange: boolean = false, isDemoMode: boolean = false) => {
    setCurrentUser(user);
    
    if (requirePasswordChange) {
      setIsChangingPassword(true);
      return;
    }

    finalizeLogin(user, isDemoMode);
  };

  const loadInstitutionData = async (user: AuthUser) => {
    const instId = user.institutionId;
    if (!instId) {
      console.warn('[loadInstitutionData] No institutionId found, skipping data fetch.');
      return;
    }
    console.log('[loadInstitutionData] Loading data for institution:', instId);

    // 1. Fetch Users (todos da mesma instituição)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('institution_id', instId);
    if (usersError) console.error('[loadInstitutionData] Users error:', usersError);
    if (usersData) {
      setSchoolMembers(usersData.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role as any, status: 'ativo', joinedAt: u.created_at, classId: u.class_id
      })));
    }

    // 2. Fetch Classes
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('institution_id', instId);
    if (classesError) console.error('[loadInstitutionData] Classes error:', classesError);
    if (classesData) {
      setClasses(classesData.map(c => ({ id: c.id, name: c.name, shift: (c.shift || 'Manhã') as any })));
    }

    // 3. Fetch Subjects
    const { data: subData, error: subError } = await supabase
      .from('subjects')
      .select('*')
      .eq('institution_id', instId);
    if (subError) console.error('[loadInstitutionData] Subjects error:', subError);

    // 4. Fetch Enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('subject_enrollments')
      .select('*');
    if (enrollError) console.error('[loadInstitutionData] Enrollments error:', enrollError);

    if (subData) {
      setSubjects(subData.map(s => {
        const studentIds = enrollments ? enrollments.filter(e => e.subject_id === s.id).map(e => e.student_id) : [];
        return {
          id: s.id,
          classId: s.class_id,
          name: s.name,
          code: s.code,
          teacherId: s.teacher_id || '',
          teacherName: usersData?.find(u => u.id === s.teacher_id)?.name || 'Sem Professor',
          studentIds: studentIds
        };
      }));
    }

    // 5. Atualizar os enrollments do currentUser se ele for aluno ou teacher
    if (user.role === 'student' && enrollments) {
      const myEnrollments = enrollments.filter(e => e.student_id === user.id).map(e => e.subject_id);
      setCurrentUser(prev => prev ? { ...prev, enrolledSubjectIds: myEnrollments } : null);
    } else if (user.role === 'teacher' && subData) {
      const mySubjects = subData.filter(s => s.teacher_id === user.id).map(s => s.id);
      setCurrentUser(prev => prev ? { ...prev, subjectIds: mySubjects } : null);
    }

    // 6. Fetch Activities
    if (subData && subData.length > 0) {
      const subjectIds = subData.map(s => s.id);
      
      const { data: actData, error: actError } = await supabase
        .from('activities')
        .select('*')
        .in('subject_id', subjectIds);
        
      if (actError) console.error('[loadInstitutionData] Activities error:', actError);
      
      // Fetch submissions if student
      let mySubmissions: any[] = [];
      if (user.role === 'student') {
        const { data: submData } = await supabase
          .from('activity_submissions')
          .select('activity_id, status')
          .eq('student_id', user.id);
        if (submData) mySubmissions = submData;
      }

      if (actData) {
        setActivities(actData.map(a => {
          let studentStatus = a.status === 'published' ? 'Pendente' : a.status;
          if (user.role === 'student' && mySubmissions.some(s => s.activity_id === a.id)) {
            studentStatus = 'Concluída';
          }

          const cleanedQuestions = user.role === 'student' && studentStatus !== 'Concluída'
            ? (a.questions || []).map(({ correctAnswer, ...q }: any) => q)
            : a.questions || [];

          return {
            id: a.id,
            title: a.title,
            subjectId: a.subject_id,
            teacherId: a.teacher_id,
            subject: (subData ?? []).find((s: any) => s.id === a.subject_id)?.name || 'Disciplina',
            instructions: a.instructions,
            deadlineDate: a.deadline_date,
            status: studentStatus as any,
            questions: cleanedQuestions,
            totalPoints: a.total_points,
            createdAt: a.created_at
          };
        }));
      }

      // 7. Fetch Exams
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .in('subject_id', subjectIds);
        
      if (examError) console.error('[loadInstitutionData] Exams error:', examError);
      
      // Fetch exam submissions if student
      let myExamSubmissions: any[] = [];
      if (user.role === 'student') {
        console.log('[loadInstitutionData] Fetching exam submissions for student ID:', user.id);
        const { data: examSubmData, error: examSubmError } = await supabase
          .from('exam_submissions')
          .select('*') // Seleciona todas as colunas de forma resiliente para evitar erro de coluna inexistente
          .eq('student_id', user.id);
        
        if (examSubmError) {
          console.error('[loadInstitutionData] Error fetching exam submissions from Supabase:', examSubmError);
        } else if (examSubmData) {
          myExamSubmissions = examSubmData;
          console.log('[loadInstitutionData] Student exam submissions successfully fetched:', examSubmData);
        }
      }

      if (examData) {
        // AUTO-SUBMIT: Se o aluno tem um rascunho de prova iniciada mas não enviada
        // e a janela já encerrou, fazer auto-submit silencioso ANTES de mapear os status
        if (user.role === 'student') {
          for (const e of examData) {
            const deadline = e.deadline_date ? new Date(e.deadline_date) : null;
            if (!deadline || new Date() <= deadline) continue; // Prova ainda aberta
            
            const alreadySubmitted = myExamSubmissions.some(s => s.exam_id === e.id);
            if (alreadySubmitted) continue; // Já enviou
            
            const startKey = `started_at_${e.id}_${user.id}`;
            const draftKey = `draft_${e.id}_${user.id}`;
            const savedStart = localStorage.getItem(startKey);
            const savedDraft = localStorage.getItem(draftKey);
            
            if (savedStart) {
              // Prova foi iniciada mas não enviada — auto-submit com as respostas do draft
              console.log(`[AutoSubmit] Prova expirada com rascunho: ${e.title}`);
              localStorage.removeItem(startKey);
              localStorage.removeItem(draftKey);
              try {
                const answers = savedDraft ? JSON.parse(savedDraft) : {};
                // Calcular pontuação automática
                const questions: any[] = e.questions || [];
                let autoScore = 0;
                questions.forEach((q: any) => {
                  const userAnswer = answers[q.id];
                  if (q.type === 'multiple_choice') {
                    const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean);
                    if (correctAnswers.length > 0) {
                      const pointsPerCorrect = q.points / correctAnswers.length;
                      userAnswers.forEach((ua: string) => {
                        if (correctAnswers.includes(ua)) autoScore += pointsPerCorrect;
                      });
                    }
                  } else if (q.type === 'true_false') {
                    if (userAnswer === q.correctAnswer) autoScore += q.points;
                  }
                });
                
                const { data: autoSubData } = await supabase.from('exam_submissions').insert([{
                  exam_id: e.id,
                  student_id: user.id,
                  answers,
                  auto_score: autoScore,
                  status: 'late' // Auto-submit após prazo = sempre late
                }]).select('*').single();
                
                // Adicionar à lista local para o mapeamento de status funcionar
                if (autoSubData) myExamSubmissions = [...myExamSubmissions, autoSubData];
                
                console.log(`[AutoSubmit] Prova auto-submetida com sucesso: ${e.title}`);
              } catch (autoSubmitErr) {
                console.error('[AutoSubmit] Erro ao auto-submeter prova:', autoSubmitErr);
              }
            }
          }
        }

        setExams(examData.map(e => {
          let studentStatus = e.status === 'published' ? 'Disponível' : (e.status || 'Disponível');
          let grade: string | undefined = undefined;
          let submittedAt: string | undefined = undefined;

          if (user.role === 'student') {
            const submission = myExamSubmissions.find(s => s.exam_id === e.id);
            if (submission) {
              // Aluno já realizou a prova
              studentStatus = 'Concluída';
              if (submission.status === 'graded') {
                const finalScore = submission.final_score != null ? submission.final_score : (submission.auto_score || 0);
                grade = finalScore.toFixed(1);
              }
              submittedAt = submission.submitted_at || submission.created_at || submission.graded_at || new Date().toISOString();
            } else {
              // Aluno não realizou — verificar se a janela de acesso expirou
              const now = new Date();
              const deadline = e.deadline_date ? new Date(e.deadline_date) : null;
              if (deadline && now > deadline) {
                // Prazo encerrado e aluno não fez: marcar como 'Encerrada'
                studentStatus = 'Encerrada';
              }
            }
          }

          const cleanedQuestions = user.role === 'student' && studentStatus !== 'Concluída'
            ? (e.questions || []).map(({ correctAnswer, ...q }: any) => q)
            : e.questions || [];

          return {
            id: e.id,
            title: e.title,
            subjectId: e.subject_id,
            teacherId: e.teacher_id,
            subject: (subData ?? []).find((s: any) => s.id === e.subject_id)?.name || 'Disciplina',
            instructions: e.instructions,
            duration: String(e.duration_minutes || '60'),
            questionsCount: e.questions ? e.questions.length : 0,
            startDate: e.start_date,
            deadlineDate: e.deadline_date,
            weight: String(e.weight),
            image: e.image,
            questions: cleanedQuestions,
            totalPoints: e.total_points || (e.questions ? e.questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0) : 10),
            status: studentStatus as any,
            grade,
            submittedAt
          };
        }));
      }

      // 8. Fetch Lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('subject_id', subjectIds);
        
      if (lessonsError) console.error('[loadInstitutionData] Lessons error:', lessonsError);
      if (lessonsData) {
        setLessons(lessonsData.map(l => ({
          id: l.id,
          subjectId: l.subject_id,
          subjectName: (subData ?? []).find(s => s.id === l.subject_id)?.name || 'Disciplina',
          title: l.title,
          description: l.description || '',
          type: l.type as any,
          url: l.url,
          date: l.published_at ? new Date(l.published_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          duration: l.duration || undefined
        })));
      }
    }
  };

  const finalizeLogin = (user: AuthUser, isDemoMode: boolean) => {
    setIsChangingPassword(false);
    setCurrentUser(user);
    setPublicScreen('landing');
    setActiveSection('dashboard');
    localStorage.setItem('last_active_time', String(Date.now()));

    if (!isDemoMode) {
      // MODO REAL: Limpa todos os dados Mocks da tela para começar zerado e busca dados reais
      setActivities([]);
      setExams([]);
      setClasses([]);
      setSubjects([]);
      setLessons([]);
      setNotifications([]);
      setSchoolMembers([]);
      loadInstitutionData(user);
    } else {
      // MODO DEMO: Restaura os dados mocks caso tenha alternado
      setActivities(INITIAL_ACTIVITIES);
      setExams(INITIAL_EXAMS);
      setSchoolMembers(MOCK_SCHOOL_MEMBERS);
      setClasses(MOCK_CLASSES);
      setSubjects(MOCK_SUBJECTS);
      setLessons(MOCK_LESSONS);
    }
    // Notificação de boas-vindas personalizada
    const roleLabel = user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Professor' : 'Aluno';
    addNotification(
      `Bem-vindo, ${user.name.split(' ')[0]}!`,
      `Você entrou como ${roleLabel}${user.schoolName ? ` — ${user.schoolName}` : ''}.`,
      'system',
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao efetuar signOut no Supabase:', err);
    } finally {
      localStorage.removeItem('last_active_time');
      setCurrentUser(null);
      setPublicScreen('landing');
      setShowLogoutModal(false);
      setActiveSection('dashboard');
      setNotifications([]);
    }
  };

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================
  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: 'Agora',
      type,
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // ==========================================
  // ATIVIDADES E PROVAS
  // ==========================================
  const handleStartActivity = (id: string) => setSelectedActivity(id);
  const handleStartExam = (id: string) => setSelectedExam(id);

  const handleFinishActivity = (id: string, score: number) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, status: 'Concluída', score } : act)),
    );
    setSelectedActivity(null);
  };

  const handleFinishExam = (id: string, score: number) => {
    setExams((prev) =>
      prev.map((exam) => (exam.id === id ? { ...exam, status: 'Concluída', grade: score.toFixed(1) } : exam)),
    );
    setSelectedExam(null);
  };

  const handleGradeActivity = (id: string, type: 'activity' | 'exam') => {
    setSelectedActivityForGrading(id);
    setGradingType(type);
  };

  const handleReload = async (createdSubjectId?: string) => {
    if (currentUser) {
      await loadInstitutionData(currentUser);
      if (createdSubjectId) {
        setSelectedAdminSubjectId(createdSubjectId);
      }
    }
  };

  // ==========================================
  // PROPS COMUNS DE HEADER/NOTIFICAÇÃO
  // ==========================================
  const commonHeaderProps = {
    userName: currentUser?.name ?? '',
    userRole: currentUser?.role,
    notifications,
    onRemoveNotification: removeNotification,
    onMarkAsRead: markNotificationAsRead,
    onProfileClick: () => setActiveSection('settings'),
  };

  // ==========================================
  // DADOS FILTRADOS POR ROLE
  // ==========================================
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  // Atividades visíveis pelo aluno (disciplinas em que está matriculado)
  const studentActivities = isStudent
    ? activities.filter(
        (a) =>
          !a.subjectId ||
          (currentUser?.enrolledSubjectIds ?? []).includes(a.subjectId),
      )
    : activities;

  // Atividades visíveis pelo professor (criadas por ele)
  const teacherActivities = isTeacher
    ? activities.filter((a) => !a.teacherId || a.teacherId === currentUser?.id)
    : activities;

  // Disciplinas relevantes para o usuário
  const userSubjects = isAdmin
    ? subjects
    : isTeacher
      ? subjects.filter((s) => (currentUser?.subjectIds ?? []).includes(s.id))
      : subjects.filter((s) => (currentUser?.enrolledSubjectIds ?? []).includes(s.id));

  // Aulas relevantes para o usuário
  const userLessons = isAdmin
    ? lessons
    : lessons.filter((l) => userSubjects.some((s) => s.id === l.subjectId));

  // ==========================================
  // RENDERIZAÇÃO DE CONTEÚDO POR SEÇÃO
  // ==========================================
  const renderContent = () => {
    // Tela de execução de atividade
    if (selectedActivity) {
      const activity = activities.find((a) => a.id === selectedActivity);
      if (activity) {
        return (
          <ActivityDetail
            activity={activity}
            currentUser={currentUser}
            onBack={() => setSelectedActivity(null)}
            onFinish={(score) => {
              // Sincroniza o estado local para mover de Pendentes para Concluídas
              handleFinishActivity(activity.id, score || 0);
            }}
            isDarkMode={isDarkMode}
          />
        );
      }
    }

    // Tela de execução de prova
    if (selectedExam) {
      const exam = exams.find((e) => e.id === selectedExam);
      if (exam) {
        const examAsActivity: Activity = {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          subjectId: exam.subjectId || '',
          teacherId: exam.teacherId || '',
          deadlineDate: exam.deadlineDate,
          status: exam.status === 'Concluída' ? 'Concluída' : 'Pendente',
          questions: exam.questions,
          totalPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 10,
          // Propagamos extras para o temporizador e visualizações
          ...(exam.startDate && { startDate: exam.startDate } as any),
          ...(exam.duration && { duration: exam.duration } as any),
          ...(exam.weight && { weight: exam.weight } as any),
        } as any;
        return (
          <ActivityDetail
            activity={examAsActivity}
            currentUser={currentUser!}
            isExam={true}
            onBack={() => setSelectedExam(null)}
            onFinish={(score) => {
              handleFinishExam(exam.id, score || 0);
            }}
            isDarkMode={isDarkMode}
          />
        );
      }
    }

    if (selectedSubmissionForGrading && selectedActivityForGrading && gradingType) {
      const parentList = gradingType === 'exam' ? exams : activities;
      const activityToGrade = parentList.find(a => a.id === selectedActivityForGrading) as any;
      if (activityToGrade) {
        return (
          <SubmissionDetail
            activity={activityToGrade}
            isExam={gradingType === 'exam'}
            submissionId={selectedSubmissionForGrading}
            onBack={() => setSelectedSubmissionForGrading(null)}
            isDarkMode={isDarkMode}
          />
        );
      }
    }

    if (selectedActivityForGrading && gradingType) {
      const parentList = gradingType === 'exam' ? exams : activities;
      const activityToGrade = parentList.find(a => a.id === selectedActivityForGrading) as any;
      if (activityToGrade) {
        return (
          <Submissions
            activity={activityToGrade}
            isExam={gradingType === 'exam'}
            currentUser={currentUser!}
            onBack={() => {
              setSelectedActivityForGrading(null);
              setGradingType(null);
            }}
            onGradeSubmission={(subId) => setSelectedSubmissionForGrading(subId)}
            isDarkMode={isDarkMode}
          />
        );
      }
    }

    // Navegação por seção
    switch (activeSection) {
      case 'activity_creator':
        if (isTeacher) {
          return (
            <ActivityCreator 
              currentUser={currentUser!}
              subjects={userSubjects}
              onBack={() => setActiveSection('dashboard')}
              onNavigate={setActiveSection}
              onReload={handleReload}
              isDarkMode={isDarkMode}
            />
          );
        }
        return null;

      case 'exam_creator':
        if (isTeacher) {
          return (
            <ExamCreator 
              currentUser={currentUser!}
              subjects={userSubjects}
              onBack={() => setActiveSection('exams')}
              onNavigate={setActiveSection}
              onReload={handleReload}
              isDarkMode={isDarkMode}
            />
          );
        }
        return null;

      case 'dashboard':
        if (isAdmin) {
          return (
            <AdminDashboard
              currentUser={currentUser}
              classes={classes}
              setClasses={setClasses}
              subjects={subjects}
              setSubjects={setSubjects}
              schoolMembers={schoolMembers}
              setSchoolMembers={setSchoolMembers}
              activities={activities}
              {...commonHeaderProps}
              onNavigate={setActiveSection}
              isDarkMode={isDarkMode}
            />
          );
        }
        if (isTeacher) {
          return (
            <TeacherDashboard
              subjects={userSubjects}
              activities={teacherActivities}
              exams={exams.filter((e) => !e.teacherId || e.teacherId === currentUser?.id)}
              schoolMembers={schoolMembers}
              {...commonHeaderProps}
              onNavigate={setActiveSection}
              onCreateActivity={() => setActiveSection('activity_creator')}
              onCreateExam={() => setActiveSection('exam_creator')}
              isDarkMode={isDarkMode}
            />
          );
        }
        // Student dashboard
        return (
          <Dashboard
            activities={studentActivities}
            onStartActivity={handleStartActivity}
            userName={currentUser?.name ?? ''}
            role={currentUser.role}
            onOpenCalendar={() => setActiveSection('calendar')}
            onProfileClick={() => setActiveSection('settings')}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            isDarkMode={isDarkMode}
          />
        );

      case 'lessons':
        return (
          <Lessons
            lessons={userLessons}
            subjects={userSubjects}
            canCreate={isTeacher || isAdmin}
            onAddLesson={async (lesson) => {
              if (!currentUser) return;
              const { data, error } = await adminService.createLesson({
                subjectId: lesson.subjectId,
                teacherId: currentUser.id,
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                url: lesson.url,
                duration: lesson.duration
              });

              if (error) {
                console.error('[AddLesson] Erro ao salvar aula:', error);
                alert('Erro ao salvar aula no Supabase: ' + error);
                return;
              }

              if (data) {
                const savedLesson: Lesson = {
                  id: data.id,
                  subjectId: data.subject_id,
                  subjectName: subjects.find(s => s.id === data.subject_id)?.name || 'Disciplina',
                  title: data.title,
                  description: data.description || '',
                  type: data.type as any,
                  url: data.url,
                  date: data.published_at ? new Date(data.published_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                  duration: data.duration || undefined
                };
                setLessons((prev) => [savedLesson, ...prev]);
                addNotification(
                  'Nova Aula Publicada!',
                  `A aula "${lesson.title}" foi adicionada.`,
                  'system'
                );
              }
            }}
            onDeleteLesson={async (lessonId) => {
              const { error } = await adminService.deleteLesson(lessonId);
              if (error) {
                console.error('[DeleteLesson] Erro ao excluir aula:', error);
                alert('Erro ao excluir aula: ' + error);
                return;
              }
              setLessons((prev) => prev.filter((l) => l.id !== lessonId));
              addNotification(
                'Aula Excluída',
                'A aula foi removida com sucesso.',
                'system'
              );
            }}
            selectedAdminSubjectId={isAdmin || isTeacher ? selectedAdminSubjectId : undefined}
            setSelectedAdminSubjectId={isAdmin || isTeacher ? setSelectedAdminSubjectId : undefined}
            isDarkMode={isDarkMode}
            {...commonHeaderProps}
          />
        );

      case 'activities':
        return (
          <Activities
            activities={isTeacher ? teacherActivities : isAdmin ? activities : studentActivities}
            setActivities={setActivities}
            onStartActivity={isTeacher || isAdmin ? (id) => handleGradeActivity(id, 'activity') : handleStartActivity}
            canCreate={isTeacher || isAdmin}
            onAddActivity={handleReload}
            selectedAdminSubjectId={isAdmin || isTeacher ? selectedAdminSubjectId : undefined}
            setSelectedAdminSubjectId={isAdmin || isTeacher ? setSelectedAdminSubjectId : undefined}
            subjects={userSubjects}
            onNavigate={setActiveSection}
            {...commonHeaderProps}
            onReload={handleReload}
            isDarkMode={isDarkMode}
          />
        );

      case 'exams':
        return (
          <Exams
            exams={isTeacher ? exams.filter((e) => !e.teacherId || e.teacherId === currentUser?.id) : exams}
            setExams={setExams}
            canCreate={isTeacher || isAdmin}
            onStartExam={isTeacher || isAdmin ? (id) => handleGradeActivity(id, 'exam') : handleStartExam}
            onAddExam={handleReload}
            selectedAdminSubjectId={isAdmin || isTeacher ? selectedAdminSubjectId : undefined}
            setSelectedAdminSubjectId={isAdmin || isTeacher ? setSelectedAdminSubjectId : undefined}
            subjects={userSubjects}
            {...commonHeaderProps}
            onReload={handleReload}
            onNavigate={setActiveSection}
            isDarkMode={isDarkMode}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            userName={currentUser?.name ?? ''}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            onProfileClick={() => setActiveSection('settings')}
            isDarkMode={isDarkMode}
          />
        );

      case 'insights':
        return (
          <Insights
            userRole={currentUser?.role ?? 'student'}
            activities={isTeacher ? teacherActivities : isAdmin ? activities : studentActivities}
            subjects={userSubjects}
            schoolMembers={schoolMembers}
            selectedAdminSubjectId={selectedAdminSubjectId}
            {...commonHeaderProps}
            isDarkMode={isDarkMode}
          />
        );

      case 'members':
        return (
          <AdminPanel
            currentUser={currentUser}
            classes={classes}
            schoolMembers={schoolMembers}
            setSchoolMembers={setSchoolMembers}
            subjects={subjects}
            setSubjects={setSubjects}
            userRole={currentUser?.role ?? 'student'}
            {...commonHeaderProps}
            isDarkMode={isDarkMode}
          />
        );

      case 'settings':
        return (
          <Settings
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            userName={currentUser?.name ?? ''}
            setUserName={(name) => setCurrentUser((prev) => prev ? { ...prev, name } : prev)}
            userEmail={currentUser?.email ?? ''}
            setUserEmail={(email) => setCurrentUser((prev) => prev ? { ...prev, email } : prev)}
            onBack={() => setActiveSection('dashboard')}
          />
        );

      default:
        return null;
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  if (!currentUser) {
    if (publicScreen === 'landing') {
      return (
        <LandingPage 
          onNavigate={(s) => setPublicScreen(s as PublicScreen)} 
          isDarkMode={isDarkMode} 
          onToggleTheme={toggleTheme} 
        />
      );
    }
    if (publicScreen === 'onboarding') {
      return (
        <InstitutionOnboarding
          onBack={() => setPublicScreen('login')}
          onComplete={(user, mustChange, isDemo) => handleLogin(user, mustChange, isDemo)}
          isDarkMode={isDarkMode}
        />
      );
    }
    return (
      <AuthPage
        mode={publicScreen === 'register' ? 'register' : 'login'}
        onNavigate={(s) => setPublicScreen(s as PublicScreen)}
        onLogin={handleLogin}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (isChangingPassword) {
    return (
      <ChangePassword 
        userName={currentUser.name} 
        onSuccess={() => finalizeLogin(currentUser, false)} 
        isDarkMode={isDarkMode}
      />
    );
  }

  // ==========================================
  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeSection={activeSection}
          setActiveSection={(section) => {
            setActiveSection(section);
            localStorage.setItem('last_active_time', String(Date.now()));
            setSelectedActivity(null);
            setSelectedExam(null);
            setSelectedActivityForGrading(null);
            setSelectedSubmissionForGrading(null);
            setGradingType(null);
            setIsSidebarOpen(false);
          }}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onLogout={() => setShowLogoutModal(true)}
          userRole={currentUser.role}
          userName={currentUser.name}
          userEmail={currentUser.email}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Modal de Logout */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Tem certeza que quer sair?"
        message="Você precisará fazer login novamente para acessar sua conta."
        confirmText="Sim, sair"
        cancelText="Não, voltar"
        variant="warning"
      />

      {/* Área de conteúdo */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--border)] md:hidden bg-[var(--bg-sidebar)] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 overflow-hidden rounded-xl">
              <img
                src="/logo.png"
                alt="Aprende+"
                className="w-full h-full object-contain scale-125"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Aprende+</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[var(--text-muted)] hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Conteúdo dinâmico */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">{renderContent()}</div>
      </main>

      {/* Botão flutuante de tema */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--floating-btn)] border border-[var(--border)] text-orange-500 shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
        title="Alternar Tema"
      >
        {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
      </button>
    </div>
  );
}
