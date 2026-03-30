import { 
  LayoutDashboard, 
  FileText, 
  GraduationCap, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  CalendarDays,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed, onCloseMobile, onLogout }: SidebarProps) {
  // ==========================================
  // CONFIGURAÇÃO DOS ITENS DO MENU
  // ==========================================
  const menuItems = [
    { id: 'dashboard', label: 'Central', icon: LayoutDashboard, category: 'PRINCIPAL' },
    { id: 'lessons', label: 'Aulas', icon: Play, category: 'PRINCIPAL' },
    { id: 'activities', label: 'Atividades', icon: FileText, category: 'PRINCIPAL' },
    { id: 'exams', label: 'Provas', icon: GraduationCap, category: 'PRINCIPAL' },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays, category: 'PRINCIPAL' },
    { id: 'insights', label: 'Insights', icon: BarChart3, category: 'PRINCIPAL' },
    { id: 'members', label: 'Membros', icon: Users, category: 'SISTEMA' },
    { id: 'settings', label: 'Configurações', icon: Settings, category: 'SISTEMA' },
  ];

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <aside 
      className={cn(
        "h-screen sticky top-0 flex flex-col p-6 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] glass border-r border-[var(--border)]",
        isCollapsed ? "w-24" : "w-72"
      )}
    >
      {/* Cabeçalho da Sidebar (Logo e Botão de Colapso) */}
      <div className={cn("flex items-center mb-10 relative", isCollapsed ? "justify-center" : "justify-start")}>
        <div className={cn(
          "transition-all duration-300 flex items-center justify-center overflow-hidden",
          isCollapsed ? "w-12 h-12 rounded-xl" : "w-14 h-14 rounded-2xl mr-2"
        )}>
          <img src="/logoAprende.png" alt="Aprende+" className="w-full h-full object-contain scale-125" referrerPolicy="no-referrer" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h2 className="text-xl font-extrabold tracking-tighter font-display">Aprende+</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Plataforma</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-600 text-white rounded-full items-center justify-center shadow-lg hover:scale-110 transition-all z-50 border-4 border-[var(--bg-body)]"
          title={isCollapsed ? "Expandir" : "Recolher"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Botão de Fechar (Apenas Mobile) */}
        <button 
          onClick={onCloseMobile}
          className="md:hidden ml-auto p-2 text-[var(--text-muted)] hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-8 custom-scrollbar">
        {['PRINCIPAL', 'SISTEMA'].map((category) => (
          <div key={category}>
            {!isCollapsed && (
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] mb-4 ml-2 tracking-[0.2em] uppercase">
                {category}
              </p>
            )}
            <ul className="space-y-2">
              {menuItems
                .filter(item => item.category === category)
                .map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <li 
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "relative flex items-center p-3.5 rounded-2xl cursor-pointer transition-all duration-300 group",
                        isActive 
                          ? "text-white" 
                          : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute inset-0 sidebar-grad rounded-2xl shadow-lg shadow-orange-600/20"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className={cn("relative z-10 transition-transform duration-300 group-hover:scale-110", isCollapsed ? "mx-auto" : "mr-4")}>
                        <item.icon size={20} />
                      </div>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="relative z-10 font-bold text-sm whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé da Sidebar (Botão de Sair) */}
      <div className="mt-auto pt-6 border-t border-[var(--border)]">
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-3.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all group"
        >
          <div className={cn("transition-transform duration-300 group-hover:translate-x-1", isCollapsed ? "mx-auto" : "mr-4")}>
            <LogOut size={20} />
          </div>
          {!isCollapsed && <span className="font-bold text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
