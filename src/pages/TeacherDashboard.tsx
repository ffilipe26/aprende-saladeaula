import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Plus, 
  ArrowUpRight, 
  Sparkles,
  ClipboardList,
  PlayCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Header from '../components/layout/Header';
import { Subject, Activity, Exam, SchoolMember, Notification } from '../types';

interface TeacherDashboardProps {
  subjects: Subject[];
  activities: Activity[];
  exams: Exam[];
  schoolMembers: SchoolMember[];
  userName: string;
  userRole?: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  onNavigate: (section: string) => void;
  onCreateActivity?: () => void;
  onCreateExam?: () => void;
  isDarkMode: boolean;
}

export default function TeacherDashboard({
  subjects,
  activities,
  exams,
  schoolMembers,
  userName,
  userRole,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  onNavigate,
  onCreateActivity,
  onCreateExam,
  isDarkMode
}: TeacherDashboardProps) {
  // Calculando dados reais baseado nos mocks recebidos
  const totalStudentsEnrolled = new Set(subjects.flatMap(sub => sub.studentIds || [])).size;
  const totalSubjectsTaught = subjects.length;
  const totalActivitiesCreated = activities.length;
  
  // TODO: Buscar submissões reais do banco
  const pendingSubmissions: any[] = [];

  const teacherKpis = [
    { label: 'Total de Alunos', value: totalStudentsEnrolled, icon: Users, desc: 'Nas suas disciplinas', color: 'text-orange-500' },
    { label: 'Disciplinas Ativas', value: totalSubjectsTaught, icon: BookOpen, desc: 'Lecionando atualmente', color: 'text-emerald-500' },
    { label: 'Atividades Criadas', value: totalActivitiesCreated, icon: FileText, desc: 'Tarefas em andamento', color: 'text-blue-500' },
    { label: 'Para Corrigir', value: pendingSubmissions.length, icon: ClipboardList, desc: 'Entregas pendentes', color: 'text-pink-500' },
  ];

  // Framer Motion Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      {/* Header */}
      <Header 
        title="Painel de Ensino" 
        subtitle="Monitore o engajamento dos seus alunos e gerencie as aulas e exames das suas disciplinas." 
        userName={userName}
        userRole={userRole}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Seção Principal de Boas Vindas com Atalhos Rápidos */}
      <motion.div 
        variants={itemVariants}
        className={`border rounded-[32px] p-8 md:p-10 relative overflow-hidden flex flex-col xl:flex-row items-center justify-between gap-8 bg-gradient-to-br transition-all duration-300 ${
          isDarkMode 
            ? 'glass border-orange-500/10 from-orange-600/5' 
            : 'bg-white border-orange-500/20 from-orange-50/50 shadow-xl shadow-orange-100/10'
        } to-transparent`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 mesh-gradient opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="space-y-4 text-center xl:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-extrabold uppercase tracking-widest border border-orange-500/10">
            <Sparkles size={12} />
            Sala de Aula Inteligente
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight text-[var(--text-main)] leading-tight">
            Seu Hub de Ensino
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl font-medium">
            Crie novas tarefas para os seus alunos, adicione aulas gravadas ou leituras em formato PDF e acompanhe a taxa de aprovação nas provas em tempo real.
          </p>
        </div>
        
        {/* Ações Rápidas do Professor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto shrink-0 z-10">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreateActivity || (() => onNavigate('activities'))}
            className="sidebar-grad text-white p-5 rounded-2xl font-extrabold flex flex-col items-center justify-center gap-2.5 shadow-lg shadow-orange-600/25 transition-all text-center min-w-[130px]"
          >
            <Plus size={20} className="stroke-[2.5]" />
            <span className="text-xs tracking-wider uppercase font-black">Nova Atividade</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreateExam || (() => onNavigate('exam_creator'))}
            className={`border p-5 rounded-2xl font-extrabold flex flex-col items-center justify-center gap-2.5 transition-all text-center min-w-[130px] ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' 
                : 'bg-white hover:bg-slate-50 border-zinc-200 text-zinc-800 shadow-sm'
            }`}
          >
            <Plus size={20} className="stroke-[2.5] text-orange-500" />
            <span className="text-xs tracking-wider uppercase font-black">Nova Prova</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('lessons')}
            className={`border p-5 rounded-2xl font-extrabold flex flex-col items-center justify-center gap-2.5 transition-all text-center min-w-[130px] ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' 
                : 'bg-white hover:bg-slate-50 border-zinc-200 text-zinc-800 shadow-sm'
            }`}
          >
            <Plus size={20} className="stroke-[2.5] text-orange-500" />
            <span className="text-xs tracking-wider uppercase font-black">Nova Aula</span>
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teacherKpis.map((kpi, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            className={`border rounded-3xl p-6 group transition-all duration-300 ${
              isDarkMode 
                ? 'glass border-white/10 hover:border-orange-500/20' 
                : 'bg-white border-zinc-200 hover:border-orange-500/25 shadow-md shadow-zinc-100/50'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-3 rounded-2xl ${kpi.color} shadow-inner transition-colors duration-300 ${
                isDarkMode ? 'bg-zinc-800/80 ring-1 ring-white/5' : 'bg-slate-100 border border-zinc-150'
              }`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black font-display tracking-tight text-[var(--text-main)] mb-2">{kpi.value}</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-bold">{kpi.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid Inferior: Suas Disciplinas & Entregas Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Disciplinas Lecionadas */}
        <motion.div 
          variants={itemVariants}
          className={`lg:col-span-2 border rounded-[32px] p-8 space-y-6 transition-all duration-300 ${
            isDarkMode ? 'glass border-white/10' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'
          }`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-xl font-bold font-display">Suas Disciplinas</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Visão geral das turmas que você leciona.</p>
            </div>
            <button 
              onClick={() => onNavigate('lessons')}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              Criar Aula
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((sub) => (
              <div 
                key={sub.id} 
                className={`p-6 border rounded-2xl transition-all group flex flex-col justify-between ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/5 hover:border-orange-500/20' 
                    : 'bg-slate-50 border-zinc-200 hover:border-orange-500/25 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-extrabold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/10 tracking-widest uppercase">
                      {sub.code}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors mb-2 line-clamp-1">
                    {sub.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-6">
                    Turma com {sub.studentIds?.length || 0} alunos matriculados.
                  </p>
                </div>

                <div className={`flex justify-between items-center pt-4 border-t text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] transition-colors duration-300 ${
                  isDarkMode ? 'border-white/5' : 'border-zinc-150'
                }`}>
                  <span>Aulas Gravadas</span>
                  <span className="text-[var(--text-main)] flex items-center gap-1">
                    <PlayCircle size={14} className="text-orange-500" />
                    Ver Aulas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Entregas pendentes de correção */}
        <motion.div 
          variants={itemVariants}
          className={`border rounded-[32px] p-8 space-y-6 flex flex-col justify-between transition-all duration-300 ${
            isDarkMode ? 'glass border-white/10' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'
          }`}
        >
          <div className="space-y-6">
            <div className="pb-4 border-b border-[var(--border)]">
              <h3 className="text-xl font-bold font-display">Últimas Entregas</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Trabalhos acadêmicos aguardando nota.</p>
            </div>

            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className={`p-4 border rounded-2xl flex flex-col gap-3 group transition-all ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/5 hover:border-orange-500/20' 
                      : 'bg-slate-50 border-zinc-200 hover:border-orange-500/25 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors">{sub.studentName}</span>
                    <span className="text-[9px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                      <Clock size={10} />
                      {sub.date}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--text-muted)] line-clamp-1">{sub.activityTitle}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{sub.subject}</p>
                  </div>

                  <button className="w-full mt-1.5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest sidebar-grad text-white rounded-xl shadow-md shadow-orange-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Corrigir
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('activities')}
            className={`w-full py-4 text-center text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)] rounded-2xl transition-all border border-dashed mt-4 ${
              isDarkMode 
                ? 'hover:text-white hover:bg-white/5 border-white/10' 
                : 'hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'
            }`}
          >
            Ver Todas Atividades
          </button>
        </motion.div>
        
      </div>
    </motion.div>
  );
}
