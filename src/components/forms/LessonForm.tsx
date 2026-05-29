import { useState } from 'react';
import { motion } from 'motion/react';
import { X, PlayCircle, FileText, Link, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Lesson, Subject } from '../../types';

interface LessonFormProps {
  subjects: Subject[];
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

export default function LessonForm({ subjects, onSave, onCancel }: LessonFormProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'youtube' | 'video' | 'pdf'>('youtube');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !url) return;

    const chosenSubject = subjects.find(s => s.id === subjectId);
    const subjectName = chosenSubject ? chosenSubject.name : '';

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      subjectId,
      subjectName,
      title,
      description,
      type,
      url,
      date: new Date().toLocaleDateString('pt-BR'),
      duration: duration || undefined
    };

    onSave(newLesson);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl flex flex-col gap-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold font-display">Adicionar Nova Aula</h3>
          <button 
            onClick={onCancel}
            className="p-2 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Disciplina / Turma</label>
            <div className="relative">
              <select 
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-zinc-900 border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white appearance-none pr-10"
              >
                <option value="">Selecione uma disciplina...</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Título da Aula</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introdução ao React Hooks"
              className="w-full bg-zinc-900 border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Descrição</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o conteúdo abordado..."
              className="w-full h-24 bg-zinc-900 border border-[var(--border)] rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Tipo de Mídia</label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white appearance-none pr-10"
                >
                  <option value="youtube">Vídeo do YouTube</option>
                  <option value="video">Arquivo de Vídeo</option>
                  <option value="pdf">Documento PDF / Slides</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Duração (Opcional)</label>
              <input 
                type="text" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 45 min"
                className="w-full bg-zinc-900 border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Link da Aula (URL)</label>
            <input 
              type="url" 
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: https://www.youtube.com/watch?v=..."
              className="w-full bg-zinc-900 border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all text-white"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-3.5 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-white/5 transition-all text-center"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3.5 sidebar-grad text-white rounded-xl text-xs font-extrabold shadow-lg shadow-orange-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
            >
              Salvar Aula
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
