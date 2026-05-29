import { useState, Dispatch, SetStateAction } from 'react';
import { Clock, Play, Plus, Edit2, Trash2, CheckCircle2, ChevronRight, FileText, ChevronDown, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Notification, Subject } from '../types';
import Header from '../components/layout/Header';
import { getTimeRemaining, formatDate } from '../utils/dateUtils';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { adminService } from '../lib/adminService';

interface ActivitiesProps {
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  onStartActivity: (id: string) => void;
  canCreate?: boolean;
  onAddActivity?: (title: string) => void;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  selectedAdminSubjectId?: string | null;
  setSelectedAdminSubjectId?: (id: string | null) => void;
  subjects?: Subject[];
  onNavigate?: (section: string) => void;
  userRole?: string;
  onReload?: () => void;
  isDarkMode: boolean;
}

const Activities = ({ 
  activities, 
  setActivities, 
  onStartActivity, 
  canCreate,
  onAddActivity,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  selectedAdminSubjectId,
  setSelectedAdminSubjectId,
  subjects = [],
  onNavigate,
  userRole,
  onReload,
  isDarkMode
}: ActivitiesProps) => {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [activeTab, setActiveTab] = useState<'pendentes' | 'concluidas'>('pendentes');
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  const isAdminView = setSelectedAdminSubjectId !== undefined;

  // ==========================================
  // MANIPULAÇÃO DE DADOS (SALVAR/EXCLUIR)
  // ==========================================
  const confirmDelete = async () => {
    if (activityToDelete) {
      const res = await adminService.deleteActivity(activityToDelete);
      if (!res.error) {
        setActivities(prev => prev.filter(a => a.id !== activityToDelete));
        if (onReload) onReload();
      } else {
        alert('Erro ao excluir: ' + res.error);
      }
      setActivityToDelete(null);
    }
  };

  // ==========================================
  // FILTRAGEM DE ATIVIDADES E ANIMAÇÕES
  // ==========================================
  const rawFilteredActivities = isAdminView
    ? (selectedAdminSubjectId ? activities.filter(a => a.subjectId === selectedAdminSubjectId) : activities)
    : activities;

  const filteredActivities = rawFilteredActivities.filter(a => 
    userRole === 'teacher' ? true : (activeTab === 'pendentes' ? a.status !== 'Concluída' : a.status === 'Concluída')
  );

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
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <Header 
        title="Atividades" 
        subtitle="Gerencie suas tarefas e prazos acadêmicos." 
        userName={userName}
        userRole={userRole}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

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

      {/* Controles: Abas e Botão de Criar */}
      {(!isAdminView || selectedAdminSubjectId !== null) && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          {userRole !== 'teacher' && (
            <div className={`flex gap-2 p-1.5 border rounded-[20px] w-full md:w-auto transition-all duration-300 ${
              isDarkMode ? 'glass border-[var(--border)]' : 'bg-zinc-100 border-zinc-200 shadow-inner'
            }`}>
              <button 
                onClick={() => setActiveTab('pendentes')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-[14px] font-bold text-sm transition-all relative cursor-pointer ${
                activeTab === 'pendentes' 
                  ? 'text-white' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {activeTab === 'pendentes' && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className="absolute inset-0 sidebar-grad rounded-[14px]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                Pendentes
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pendentes' ? 'bg-white/20' : 'bg-orange-500/10 text-orange-500'}`}>
                  {rawFilteredActivities.filter(a => a.status !== 'Concluída').length}
                </span>
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('concluidas')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-[14px] font-bold text-sm transition-all relative cursor-pointer ${
                activeTab === 'concluidas' 
                  ? 'text-white' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {activeTab === 'concluidas' && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className="absolute inset-0 sidebar-grad rounded-[14px]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Concluídas</span>
            </button>
          </div>
          )}

          {canCreate && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) {
                  onNavigate('activity_creator');
                }
              }}
              className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all w-full md:w-auto justify-center cursor-pointer"
            >
              <Plus size={20} />
              Criar Atividade
            </motion.button>
          )}
        </div>
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
            const subActivities = activities.filter(a => a.subjectId === sub.id);
            const pendingCount = subActivities.filter(a => a.status !== 'Concluída').length;
            const completedCount = subActivities.filter(a => a.status === 'Concluída').length;
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
                  <span>Atividades</span>
                  <span className="text-orange-500 flex items-center gap-2">
                    <span className="text-emerald-500">{completedCount} Feitas</span> • <span className="text-orange-500">{pendingCount} Pendentes</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Lista de Atividades */
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredActivities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center py-20 border rounded-[32px] max-w-lg mx-auto relative overflow-hidden group transition-all duration-300 ${
                  isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50 shadow-sm'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <FileText size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-2 font-display">
                  {userRole === 'teacher' ? 'Nenhuma atividade aqui' : activeTab === 'pendentes' ? 'Tudo em ordem!' : 'Nenhuma concluída'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-bold max-w-xs mx-auto leading-relaxed">
                  {userRole === 'teacher'
                    ? 'Você ainda não publicou nenhuma atividade para esta turma.'
                    : activeTab === 'pendentes' 
                    ? 'Você não tem nenhuma atividade pendente para entregar no momento. Bom trabalho!'
                    : 'Suas atividades entregues aparecerão listadas aqui para consulta.'}
                </p>
              </motion.div>
            ) : (
              filteredActivities.map((activity) => (
                <motion.div 
                  key={activity.id} 
                  variants={item}
                  layout
                  className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-6 group transition-all shadow-lg hover:shadow-orange-600/5 ${
                    isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border relative flex items-center justify-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-white/5 border-[var(--border)]' : 'bg-slate-100 border-zinc-200'
                  }`}>
                    <BookOpen size={24} className="text-orange-500/50" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-extrabold bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded-full tracking-widest uppercase border border-orange-500/10">
                        {activity.subject}
                      </span>
                      {canCreate && (
                        <div className="flex gap-1">

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivityToDelete(activity.id);
                            }}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-extrabold mb-4 font-display group-hover:text-orange-500 transition-colors line-clamp-1">{activity.title}</h3>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">Prazo</p>
                          <p className="text-xs font-bold">{formatDate(activity.deadlineDate)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">Restante</p>
                          <p className="text-xs font-extrabold text-orange-500 flex items-center gap-1.5">
                            <Clock size={14} />
                            {getTimeRemaining(activity.deadlineDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full shadow-sm ${activity.status === 'Concluída' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-orange-500 shadow-orange-500/50'}`} />
                            <p className="text-xs font-bold">{activity.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {activity.status !== 'Concluída' ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onStartActivity(activity.id)}
                            className="w-10 h-10 sidebar-grad text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                          >
                            <ChevronRight size={20} />
                          </motion.button>
                        ) : (
                          <button 
                            onClick={() => onStartActivity(activity.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:opacity-90 transition-all border cursor-pointer ${
                              isDarkMode ? 'bg-[var(--border)] text-[var(--text-main)] border-[var(--border)]' : 'bg-zinc-150 border-zinc-300 text-zinc-800'
                            }`}
                          >
                            Revisão
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal 
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Atividade"
        message="Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Não, voltar"
        variant="danger"
      />
    </div>
  );
};

export default Activities;
