import { Clock, Play, ChevronRight, GraduationCap, Calendar, ArrowUpRight, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Activity, Notification } from '../types';
import Header from './Header';

interface DashboardProps {
  activities: Activity[];
  onStartActivity: (id: string) => void;
  userName: string;
  onOpenCalendar: () => void;
  onProfileClick: () => void;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export default function Dashboard({ 
  activities, 
  onStartActivity, 
  userName, 
  onOpenCalendar,
  onProfileClick,
  notifications,
  onRemoveNotification,
  onMarkAsRead
}: DashboardProps) {
  // ==========================================
  // LÓGICA DE DADOS
  // ==========================================
  const pendingActivities = activities.filter(a => a.status !== 'Concluída').slice(0, 4);

  // ==========================================
  // ANIMAÇÕES
  // ==========================================
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
      className="space-y-8"
    >
      {/* Cabeçalho do Dashboard */}
      <Header 
        title="Central do Aluno" 
        subtitle="Seu progresso acadêmico em tempo real." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Hero Card - Bento Large (Destaque Principal) */}
        <motion.div 
          variants={item}
          className="lg:col-span-12 mesh-gradient rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-orange-600/20 group"
        >
          <div className="relative z-10 max-w-lg">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] font-extrabold bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 inline-block border border-white/10"
            >
              Próxima Aula • AO VIVO
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 font-display tracking-tight leading-tight">Cálculo Diferencial e Integral II</h2>
            <p className="text-white/70 mb-10 leading-relaxed text-base md:text-lg font-medium">A aula começará em 15 minutos. Prepare seu material sobre derivadas parciais e integrais múltiplas.</p>
            <button className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-extrabold flex items-center gap-3 hover:bg-orange-50 hover:scale-105 transition-all shadow-xl active:scale-95">
              <Play size={22} fill="currentColor" />
              Entrar na Sala Virtual
            </button>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none hidden lg:block group-hover:scale-110 transition-transform duration-1000">
            <GraduationCap size={400} className="translate-x-1/4 -translate-y-1/4" />
          </div>
        </motion.div>

        {/* Pending Activities - Bento Medium (Atividades Pendentes) */}
        <motion.div 
          variants={item}
          className="lg:col-span-7 space-y-6"
        >
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-extrabold font-display">Atividades Prioritárias</h2>
            <button className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-1 group">
              Ver todas <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActivities.map((activity) => (
              <motion.div 
                key={activity.id} 
                whileHover={{ y: -5 }}
                className="glass border border-[var(--border)] rounded-2xl p-5 hover:border-orange-500/30 transition-all group cursor-pointer flex items-center justify-between"
                onClick={() => onStartActivity(activity.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-extrabold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full tracking-widest uppercase border border-orange-500/10">
                      {activity.subject}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] font-bold">
                      <Clock size={10} className="text-orange-500" />
                      <span>2d</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-white transition-colors">{activity.title}</h3>
                </div>
                <div className="ml-4 w-8 h-8 sidebar-grad rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-600/10">
                  <ChevronRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reminders & Premium - Bento Column (Lembretes e Ofertas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card de Lembrete */}
          <motion.div 
            variants={item}
            className="glass border border-[var(--border)] rounded-[32px] p-8 relative overflow-hidden group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-bold">Lembrete de Entrega</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Amanhã • 23:59</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium mb-6">Não esqueça de enviar o relatório final do projeto de Algoritmos e Estruturas de Dados.</p>
            <button 
              onClick={onOpenCalendar}
              className="w-full py-3.5 rounded-2xl border border-[var(--border)] text-sm font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Ver Calendário <ArrowUpRight size={16} />
            </button>
          </motion.div>

          {/* Card Premium */}
          <motion.div 
            variants={item}
            className="bg-zinc-900 rounded-[32px] p-8 relative overflow-hidden group border border-white/5"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-orange-500 fill-orange-500" />
                <h3 className="text-xl font-extrabold text-white font-display">Plano Premium</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-6 font-medium">Desbloqueie cursos exclusivos e mentorias personalizadas com especialistas.</p>
              <button className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm hover:shadow-2xl hover:shadow-orange-600/30 transition-all hover:scale-105 active:scale-95">
                Fazer Upgrade
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000">
              <GraduationCap size={150} className="text-orange-500" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
