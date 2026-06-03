import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  BookOpen, 
  Clock, 
  Calendar, 
  Plus, 
  X, 
  ExternalLink, 
  AlertTriangle,
  PlayCircle,
  FileText,
  ChevronDown,
  Trash2
} from 'lucide-react';
import Header from '../components/layout/Header';
import LessonForm from '../components/forms/LessonForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Lesson, Subject, Notification } from '../types';

interface LessonsProps {
  lessons: Lesson[];
  subjects: Subject[];
  canCreate: boolean;
  onAddLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  selectedAdminSubjectId?: string | null;
  setSelectedAdminSubjectId?: (id: string | null) => void;
  isDarkMode: boolean;
}

// Extrai ID do vídeo do YouTube para incorporação
function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function Lessons({
  lessons,
  subjects,
  canCreate,
  onAddLesson,
  onDeleteLesson,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  selectedAdminSubjectId,
  setSelectedAdminSubjectId,
  isDarkMode
}: LessonsProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activePlaybackLesson, setActivePlaybackLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  const isAdminView = setSelectedAdminSubjectId !== undefined;

  // Filtra as aulas baseado na disciplina selecionada
  const filteredLessons = isAdminView
    ? (selectedAdminSubjectId ? lessons.filter(l => l.subjectId === selectedAdminSubjectId) : lessons)
    : (selectedSubjectId === 'all' ? lessons : lessons.filter(l => l.subjectId === selectedSubjectId));

  const activeSubject = subjects.find(s => s.id === (isAdminView ? selectedAdminSubjectId : selectedSubjectId));

  // Framer Motion spring config
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20 } }
  };

  const handleSaveLesson = (newLesson: Lesson) => {
    onAddLesson(newLesson);
    setIsFormOpen(false);
  };

  const youtubeVideoId = activePlaybackLesson ? getYoutubeId(activePlaybackLesson.url) : null;

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <Header 
        title="Aulas Acadêmicas" 
        subtitle="Assista a transmissões, videoaulas e acesse materiais didáticos de apoio." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Controles de Título, Filtro e Criação */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-display">Aulas e Materiais</h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium text-base">Explore videoaulas e materiais de apoio das suas turmas.</p>
        </div>

        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFormOpen(true)}
            className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all w-full lg:w-auto justify-center"
          >
            <Plus size={18} />
            Publicar Aula
          </motion.button>
        )}
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

      {/* Filtro por Matéria para Alunos/Professores */}
      {!isAdminView && (
        <div className={`flex gap-2 p-1.5 border rounded-[20px] overflow-x-auto transition-all duration-300 ${
          isDarkMode ? 'glass border border-[var(--border)]' : 'bg-zinc-100 border-zinc-200 shadow-inner'
        }`}>
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-5 py-2.5 rounded-[14px] font-bold text-sm transition-all relative shrink-0 cursor-pointer ${
              selectedSubjectId === 'all' ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {selectedSubjectId === 'all' && (
              <motion.div 
                layoutId="lessons-active-subject"
                className="absolute inset-0 sidebar-grad rounded-[14px]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">Todas as Matérias</span>
          </button>

          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-5 py-2.5 rounded-[14px] font-bold text-sm transition-all relative shrink-0 cursor-pointer ${
                selectedSubjectId === sub.id ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {selectedSubjectId === sub.id && (
                <motion.div 
                  layoutId="lessons-active-subject"
                  className="absolute inset-0 sidebar-grad rounded-[14px]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {sub.code}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grid de Turmas para Admin quando nenhuma turma está selecionada */}
      {isAdminView && selectedAdminSubjectId === null ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {subjects.map(sub => {
            const subLessons = lessons.filter(l => l.subjectId === sub.id);
            return (
              <motion.div
                key={sub.id}
                variants={itemVariants}
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
                  <span>Conteúdo Publicado</span>
                  <span className="text-orange-500 flex items-center gap-1.5">
                    {subLessons.length} Aulas <ChevronDown size={12} className="-rotate-90" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Listagem de Aulas (Drill-Down / Visão Geral Aluno) */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredLessons.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`md:col-span-2 lg:col-span-3 text-center py-20 border rounded-[32px] max-w-lg mx-auto relative overflow-hidden group transition-all duration-300 ${
                  isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50 shadow-sm'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <BookOpen size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-2 font-display">Sem aulas publicadas</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold max-w-xs mx-auto leading-relaxed">Fique atento, novas videoaulas e materiais de apoio serão adicionados em breve.</p>
              </motion.div>
            ) : (
              filteredLessons.map(lesson => {
                const sub = subjects.find(s => s.id === lesson.subjectId);
                return (
                  <motion.div 
                    key={lesson.id} 
                    variants={itemVariants}
                    layout
                    className={`border rounded-3xl overflow-hidden group transition-all shadow-lg hover:shadow-orange-600/5 flex flex-col justify-between ${
                      isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50'
                    }`}
                  >
                    <div className="p-6 space-y-4">
                      {/* Badge de Disciplina e Tipo */}
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded uppercase tracking-wider border border-orange-500/10">
                          {sub ? sub.code : 'Matéria'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                            {lesson.type === 'youtube' ? 'YouTube Embed' : lesson.type === 'video' ? 'Vídeo MP4' : 'Slides / PDF'}
                          </span>
                          {canCreate && (
                            <button
                              onClick={() => setLessonToDelete(lesson.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Excluir aula"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Título e Descrição */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors line-clamp-1">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-2 leading-relaxed h-8">
                          {lesson.description || 'Nenhuma descrição fornecida para esta aula.'}
                        </p>
                      </div>

                    {/* Info de data e duração */}
                    <div className="flex gap-4 items-center pt-2 text-[10px] font-bold text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-orange-500" />
                        <span>{lesson.date}</span>
                      </div>
                      {lesson.duration && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-orange-500" />
                          <span>{lesson.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ação de assistir/abrir */}
                  <div className="p-6 pt-0">
                    {lesson.type === 'youtube' && youtubeVideoId ? (
                      <button 
                        onClick={() => setActivePlaybackLesson(lesson)}
                        className="w-full py-3.5 sidebar-grad text-white text-xs font-extrabold uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/15 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <PlayCircle size={16} />
                        Assistir Aula
                      </button>
                    ) : (
                      <a 
                        href={lesson.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full py-3.5 bg-[var(--floating-btn)] hover:opacity-90 text-[var(--text-main)] text-xs font-extrabold uppercase tracking-widest rounded-xl border border-[var(--border)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {lesson.type === 'pdf' ? <FileText size={16} /> : <ExternalLink size={16} />}
                        {lesson.type === 'pdf' ? 'Visualizar PDF' : 'Acessar Link'}
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
      )}

      {/* Modal de Criação de Aula */}
      <AnimatePresence>
        {isFormOpen && (
          <LessonForm 
            subjects={subjects}
            onSave={handleSaveLesson}
            onCancel={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal Player Embutido (YouTube) */}
      <AnimatePresence>
        {activePlaybackLesson && youtubeVideoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePlaybackLesson(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-4xl rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col"
            >
              {/* Header do Player */}
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold font-display text-[var(--text-main)]">{activePlaybackLesson.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{activePlaybackLesson.description}</p>
                </div>
                <button 
                  onClick={() => setActivePlaybackLesson(null)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--border)] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Iframe Incorporado */}
              <div className="aspect-video w-full bg-black relative">
                <iframe 
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                  title={activePlaybackLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Aviso do Host de Vídeo (Regra de Design) */}
              <div className="p-4 bg-orange-500/10 border-t border-[var(--border)] flex items-center gap-3 px-6">
                <AlertTriangle size={18} className="text-orange-500 shrink-0" />
                <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">
                  Você está assistindo a um vídeo hospedado externamente no YouTube.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Exclusão de Aula */}
      <ConfirmationModal
        isOpen={lessonToDelete !== null}
        onClose={() => setLessonToDelete(null)}
        onConfirm={() => {
          if (lessonToDelete) {
            onDeleteLesson(lessonToDelete);
          }
        }}
        title="Excluir Aula"
        message="Tem certeza que deseja excluir esta aula? Esta ação não poderá ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Não, voltar"
        variant="danger"
      />
    </div>
  );
}
