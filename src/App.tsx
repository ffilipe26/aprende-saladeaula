import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Activities from './components/Activities';
import Exams from './components/Exams';
import Members from './components/Members';
import Settings from './components/Settings';
import Insights from './components/Insights';
import ActivityDetail from './components/ActivityDetail';
import CalendarView from './components/CalendarView';
import { Activity, Exam, Notification, UserProfile } from './types';
import { INITIAL_ACTIVITIES, INITIAL_EXAMS } from './constants';
import ConfirmationModal from './components/ConfirmationModal';

export default function App() {
  // ==========================================
  // ESTADOS GLOBAIS DA APLICAÇÃO
  // ==========================================
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  
  // Dados principais (Atividades e Provas)
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  
  // Sistema de Notificações
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Bem-vindo!',
      message: 'Explore sua nova plataforma acadêmica inteligente.',
      time: 'Agora',
      type: 'system',
      read: false
    }
  ]);
  
  // Dados do Usuário
  const [userName, setUserName] = useState('Nome Aluno');
  const [userEmail, setUserEmail] = useState('nome.aluno@aprende.com');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ==========================================
  // FUNÇÕES DE AUTENTICAÇÃO E TEMA
  // ==========================================
  const handleLogout = () => {
    // Logic for logout would go here
    console.log('Logging out...');
    setShowLogoutModal(false);
  };

  // Efeito para carregar o tema salvo no localStorage
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

  // Alternar entre tema claro e escuro
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
  // GERENCIAMENTO DE NOTIFICAÇÕES
  // ==========================================
  const addNotification = (title: string, message: string, type: 'activity' | 'exam' | 'system') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: 'Agora',
      type,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // ==========================================
  // LÓGICA DE ATIVIDADES E PROVAS
  // ==========================================
  const handleStartActivity = (id: string) => {
    setSelectedActivity(id);
  };

  const handleStartExam = (id: string) => {
    setSelectedExam(id);
  };

  const handleFinishActivity = (id: string, score: number) => {
    setActivities(prev => prev.map(act => 
      act.id === id ? { ...act, status: 'Concluída', score } : act
    ));
    setSelectedActivity(null);
  };

  const handleFinishExam = (id: string, score: number) => {
    setExams(prev => prev.map(exam => 
      exam.id === id ? { ...exam, status: 'Concluída', grade: score.toFixed(1) } : exam
    ));
    setSelectedExam(null);
  };

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL DE TELAS
  // ==========================================
  const renderContent = () => {
    // Se uma atividade estiver selecionada, renderiza a tela de detalhes/execução
    if (selectedActivity) {
      const activity = activities.find(a => a.id === selectedActivity);
      if (activity) {
        return (
          <ActivityDetail 
            activity={activity}
            userName={userName}
            onBack={() => setSelectedActivity(null)} 
            onFinish={(score) => handleFinishActivity(activity.id, score)}
          />
        );
      }
    }

    // Se uma prova estiver selecionada, converte para o formato de atividade e renderiza
    if (selectedExam) {
      const exam = exams.find(e => e.id === selectedExam);
      if (exam) {
        const examAsActivity: Activity = {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          duration: exam.duration,
          deadlineDate: exam.deadlineDate,
          status: exam.status === 'Concluída' ? 'Concluída' : 'Pendente',
          image: exam.image,
          questions: exam.questions,
          totalPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 10,
          score: exam.grade !== undefined ? parseFloat(exam.grade) : undefined
        };
        return (
          <ActivityDetail 
            activity={examAsActivity}
            userName={userName}
            onBack={() => setSelectedExam(null)} 
            onFinish={(score) => handleFinishExam(exam.id, score)}
          />
        );
      }
    }

    // Navegação principal do Sidebar
    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard 
            activities={activities} 
            onStartActivity={handleStartActivity} 
            userName={userName} 
            onOpenCalendar={() => setActiveSection('calendar')} 
            onProfileClick={() => setActiveSection('settings')}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
          />
        );
      case 'lessons':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-12 rounded-3xl text-center max-w-md">
              <h2 className="text-3xl font-bold mb-4">Aulas</h2>
              <p className="text-[var(--text-muted)] text-lg italic">"Pensando no que vai ter ainda"</p>
            </div>
          </div>
        );
      case 'activities':
        return (
          <Activities 
            activities={activities}
            setActivities={setActivities}
            onStartActivity={handleStartActivity} 
            isDevMode={isDevMode}
            onAddActivity={(title) => addNotification('Nova Atividade', `A atividade "${title}" foi criada.`, 'activity')}
            userName={userName}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            onProfileClick={() => setActiveSection('settings')}
          />
        );
      case 'exams':
        return (
          <Exams 
            exams={exams} 
            setExams={setExams} 
            isDevMode={isDevMode} 
            onStartExam={handleStartExam}
            onAddExam={(title) => addNotification('Nova Prova', `A prova "${title}" foi criada.`, 'exam')}
            userName={userName}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            onProfileClick={() => setActiveSection('settings')}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            userName={userName}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            onProfileClick={() => setActiveSection('settings')}
          />
        );
      case 'insights':
        return <Insights />;
      case 'members':
        return (
          <Members 
            userName={userName}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
            onProfileClick={() => setActiveSection('settings')}
          />
        );
      case 'settings':
        return (
          <Settings 
            isDevMode={isDevMode} 
            setIsDevMode={setIsDevMode} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            userName={userName}
            setUserName={setUserName}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
          />
        );
      default:
        return (
          <Dashboard 
            activities={activities} 
            onStartActivity={handleStartActivity} 
            userName={userName} 
            onOpenCalendar={() => setActiveSection('calendar')} 
            onProfileClick={() => setActiveSection('settings')}
            notifications={notifications}
            onRemoveNotification={removeNotification}
            onMarkAsRead={markNotificationAsRead}
          />
        );
    }
  };

  // ==========================================
  // ESTRUTURA PRINCIPAL (LAYOUT)
  // ==========================================
  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      {/* Overlay para menu mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menu Lateral (Sidebar) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={(section) => {
            setActiveSection(section);
            setSelectedActivity(null);
            setIsSidebarOpen(false);
          }} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onLogout={() => setShowLogoutModal(true)}
        />
      </div>

      {/* Modal de Confirmação de Logout */}
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
      
      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Mobile */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--border)] md:hidden bg-[var(--bg-sidebar)] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 overflow-hidden rounded-xl">
              <img src="/logo.png" alt="Aprende+" className="w-full h-full object-contain scale-125" referrerPolicy="no-referrer" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Aprende+</h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[var(--text-muted)] hover:text-white"
          >
            <Moon className="hidden" /> {/* Ícone placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </header>

        {/* Container Dinâmico de Conteúdo */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* Botão Flutuante de Alternância de Tema */}
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
