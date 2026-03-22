import { Bell, User, X, Check, Info, AlertCircle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { Notification } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  onProfileClick?: () => void;
  notifications?: Notification[];
  onRemoveNotification?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
}

export default function Header({ 
  title, 
  subtitle, 
  userName = "Ana Beatriz", 
  onProfileClick,
  notifications = [],
  onRemoveNotification,
  onMarkAsRead
}: HeaderProps) {
  // ==========================================
  // ESTADOS E REFERÊNCIAS
  // ==========================================
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // ==========================================
  // EFEITOS COLATERAIS (FECHAR NOTIFICAÇÕES AO CLICAR FORA)
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  const getIcon = (type: string) => {
    switch (type) {
      case 'activity': return <Info className="w-4 h-4 text-blue-400" />;
      case 'exam': return <GraduationCap className="w-4 h-4 text-orange-400" />;
      default: return <AlertCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
      {/* Título e Subtítulo */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-display">{title}</h1>
        {subtitle && <p className="text-[var(--text-muted)] mt-1.5 font-medium">{subtitle}</p>}
      </motion.div>
      
      {/* Ações do Cabeçalho (Notificações e Perfil) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-4 w-full md:w-auto"
      >
        <div className="flex items-center gap-3 relative" ref={notificationRef}>
          {/* Botão de Notificações */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 glass border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-white hover:scale-105 transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full border-2 border-[var(--bg-body)] animate-pulse" />
            )}
          </button>

          {/* Dropdown de Notificações */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-4 w-80 glass border border-[var(--border)] rounded-3xl shadow-2xl z-[100] overflow-hidden"
              >
                <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-bold">Notificações</h3>
                  <span className="text-[10px] font-extrabold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {unreadCount} Novas
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-20" />
                      <p className="text-sm text-[var(--text-muted)] font-medium">Nenhuma notificação por aqui.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 hover:bg-white/5 transition-colors relative group ${!notification.read ? 'bg-orange-500/[0.02]' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1 shrink-0">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold truncate pr-6">{notification.title}</h4>
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">{notification.time}</span>
                              </div>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{notification.message}</p>
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && onMarkAsRead && (
                              <button 
                                onClick={() => onMarkAsRead(notification.id)}
                                className="p-1 hover:text-green-500 transition-colors"
                                title="Marcar como lida"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {onRemoveNotification && (
                              <button 
                                onClick={() => onRemoveNotification(notification.id)}
                                className="p-1 hover:text-red-500 transition-colors"
                                title="Remover"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button className="w-full p-4 text-xs font-bold text-orange-500 hover:bg-orange-500/5 transition-colors border-t border-[var(--border)]">
                    Ver todas as notificações
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Divisor */}
          <div className="h-10 w-[1px] bg-[var(--border)] mx-1 hidden sm:block" />
          
          {/* Botão de Perfil */}
          <div 
            onClick={onProfileClick}
            className="flex items-center gap-3 glass border border-[var(--border)] p-1.5 pr-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
              <User size={20} />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <p className="text-xs font-bold leading-none mb-1">{userName}</p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Estudante</p>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
