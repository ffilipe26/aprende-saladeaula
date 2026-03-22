import { useState, Dispatch, SetStateAction } from 'react';
import { Clock, Calendar, Play, CheckCircle2, Trophy, Plus, Edit2, Trash2, ChevronRight, FileText, GraduationCap, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Notification } from '../types';
import ExamForm from './ExamForm';
import Header from './Header';
import { getTimeRemaining, formatDate } from '../utils/dateUtils';
import ConfirmationModal from './ConfirmationModal';

interface ExamsProps {
  exams: Exam[];
  setExams: Dispatch<SetStateAction<Exam[]>>;
  isDevMode: boolean;
  onStartExam: (id: string) => void;
  onAddExam?: (title: string) => void;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
}

const Exams = ({ 
  exams, 
  setExams, 
  isDevMode, 
  onStartExam,
  onAddExam,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick
}: ExamsProps) => {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  // ==========================================
  // MANIPULAÇÃO DE DADOS (SALVAR/EXCLUIR)
  // ==========================================
  const handleSave = (newExam: Exam) => {
    if (editingExam) {
      setExams(prev => prev.map(e => e.id === newExam.id ? newExam : e));
    } else {
      setExams(prev => [...prev, newExam]);
      if (onAddExam) onAddExam(newExam.title);
    }
    setIsFormOpen(false);
    setEditingExam(undefined);
  };

  const confirmDelete = () => {
    if (examToDelete) {
      setExams(prev => prev.filter(e => e.id !== examToDelete));
      setExamToDelete(null);
    }
  };

  // ==========================================
  // FILTRAGEM DE PROVAS E ANIMAÇÕES
  // ==========================================
  const completedExams = exams.filter(e => e.status === 'Concluída');
  const availableExams = exams.filter(e => e.status === 'Disponível');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
          {isDevMode && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingExam(undefined);
                setIsFormOpen(true);
              }}
              className="sidebar-grad text-white px-8 py-4 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all justify-center"
            >
              <Plus size={20} />
              Criar Prova
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Seção de Próximas Provas (Disponíveis) */}
      <section>
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-2xl font-extrabold font-display flex items-center gap-4">
            Próximas Provas
            <span className="bg-orange-500/10 text-orange-500 text-[10px] font-extrabold px-3 py-1 rounded-full border border-orange-500/10 tracking-widest uppercase">
              {availableExams.length} Disponíveis
            </span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {availableExams.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-2 text-center py-24 glass border border-[var(--border)] rounded-[40px]"
              >
                <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                  <GraduationCap size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2">Tudo em dia!</h3>
                <p className="text-[var(--text-muted)] font-medium">Nenhuma prova disponível no momento.</p>
              </motion.div>
            ) : (
              availableExams.map((exam) => (
                <motion.div 
                  key={exam.id} 
                  variants={item}
                  layout
                  className="glass border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg hover:shadow-orange-600/5"
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

                    {isDevMode && (
                      <div className="absolute top-6 right-6 flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingExam(exam);
                            setIsFormOpen(true);
                          }}
                          className="p-3 glass border border-white/10 rounded-2xl text-white hover:bg-orange-500 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExamToDelete(exam.id);
                          }}
                          className="p-3 glass border border-white/10 rounded-2xl text-white hover:bg-red-500 transition-all"
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
                    <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                          <Clock size={14} className="text-orange-500" /> Duração
                        </p>
                        <p className="text-lg font-bold">{exam.duration} min</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-orange-500" /> Questões
                        </p>
                        <p className="text-lg font-bold">{exam.questionsCount} itens</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                          <Trophy size={14} className="text-orange-500" /> Nota
                        </p>
                        <p className="text-lg font-bold">{exam.weight}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-2">
                          <Calendar size={14} className="text-orange-500" /> Expira em
                        </p>
                        <p className="text-lg font-extrabold text-orange-500">{getTimeRemaining(exam.deadlineDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-8 border-t border-[var(--border)] gap-6">
                      <div className="flex items-center gap-3 text-[var(--text-muted)] bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <Calendar size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">{formatDate(exam.deadlineDate)}</span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onStartExam(exam.id)}
                        className="sidebar-grad text-white px-10 py-4 rounded-2xl font-extrabold flex items-center gap-3 shadow-xl shadow-orange-600/20 transition-all justify-center group/btn"
                      >
                        <Play size={20} fill="currentColor" />
                        Iniciar Prova
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

      <section>
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-2xl font-extrabold font-display">Histórico de Provas</h2>
          <button className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-2 group">
            Ver relatório completo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <motion.div variants={item} className="glass border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-white/5">
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
                    <tr key={exam.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <FileText size={20} />
                          </div>
                          <span className="font-bold text-lg group-hover:text-orange-500 transition-colors">{exam.title}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-[10px] font-extrabold bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">{exam.subject}</span>
                      </td>
                      <td className="px-10 py-8 text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">15 Out, 2023</td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${parseFloat(exam.grade || '0') >= 7 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`} />
                          <span className={`text-2xl font-extrabold font-display ${parseFloat(exam.grade || '0') >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {exam.grade}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button className="text-sm font-extrabold text-orange-500 hover:text-orange-400 transition-all flex items-center gap-2 ml-auto group/link">
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
                      <h4 className="text-lg font-bold text-white leading-tight">{exam.title}</h4>
                      <span className="text-[9px] font-extrabold bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest inline-block border border-white/5">{exam.subject}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1">Nota</p>
                      <span className={`text-3xl font-extrabold font-display ${parseFloat(exam.grade || '0') >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {exam.grade}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                    <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">15 Out, 2023</span>
                    <button className="text-sm font-extrabold text-orange-500 flex items-center gap-1">Ver Detalhes <ArrowUpRight size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* Formulário de Criação/Edição de Prova */}
      {isFormOpen && (
        <ExamForm 
          exam={editingExam}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingExam(undefined);
          }}
        />
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
