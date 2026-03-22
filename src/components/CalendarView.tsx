import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './Header';
import { Notification } from '../types';

interface CalendarViewProps {
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarView({
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick
}: CalendarViewProps) {
  // ==========================================
  // ESTADOS DO CALENDÁRIO
  // ==========================================
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ==========================================
  // NAVEGAÇÃO DE MESES
  // ==========================================
  const handlePrevMonth = () => {
    if (year === 2026 && month === 0) return;
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (year === 2028 && month === 0) return; // Up to Jan 2028
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // ==========================================
  // LÓGICA DE GERAÇÃO DE DIAS
  // ==========================================
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-12">
      {/* Cabeçalho */}
      <Header 
        title="Calendário Acadêmico" 
        subtitle="Acompanhe suas datas de entrega e eventos." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display flex items-center gap-4">
            Calendário Acadêmico
          </h1>
          <p className="text-[var(--text-muted)] mt-2">Acompanhe suas datas de entrega e eventos.</p>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="glass border border-[var(--border)] rounded-3xl p-6 md:p-10 shadow-2xl">
        {/* Controles do Mês */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-orange-500 font-display">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              disabled={year === 2026 && month === 0}
              className="p-3 glass border border-[var(--border)] rounded-xl hover:bg-white/5 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleNextMonth}
              disabled={year === 2028 && month === 0}
              className="p-3 glass border border-[var(--border)] rounded-xl hover:bg-white/5 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do Mês */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {days.map((day, idx) => (
            <div 
              key={idx} 
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all ${
                day 
                  ? 'border-[var(--border)] bg-white/5 hover:border-orange-500/30 cursor-pointer group' 
                  : 'border-transparent'
              }`}
            >
              {day && (
                <span className="text-lg font-bold group-hover:text-orange-500 transition-colors">
                  {day}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
