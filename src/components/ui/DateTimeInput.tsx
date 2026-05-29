import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateTimeInputProps {
  value: string;
  onChange: (isoString: string) => void;
  label?: string;
}

export default function DateTimeInput({ value, onChange, label }: DateTimeInputProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (value && value.includes('T')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const DD = String(d.getDate()).padStart(2, '0');
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const YYYY = d.getFullYear();
        const HH = String(d.getHours()).padStart(2, '0');
        const MIN = String(d.getMinutes()).padStart(2, '0');
        setText(`${DD}/${MM}/${YYYY} ${HH}:${MIN}`);
      }
    } else if (!value) {
      setText('');
    }
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 12) val = val.substring(0, 12);
    
    let formatted = val;
    if (val.length > 2) formatted = val.substring(0,2) + '/' + val.substring(2);
    if (val.length > 4) formatted = formatted.substring(0,5) + '/' + formatted.substring(5);
    if (val.length > 8) formatted = formatted.substring(0,10) + ' ' + formatted.substring(10);
    if (val.length > 10) formatted = formatted.substring(0,13) + ':' + formatted.substring(13);

    setText(formatted);

    if (val.length === 12) {
      const DD = val.substring(0,2);
      const MM = val.substring(2,4);
      const YYYY = val.substring(4,8);
      const HH = val.substring(8,10);
      const MIN = val.substring(10,12);
      onChange(`${YYYY}-${MM}-${DD}T${HH}:${MIN}:00`);
    } else {
      onChange(''); 
    }
  };

  return (
    <div className="space-y-3 w-full">
      {label && <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">{label}</label>}
      <div className="relative">
        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
        <input 
          type="text" 
          value={text}
          onChange={handleInput}
          placeholder="DD/MM/AAAA HH:MM"
          className="w-full glass border border-white/5 rounded-2xl py-5 pl-16 pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-bold placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}
