import { useState, Dispatch, SetStateAction } from 'react';
import { Clock, Play, Plus, Edit2, Trash2, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Notification } from '../types';
import ActivityForm from './ActivityForm';
import Header from './Header';
import { getTimeRemaining, formatDate } from '../utils/dateUtils';
import ConfirmationModal from './ConfirmationModal';

interface ActivitiesProps {
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  onStartActivity: (id: string) => void;
  isDevMode: boolean;
  onAddActivity?: (title: string) => void;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
}

const Activities = ({ 
  activities, 
  setActivities, 
  onStartActivity, 
  isDevMode,
  onAddActivity,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick
}: ActivitiesProps) => {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [activeTab, setActiveTab] = useState<'pendentes' | 'concluidas'>('pendentes');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // ==========================================
  // MANIPULAÇÃO DE DADOS (SALVAR/EXCLUIR)
  // ==========================================
  const handleSave = (newActivity: Activity) => {
    if (editingActivity) {
      setActivities(prev => prev.map(a => a.id === newActivity.id ? newActivity : a));
    } else {
      setActivities(prev => [...prev, newActivity]);
      if (onAddActivity) onAddActivity(newActivity.title);
    }
    setIsFormOpen(false);
    setEditingActivity(undefined);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      setActivities(prev => prev.filter(a => a.id !== activityToDelete));
      setActivityToDelete(null);
    }
  };

  // ==========================================
  // FILTRAGEM DE ATIVIDADES E ANIMAÇÕES
  // ==========================================
  const filteredActivities = activities.filter(a => 
    activeTab === 'pendentes' ? a.status !== 'Concluída' : a.status === 'Concluída'
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
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Controles: Abas e Botão de Criar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex gap-2 p-1.5 glass border border-[var(--border)] rounded-[20px] w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('pendentes')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-[14px] font-bold text-sm transition-all relative ${
              activeTab === 'pendentes' 
                ? 'text-white' 
                : 'text-[var(--text-muted)] hover:text-white'
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
                {activities.filter(a => a.status !== 'Concluída').length}
              </span>
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('concluidas')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-[14px] font-bold text-sm transition-all relative ${
              activeTab === 'concluidas' 
                ? 'text-white' 
                : 'text-[var(--text-muted)] hover:text-white'
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

        {isDevMode && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingActivity(undefined);
              setIsFormOpen(true);
            }}
            className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all w-full md:w-auto justify-center"
          >
            <Plus size={20} />
            Criar Atividade
          </motion.button>
        )}
      </div>

      {/* Lista de Atividades */}
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
              className="text-center py-24 glass border border-[var(--border)] rounded-[40px]"
            >
              <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Nada por aqui</h3>
              <p className="text-[var(--text-muted)] font-medium">Nenhuma atividade encontrada nesta seção.</p>
            </motion.div>
          ) : (
            filteredActivities.map((activity) => (
              <motion.div 
                key={activity.id} 
                variants={item}
                layout
                className="glass border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col md:flex-row group hover:border-orange-500/30 transition-all shadow-lg hover:shadow-orange-600/5"
              >
                <div className="w-full md:w-60 h-40 md:h-auto overflow-hidden bg-zinc-900 flex items-center justify-center relative shrink-0">
                  {activity.image ? (
                    <img 
                      src={activity.image} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 mesh-gradient opacity-20 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-extrabold bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded-full tracking-widest uppercase border border-orange-500/10">
                      {activity.subject}
                    </span>
                    {isDevMode && (
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActivity(activity);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-[var(--text-muted)] hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivityToDelete(activity.id);
                          }}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                      {activity.status === 'Concluída' && (
                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/10">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-extrabold">Nota: {activity.score}/{activity.totalPoints}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {activity.status !== 'Concluída' ? (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onStartActivity(activity.id)}
                          className="w-10 h-10 sidebar-grad text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 transition-all"
                        >
                          <ChevronRight size={20} />
                        </motion.button>
                      ) : (
                        <button 
                          className="bg-zinc-800/50 text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-zinc-800 transition-all border border-white/5"
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

      {/* Formulário de Criação/Edição de Atividade */}
      {isFormOpen && (
        <ActivityForm 
          activity={editingActivity}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingActivity(undefined);
          }}
        />
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
