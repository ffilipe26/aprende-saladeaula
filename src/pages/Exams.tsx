import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Clock, Calendar, Play, CheckCircle2, Trophy, Plus, Trash2, ChevronRight, FileText, GraduationCap, ArrowUpRight, ChevronDown, BookOpen, Lock, AlertTriangle, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Notification, Subject } from '../types';
import Header from '../components/layout/Header';
import { getTimeRemaining, formatDate } from '../utils/dateUtils';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { adminService } from '../lib/adminService';

interface ExamsProps {
  exams: Exam[];
  setExams: Dispatch<SetStateAction<Exam[]>>;
  canCreate?: boolean;
  onStartExam: (id: string) => void;
  onAddExam?: (title: string) => void;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  selectedAdminSubjectId?: string | null;
  setSelectedAdminSubjectId?: (id: string | null) => void;
  subjects?: Subject[];
  userRole?: string;
  onReload?: () => void;
  onNavigate?: (section: string) => void;
  isDarkMode: boolean;
}

const Exams = ({ 
  exams, 
  setExams, 
  canCreate, 
  onStartExam,
  onAddExam,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  selectedAdminSubjectId,
  setSelectedAdminSubjectId,
  subjects = [],
  userRole,
  onReload,
  onNavigate,
  isDarkMode
}: ExamsProps) => {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  const isAdminView = setSelectedAdminSubjectId !== undefined;

  const confirmDelete = async () => {
    if (examToDelete) {
      const res = await adminService.deleteExam(examToDelete);
      if (!res.error) {
        setExams(prev => prev.filter(e => e.id !== examToDelete));
        if (onReload) onReload();
      } else {
        alert('Erro ao excluir: ' + res.error);
      }
      setExamToDelete(null);
    }
  };

  // ==========================================
  // FILTRAGEM DE PROVAS E ANIMAÇÕES
  // ==========================================
  const targetExams = isAdminView
    ? (selectedAdminSubjectId ? exams.filter(e => e.subjectId === selectedAdminSubjectId) : exams)
    : exams;

  const now = new Date();
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  // Prova disponível/ativa: status Disponível (se aluno), prazo não expirou e início já ocorreu
  const availableExams = targetExams.filter(e => {
    if (isTeacherOrAdmin) {
      if (new Date(e.deadlineDate) <= now) return false;
      if (e.startDate && new Date(e.startDate) > now) return false;
      return true;
    }
    if (e.status !== 'Disponível') return false;
    if (new Date(e.deadlineDate) <= now) return false;
    if (e.startDate && new Date(e.startDate) > now) return false;
    return true;
  });

  // Provas agendadas (somente para professores/admins): prazo de início no futuro
  const scheduledExams = isTeacherOrAdmin
    ? targetExams.filter(e => e.startDate && new Date(e.startDate) > now && new Date(e.deadlineDate) > now)
    : [];

  // Prova encerrada: status Encerrada (aluno) ou prazo expirado (docente)
  const expiredExams = targetExams.filter(e => {
    if (isTeacherOrAdmin) {
      return new Date(e.deadlineDate) <= now;
    }
    return e.status === 'Encerrada';
  });

  // Prova concluída: aluno já realizou (somente alunos)
  const completedExams = isTeacherOrAdmin
    ? []
    : targetExams.filter(e => e.status === 'Concluída');

  // Countdown em tempo real
  useEffect(() => {
    const calcCountdowns = () => {
      const updated: Record<string, string> = {};
      
      // Countdown para ativas
      availableExams.forEach(exam => {
        const deadline = new Date(exam.deadlineDate);
        const diffMs = deadline.getTime() - Date.now();
        if (diffMs <= 0) {
          updated[exam.id] = 'Encerrado';
          return;
        }
        const totalSec = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) {
          updated[exam.id] = `${h}h ${m}min restantes`;
        } else if (m > 0) {
          updated[exam.id] = `Encerra em ${m}min ${s}s`;
        } else {
          updated[exam.id] = `Encerra em ${s}s`;
        }
      });

      // Countdown para agendadas
      scheduledExams.forEach(exam => {
        if (!exam.startDate) return;
        const start = new Date(exam.startDate);
        const diffMs = start.getTime() - Date.now();
        if (diffMs <= 0) {
          updated[exam.id] = 'Iniciando...';
          return;
        }
        const totalSec = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) {
          updated[exam.id] = `Começa em ${h}h ${m}min`;
        } else if (m > 0) {
          updated[exam.id] = `Começa em ${m}min ${s}s`;
        } else {
          updated[exam.id] = `Começa em ${s}s`;
        }
      });

      setCountdowns(updated);
    };
    calcCountdowns();
    const interval = setInterval(calcCountdowns, 1000);
    return () => clearInterval(interval);
  }, [availableExams, scheduledExams]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16"
    >
      {/* Cabeçalho da Página */}
      <Header 
        title="Provas e Exames" 
        subtitle="Gerencie seus exames finais e avaliações periódicas." 
        userName={userName}
        userRole={userRole}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Título e Botão de Criar Prova */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <motion.div variants={item}>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-display">Provas e Exames</h1>
          <p className="text-[var(--text-muted)] mt-3 font-medium text-lg">Gerencie seus exames finais e avaliações periódicas.</p>
        </motion.div>
        
        <motion.div variants={item} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          {canCreate && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) {
                  onNavigate('exam_creator');
                }
              }}
              className="sidebar-grad text-white px-8 py-4 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all justify-center"
            >
              <Plus size={20} />
              Criar Prova
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Seletor de Turma Dropdown para Administrador */}
      {isAdminView && setSelectedAdminSubjectId && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Filtro de Gestão</p>
              <h4 className="text-sm font-bold text-[var(--text-main)]">Selecione uma Disciplina / Turma</h4>
            </div>
          </div>
          <div className="relative w-full sm:w-80">
            <select
              value={selectedAdminSubjectId || 'all'}
              onChange={(e) => setSelectedAdminSubjectId(e.target.value === 'all' ? null : e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-3 px-5 text-xs font-bold text-[var(--text-main)] appearance-none pr-12 focus:outline-none focus:border-orange-500/50 transition-all cursor-pointer"
            >
              <option value="all">Ver Todas as Turmas (Grid)</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </motion.div>
      )}

      {/* Grid de Turmas para Admin quando nenhuma turma está selecionada */}
      {isAdminView && selectedAdminSubjectId === null ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {subjects.map(sub => {
            const subExams = exams.filter(e => e.subjectId === sub.id);
            const availableCount = subExams.filter(e => e.status === 'Disponível').length;
            const completedCount = subExams.filter(e => e.status === 'Concluída').length;
            return (
              <motion.div
                key={sub.id}
                variants={item}
                onClick={() => setSelectedAdminSubjectId?.(sub.id)}
                className={`border rounded-3xl p-8 transition-all cursor-pointer group flex flex-col justify-between h-56 hover:shadow-2xl hover:shadow-orange-600/5 ${
                  isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold text-orange-500 bg-orange-500/10 px-3 py-1 rounded border border-orange-500/10 tracking-widest uppercase">
                      {sub.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[var(--text-main)] group-hover:text-orange-500 transition-colors line-clamp-2">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-bold mt-2">
                    Professor(a): {sub.teacherName}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mt-4">
                  <span>Provas / Avaliações</span>
                  <span className="text-orange-500 flex items-center gap-2">
                    <span className="text-emerald-500">{completedCount} Feitas</span> • <span className="text-orange-500">{availableCount} Ativas</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <>
          {/* Seção de Próximas Provas (Disponíveis) */}
          <section>
            <div className="flex items-center justify-between mb-10 px-2">
              <h2 className="text-2xl font-extrabold font-display flex items-center gap-4">
                Próximas Provas
                <span className="bg-orange-500/10 text-orange-500 text-[10px] font-extrabold px-3 py-1 rounded-full border border-orange-500/10 tracking-widest uppercase">
                  {availableExams.length} {isTeacherOrAdmin ? 'Ativas' : 'Disponíveis'}
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {availableExams.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`lg:col-span-2 text-center py-20 border rounded-[32px] max-w-lg mx-auto relative overflow-hidden group transition-all duration-300 ${
                      isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50 shadow-sm'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <GraduationCap size={32} />
                    </div>
                    <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-2 font-display">
                      {isTeacherOrAdmin ? 'Nenhuma prova ativa' : 'Tudo sob controle!'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-bold max-w-xs mx-auto leading-relaxed">
                      {isTeacherOrAdmin 
                        ? 'Não há nenhuma prova sendo realizada pelos alunos neste momento.' 
                        : 'Você não tem nenhuma prova disponível para realizar no momento. Relaxe e aproveite!'}
                    </p>
                  </motion.div>
                ) : (
                  availableExams.map((exam) => (
                    <motion.div 
                      key={exam.id} 
                      variants={item}
                      layout
                      className={`border rounded-2xl overflow-hidden group transition-all shadow-lg hover:shadow-orange-600/5 ${
                        isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50'
                      }`}
                    >
                      <div className="h-64 overflow-hidden relative bg-zinc-900 flex items-center justify-center">
                        {exam.image ? (
                          <img src={exam.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="absolute inset-0 mesh-gradient opacity-20 group-hover:opacity-40 transition-opacity" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        
                        <div className="absolute top-6 left-6">
                          <span className="text-[10px] font-extrabold bg-orange-600 text-white px-4 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-lg shadow-orange-600/30">
                            {exam.subject}
                          </span>
                        </div>
 
                        {canCreate && (
                          <div className="absolute top-6 right-6 flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExamToDelete(exam.id);
                              }}
                              className={`p-3 border rounded-2xl text-white hover:bg-red-500 transition-all cursor-pointer ${
                                isDarkMode ? 'glass border-white/10' : 'bg-black/40 border-black/10 hover:border-red-500'
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
 
                        <div className="absolute bottom-8 left-8 right-8">
                          <h3 className="text-3xl font-extrabold text-white font-display tracking-tight group-hover:text-orange-500 transition-colors">{exam.title}</h3>
                        </div>
                      </div>
                      
                      <div className="p-10">
                        {/* Countdown em tempo real */}
                        {countdowns[exam.id] && (
                          <div className="flex items-center gap-2 mb-6 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2.5">
                            <Timer size={14} className="text-orange-400 animate-pulse shrink-0" />
                            <span className="text-sm font-extrabold text-orange-400">{countdowns[exam.id]}</span>
                          </div>
                        )}
 
                        <div className="grid grid-cols-2 gap-8 mb-10">
                          {/* Janela de Acesso */}
                          <div className="space-y-1 col-span-2">
                            <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                              <Calendar size={14} className="text-orange-500" /> Janela de Acesso
                            </p>
                            <p className="text-sm font-bold">
                              {exam.startDate ? formatDate(exam.startDate) : '—'}
                              <span className="text-orange-500 mx-2">→</span>
                              {formatDate(exam.deadlineDate)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-orange-500" /> Questões
                            </p>
                            <p className="text-lg font-bold">{exam.questionsCount} itens</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                              <Trophy size={14} className="text-orange-500" /> Nota / Peso
                            </p>
                            <p className="text-lg font-bold">
                              {isTeacherOrAdmin 
                                ? `Peso ${exam.weight || '1.0'}` 
                                : (exam.grade ? `${exam.grade} / 10` : 'Pendente')}
                            </p>
                          </div>
                        </div>
 
                        <div className="flex gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onStartExam(exam.id)}
                            className="sidebar-grad text-white px-10 py-4 rounded-2xl font-extrabold flex items-center gap-3 shadow-xl shadow-orange-600/20 transition-all justify-center group/btn cursor-pointer w-full sm:w-auto"
                          >
                            {isTeacherOrAdmin ? (
                              <>
                                <FileText size={20} />
                                Ver Submissões
                              </>
                            ) : (
                              <>
                                <Play size={20} fill="currentColor" />
                                Iniciar Prova
                              </>
                            )}
                            <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Seção de Provas Agendadas (Somente Professores/Admins) */}
          {isTeacherOrAdmin && scheduledExams.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-10 px-2">
                <h2 className="text-2xl font-extrabold font-display flex items-center gap-4">
                  Provas Agendadas
                  <span className="bg-blue-500/10 text-blue-405 text-[10px] font-extrabold px-3 py-1 rounded-full border border-blue-500/20 tracking-widest uppercase">
                    {scheduledExams.length} Agendada{scheduledExams.length > 1 ? 's' : ''}
                  </span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {scheduledExams.map((exam) => (
                  <motion.div 
                    key={exam.id} 
                    variants={item}
                    className={`border rounded-2xl overflow-hidden group transition-all shadow-lg hover:shadow-blue-600/5 ${
                      isDarkMode ? 'glass border-[var(--border)] hover:border-blue-500/30' : 'bg-white border-zinc-200 hover:border-blue-500/35 hover:shadow-zinc-200/50'
                    }`}
                  >
                    <div className="h-64 overflow-hidden relative bg-zinc-900 flex items-center justify-center">
                      {exam.image ? (
                        <img src={exam.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="absolute inset-0 mesh-gradient opacity-20 group-hover:opacity-40 transition-opacity" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      
                      <div className="absolute top-6 left-6">
                        <span className="text-[10px] font-extrabold bg-blue-600 text-white px-4 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-lg shadow-blue-600/30">
                          {exam.subject}
                        </span>
                      </div>

                      {canCreate && (
                        <div className="absolute top-6 right-6 flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToDelete(exam.id);
                            }}
                            className={`p-3 border rounded-2xl text-white hover:bg-red-500 transition-all cursor-pointer ${
                              isDarkMode ? 'glass border-white/10' : 'bg-black/40 border-black/10 hover:border-red-500'
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                      <div className="absolute bottom-8 left-8 right-8">
                        <h3 className="text-3xl font-extrabold text-white font-display tracking-tight group-hover:text-blue-500 transition-colors">{exam.title}</h3>
                      </div>
                    </div>
                    
                    <div className="p-10">
                      {/* Countdown para o início da prova */}
                      {countdowns[exam.id] && (
                        <div className="flex items-center gap-2 mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
                          <Timer size={14} className="text-blue-450 dark:text-blue-405 animate-pulse shrink-0" />
                          <span className="text-sm font-extrabold text-blue-450 dark:text-blue-405">{countdowns[exam.id]}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="space-y-1 col-span-2">
                          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                            <Calendar size={14} className="text-blue-500" /> Janela de Acesso
                          </p>
                          <p className="text-sm font-bold">
                            {exam.startDate ? formatDate(exam.startDate) : '—'}
                            <span className="text-blue-500 mx-2">→</span>
                            {formatDate(exam.deadlineDate)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-blue-500" /> Questões
                          </p>
                          <p className="text-lg font-bold">{exam.questionsCount} itens</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                            <Trophy size={14} className="text-blue-500" /> Peso
                          </p>
                          <p className="text-lg font-bold">{exam.weight || '1.0'}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onStartExam(exam.id)}
                          className="w-full py-4 bg-zinc-800 border border-zinc-700/50 text-zinc-300 dark:border-zinc-700 dark:bg-zinc-850 hover:bg-zinc-750 dark:hover:bg-zinc-800 rounded-2xl font-extrabold flex items-center gap-2 transition-all justify-center cursor-pointer"
                        >
                          <Clock size={18} />
                          Aguardando Início
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Seção de Provas Encerradas */}
          {expiredExams.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-10 px-2">
                <h2 className="text-2xl font-extrabold font-display flex items-center gap-4">
                  Provas Encerradas
                  <span className="bg-red-500/10 text-red-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-red-500/20 tracking-widest uppercase">
                    {expiredExams.length} Encerrada{expiredExams.length > 1 ? 's' : ''}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {expiredExams.map((exam) => (
                  <motion.div
                    key={exam.id}
                    variants={item}
                    className={`border rounded-2xl overflow-hidden opacity-80 transition-all duration-300 ${
                      isDarkMode ? 'glass border-red-500/20' : 'bg-white border-red-200 shadow-sm'
                    }`}
                  >
                    <div className="h-32 overflow-hidden relative bg-zinc-900/60 flex items-center justify-center">
                      {exam.image ? (
                        <img src={exam.image} alt="" className="w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="absolute inset-0 mesh-gradient opacity-10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-extrabold bg-red-600/80 text-white px-3 py-1 rounded-full tracking-[0.2em] uppercase flex items-center gap-1">
                          <Lock size={10} /> ENCERRADA
                        </span>
                      </div>
                      {canCreate && (
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setExamToDelete(exam.id); }}
                            className={`p-2 border rounded-xl text-white hover:bg-red-500 transition-all cursor-pointer ${
                              isDarkMode ? 'glass border-white/10' : 'bg-black/40 border-black/10 hover:border-red-500'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="text-lg font-extrabold text-white/70 font-display tracking-tight line-clamp-1">{exam.title}</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest mb-1">
                            Encerrada em {exam.deadlineDate ? new Date(exam.deadlineDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                          <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                            {isTeacherOrAdmin
                              ? 'Período de realização pelos alunos finalizado.'
                              : 'Você não realizou esta prova no período disponível.'}
                          </p>
                          
                          {isTeacherOrAdmin ? (
                            <button
                              onClick={() => onStartExam(exam.id)}
                              className="mt-4 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText size={14} />
                              Ver Submissões e Notas
                              <ArrowUpRight size={14} />
                            </button>
                          ) : (
                            <div className="mt-3 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                              <Lock size={10} /> Acesso bloqueado
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-10 px-2">
              <h2 className="text-2xl font-extrabold font-display">Histórico de Provas</h2>
              <button className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-2 group cursor-pointer">
                Ver relatório completo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <motion.div variants={item} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200 shadow-md shadow-zinc-150/20'
            }`}>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-slate-50'
                    }`}>
                      <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Prova</th>
                      <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Matéria</th>
                      <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Data</th>
                      <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Nota</th>
                      <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {completedExams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-20 text-center text-[var(--text-muted)] font-medium">Nenhuma prova realizada ainda.</td>
                      </tr>
                    ) : (
                      completedExams.map((exam) => (
                        <tr key={exam.id} className={`transition-colors group ${
                          isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                        }`}>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <FileText size={20} />
                              </div>
                              <span className="font-bold text-lg group-hover:text-orange-500 transition-colors">{exam.title}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                             <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border transition-colors duration-300 ${
                               isDarkMode ? 'bg-white/5 border-white/5 text-zinc-355' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                             }`}>{exam.subject}</span>
                          </td>
                          <td className="px-10 py-8 text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">{exam.submittedAt ? new Date(exam.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${parseFloat(exam.grade || '0') >= 7 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`} />
                              <span className={`text-2xl font-extrabold font-display ${parseFloat(exam.grade || '0') >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {exam.grade}
                              </span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button 
                              onClick={() => onStartExam(exam.id)}
                              className="text-sm font-extrabold text-orange-500 hover:text-orange-400 transition-all flex items-center gap-2 ml-auto group/link cursor-pointer"
                            >
                              Ver Detalhes <ArrowUpRight size={16} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[var(--border)]">
                {completedExams.length === 0 ? (
                  <div className="p-10 text-center text-[var(--text-muted)] font-medium">Nenhuma prova realizada ainda.</div>
                ) : (
                  completedExams.map((exam) => (
                    <div key={exam.id} className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                           <h4 className="text-lg font-bold text-[var(--text-main)] leading-tight">{exam.title}</h4>
                           <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block border transition-colors duration-300 ${
                             isDarkMode ? 'bg-white/5 border-white/5 text-zinc-355' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                           }`}>{exam.subject}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1">Nota</p>
                          <span className={`text-3xl font-extrabold font-display ${parseFloat(exam.grade || '0') >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {exam.grade}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                        <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">{exam.submittedAt ? new Date(exam.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                        <button 
                          onClick={() => onStartExam(exam.id)}
                          className="text-sm font-extrabold text-orange-500 flex items-center gap-1 cursor-pointer"
                        >
                          Ver Detalhes <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </section>
        </>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal 
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Prova"
        message="Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Não, voltar"
        variant="danger"
      />
    </motion.div>
  );
};

export default Exams;
