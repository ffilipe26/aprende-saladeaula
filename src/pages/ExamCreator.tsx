import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, Plus, Trash2, CheckCircle2, 
  Circle, HelpCircle, AlignLeft, Calendar, BookOpen, Clock, 
  Settings2, Image as ImageIcon, Target, Trophy, Info
} from 'lucide-react';
import { Subject, Question, QuestionType, AuthUser } from '../types';
import { adminService } from '../lib/adminService';
import DateTimeInput from '../components/ui/DateTimeInput';

interface ExamCreatorProps {
  currentUser: AuthUser;
  subjects: Subject[];
  onBack: () => void;
  onNavigate: (section: string) => void;
  onReload?: (subjectId?: string) => void;
  isDarkMode: boolean;
}

const PRESET_IMAGES = [
  {
    name: 'Laranja Tech',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Azul Abstrato',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Matemática Verde',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Roxo Código',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
  }
];

export default function ExamCreator({ currentUser, subjects, onBack, onNavigate, onReload, isDarkMode }: ExamCreatorProps) {
  // Configurações Gerais do Exame
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [weight, setWeight] = useState('2.0');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Lista de Questões
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Derivados
  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  // Duração calculada automaticamente a partir das datas
  const autoDuration = useMemo(() => {
    if (!startDate || !deadlineDate) return null;
    const diffMs = new Date(deadlineDate).getTime() - new Date(startDate).getTime();
    if (diffMs <= 0) return null;
    const totalMin = Math.round(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (h > 0 && min > 0) return { label: `${h}h ${min}min`, minutes: totalMin };
    if (h > 0) return { label: `${h}h`, minutes: totalMin };
    return { label: `${min}min`, minutes: totalMin };
  }, [startDate, deadlineDate]);

  // ==========================================
  // LÓGICA DE QUESTÕES
  // ==========================================
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      text: '',
      points: 10,
      options: type === 'multiple_choice' ? ['Opção 1', 'Opção 2'] : undefined,
      correctAnswer: type === 'multiple_choice' ? ['Opção 1'] : type === 'true_false' ? 'true' : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateOption = (qId: string, optIndex: number, newValue: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId || !q.options) return q;
      const newOptions = [...q.options];
      const oldVal = newOptions[optIndex];
      newOptions[optIndex] = newValue;
      
      // Se a opção que mudou era a resposta certa, atualiza a resposta certa
      let newCorrectAnswer = q.correctAnswer;
      if (Array.isArray(q.correctAnswer)) {
        if (q.correctAnswer.includes(oldVal)) {
          newCorrectAnswer = q.correctAnswer.map((ans: string) => ans === oldVal ? newValue : ans);
        }
      } else if (q.correctAnswer === oldVal) {
        newCorrectAnswer = newValue;
      }
      
      return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
    }));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId || !q.options) return q;
      return { ...q, options: [...q.options, `Nova Opção ${q.options.length + 1}`] };
    }));
  };

  const removeOption = (qId: string, optIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId || !q.options) return q;
      const newOptions = q.options.filter((_, idx) => idx !== optIndex);
      return { ...q, options: newOptions };
    }));
  };

  // ==========================================
  // SALVAR NO BANCO
  // ==========================================
  const handleSave = async () => {
    if (!title || !subjectId || !deadlineDate) {
      setFeedback({ type: 'error', msg: 'Preencha o Título, Disciplina e Janela de Fim da Prova.' });
      return;
    }
    if (!startDate) {
      setFeedback({ type: 'error', msg: 'O Início da Janela é obrigatório.' });
      return;
    }
    if (new Date(startDate) >= new Date(deadlineDate)) {
      setFeedback({ type: 'error', msg: 'A data/hora de início deve ser anterior à data de fim da janela.' });
      return;
    }
    if (questions.length === 0) {
      setFeedback({ type: 'error', msg: 'Adicione pelo menos uma questão.' });
      return;
    }
    
    // Validar se perguntas têm texto e opções válidas
    for (const q of questions) {
      if (!q.text.trim()) {
        setFeedback({ type: 'error', msg: 'Todas as questões precisam de um enunciado.' });
        return;
      }
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        setFeedback({ type: 'error', msg: 'Questões de múltipla escolha precisam de pelo menos 2 opções.' });
        return;
      }
      if (q.type !== 'essay' && (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0))) {
        setFeedback({ type: 'error', msg: 'Todas as questões objetivas precisam de um gabarito definido.' });
        return;
      }
    }

    setIsLoading(true);
    setFeedback(null);

    // Calcular duração automaticamente a partir das datas
    const computedDuration = autoDuration ? autoDuration.minutes : 60;
    const finalImage = customImageUrl.trim() || imageUrl;

    const result = await adminService.createExam({
      subjectId,
      teacherId: currentUser.id,
      title,
      instructions: instructions || undefined,
      duration: computedDuration,
      questionsCount: questions.length,
      weight,
      image: finalImage,
      questions,
      startDate: startDate || undefined,
      deadlineDate,
      status: 'published'
    });

    setIsLoading(false);

    if (result.error) {
      setFeedback({ type: 'error', msg: result.error });
    } else {
      setFeedback({ type: 'success', msg: 'Prova criada com sucesso!' });
      if (onReload) onReload(subjectId);
      setTimeout(() => {
        onNavigate('exams');
      }, 1500);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-body)] text-[var(--text-main)] relative">
      <div className={`flex items-center justify-between p-6 lg:px-12 border-b z-10 shrink-0 backdrop-blur-md ${
        isDarkMode ? 'border-white/5 bg-black/20' : 'border-zinc-200/80 bg-white/60'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black font-display tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Criador de Provas</h1>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Crie exames oficiais com temporizador e janela síncrona</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-550' : 'text-zinc-400'}`}>Total de Pontos</span>
            <span className="text-2xl font-black text-orange-500">{totalPoints} <span className="text-sm text-zinc-550">pts</span></span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={20} />
            {isLoading ? 'Salvando...' : 'Salvar e Publicar Prova'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
          
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl font-bold flex items-center gap-3 ${
                feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <HelpCircle size={20} />}
              {feedback.msg}
            </motion.div>
          )}

          {/* Configurações Gerais */}
          <div className={`border rounded-[32px] p-8 md:p-10 space-y-8 transition-all duration-300 ${
            isDarkMode 
              ? 'glass border-white/5 shadow-2xl' 
              : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-200/40'
          }`}>
            <div className={`flex items-center gap-3 border-b pb-4 ${isDarkMode ? 'border-white/5' : 'border-zinc-200/80'}`}>
              <Settings2 className="text-orange-500" size={24} />
              <h2 className={`text-xl font-bold font-display ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Configurações Gerais da Prova</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Título da Prova</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Exame Final de Álgebra Linear"
                  className={`w-full border rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors font-bold text-lg ${
                    isDarkMode 
                      ? 'bg-black/40 border-white/10 text-white placeholder:text-zinc-650' 
                      : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Disciplina Alvo</label>
                <div className="relative">
                  <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <select 
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className={`w-full border rounded-2xl pl-14 pr-5 py-4 focus:outline-none focus:border-orange-500 transition-colors appearance-none font-bold ${
                      isDarkMode 
                        ? 'bg-black/40 border-white/10 text-white' 
                        : 'bg-slate-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="" className={isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>Selecione uma disciplina...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className={isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>
                  <Trophy size={12} /> Peso na Nota
                </label>
                <input 
                  type="text" 
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Ex: 2.0"
                  className={`w-full border rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors font-bold ${
                    isDarkMode 
                      ? 'bg-black/40 border-white/10 text-white placeholder:text-zinc-650' 
                      : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>

              <DateTimeInput 
                value={startDate}
                onChange={setStartDate}
                label="Início da Janela (obrigatório — data/hora em que a prova começa)"
              />

              <DateTimeInput 
                value={deadlineDate}
                onChange={setDeadlineDate}
                label="Fim da Janela (Data/hora limite para realizar a prova)"
              />

              {/* Preview de Duração Automática */}
              {autoDuration && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`md:col-span-2 flex items-center gap-3 border rounded-2xl px-5 py-4 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-orange-500/10 border-orange-500/20' 
                      : 'bg-orange-50 border-orange-200/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-orange-650 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-orange-650 dark:text-orange-400 uppercase tracking-widest">Duração da Prova (calculada automaticamente)</p>
                    <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-orange-955'}`}>{autoDuration.label}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-orange-600/70 dark:text-orange-400/70">
                    <Info size={14} />
                    <span className="text-[10px] font-bold">Baseado no intervalo de datas</span>
                  </div>
                </motion.div>
              )}

              {/* Aviso de datas inválidas */}
              {startDate && deadlineDate && !autoDuration && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`md:col-span-2 flex items-center gap-3 border rounded-2xl px-5 py-4 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-red-50 border-red-200/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <Info size={18} className="text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm font-bold text-red-650 dark:text-red-400">O início deve ser anterior ao fim da janela.</p>
                </motion.div>
              )}

              {/* Seleção de Imagem Capa */}
              <div className={`space-y-4 md:col-span-2 border-t pt-6 transition-colors duration-300 ${isDarkMode ? 'border-white/5' : 'border-zinc-200/80'}`}>
                <label className={`text-xs font-bold uppercase tracking-widest block ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Imagem de Capa da Prova</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {PRESET_IMAGES.map((img) => {
                    const isSelected = imageUrl === img.url && !customImageUrl;
                    return (
                      <div 
                        key={img.name}
                        onClick={() => {
                          setImageUrl(img.url);
                          setCustomImageUrl('');
                        }}
                        className={`h-24 rounded-2xl overflow-hidden relative cursor-pointer border-2 transition-all ${
                          isSelected ? 'border-orange-500 scale-[1.03] shadow-lg shadow-orange-500/20' : (isDarkMode ? 'border-white/10 opacity-70 hover:opacity-100' : 'border-zinc-200 opacity-70 hover:opacity-100')
                        }`}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white text-center px-2">{img.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Ou insira uma URL de imagem customizada</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input 
                      type="url" 
                      value={customImageUrl}
                      onChange={e => setCustomImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/imagem.png"
                      className={`w-full border rounded-2xl pl-14 pr-5 py-4 text-sm focus:outline-none focus:border-orange-500 transition-colors font-medium ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/10 text-white placeholder:text-zinc-650' 
                          : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Instruções aos Alunos (Opcional)</label>
                <textarea 
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Descreva as regras da prova, o que é permitido consultar, etc."
                  rows={3}
                  className={`w-full border rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors resize-none font-medium text-sm ${
                    isDarkMode 
                      ? 'bg-black/40 border-white/10 text-white placeholder:text-zinc-650' 
                      : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-450'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Construtor de Questões */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black font-display flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                <Target className="text-orange-500" />
                Questões da Prova
              </h2>
              <span className={`font-bold text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{questions.length} questões</span>
            </div>

            <AnimatePresence>
              {questions.map((q, index) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`border rounded-[32px] p-8 relative group transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass border-white/10 shadow-2xl' 
                      : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-200/30'
                  }`}
                >
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remover Questão"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded-full sidebar-grad flex items-center justify-center text-sm font-black text-white">
                          {index + 1}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-widest border px-3 py-1 rounded-full ${
                          isDarkMode 
                            ? 'text-orange-500 border-orange-500/20 bg-orange-500/10' 
                            : 'text-orange-655 border-orange-200 bg-orange-50/60'
                        }`}>
                          {q.type === 'multiple_choice' ? 'Múltipla Escolha' : q.type === 'true_false' ? 'Verdadeiro ou Falso' : 'Dissertativa'}
                        </span>
                      </div>
                      <textarea 
                        value={q.text}
                        onChange={e => updateQuestion(q.id, { text: e.target.value })}
                        placeholder="Digite o enunciado da questão..."
                        rows={2}
                        className={`w-full bg-transparent border-b focus:border-orange-500 px-0 py-2 focus:outline-none transition-colors resize-none font-bold text-lg ${
                          isDarkMode ? 'border-white/10 text-white placeholder:text-zinc-650' : 'border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                        }`}
                      />
                    </div>
                    
                    <div className="w-32 shrink-0 space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Pontos</label>
                      <input 
                        type="number" 
                        value={q.points}
                        onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })}
                        className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors font-black text-center text-xl ${
                          isDarkMode 
                            ? 'bg-black/40 border-white/10 text-white' 
                            : 'bg-slate-50 border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Lógica Específica por Tipo */}
                  <div className="pl-11">
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>
                          Defina as opções e marque a correta (Correção Automática)
                        </label>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                const currentAnswers = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : (q.correctAnswer ? [q.correctAnswer] : []);
                                const isSelected = currentAnswers.includes(opt);
                                let newAnswers;
                                if (isSelected) {
                                  newAnswers = currentAnswers.filter(a => a !== opt);
                                } else {
                                  newAnswers = [...currentAnswers, opt];
                                }
                                updateQuestion(q.id, { correctAnswer: newAnswers });
                              }}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : (isDarkMode ? 'border-zinc-600 hover:border-zinc-400' : 'border-zinc-300 hover:border-zinc-400')
                              }`}
                            >
                              {(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) && <CheckCircle2 size={14} />}
                            </button>
                            <input 
                              type="text" 
                              value={opt}
                              onChange={e => updateOption(q.id, optIdx, e.target.value)}
                              className={`flex-1 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none transition-colors ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) 
                                  ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100' : 'bg-emerald-50/60 border-emerald-500/50 text-emerald-900') 
                                  : (isDarkMode ? 'bg-black/20 border-white/5 text-zinc-350 focus:border-white/20' : 'bg-slate-50 border-zinc-200 text-zinc-700 focus:border-zinc-350')
                              }`}
                            />
                            {q.options!.length > 2 && (
                              <button 
                                onClick={() => removeOption(q.id, optIdx)}
                                className="text-zinc-500 hover:text-red-500 p-2 cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => addOption(q.id)}
                          className="mt-2 text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} /> Adicionar Opção
                        </button>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex items-center gap-4 mt-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Gabarito:</span>
                        <button 
                          onClick={() => updateQuestion(q.id, { correctAnswer: 'true' })}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border cursor-pointer ${
                            q.correctAnswer === 'true' 
                              ? (isDarkMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700') 
                              : (isDarkMode ? 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5' : 'bg-slate-100 border-zinc-200 text-zinc-650 hover:bg-slate-200/70')
                          }`}
                        >
                          Verdadeiro
                        </button>
                        <button 
                          onClick={() => updateQuestion(q.id, { correctAnswer: 'false' })}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border cursor-pointer ${
                            q.correctAnswer === 'false' 
                              ? (isDarkMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700') 
                              : (isDarkMode ? 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5' : 'bg-slate-100 border-zinc-200 text-zinc-650 hover:bg-slate-200/70')
                          }`}
                        >
                          Falso
                        </button>
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className={`border rounded-2xl p-4 flex items-start gap-3 mt-4 transition-colors duration-300 ${
                        isDarkMode ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-200/60'
                      }`}>
                        <HelpCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-orange-200' : 'text-orange-950'}`}>Correção Manual</p>
                          <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-orange-200/70' : 'text-orange-700/80'}`}>
                            O sistema não fará a correção automática desta questão. O aluno digitará um texto livre e você atribuirá a nota posteriormente na aba de "Submissões".
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Botões de Adicionar Nova Questão */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                onClick={() => addQuestion('multiple_choice')}
                className={`flex-1 border p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group cursor-pointer ${
                  isDarkMode 
                    ? 'glass border-orange-500/30 hover:bg-orange-500/10 text-orange-500' 
                    : 'bg-white border-orange-500/35 hover:bg-orange-50/50 text-orange-600 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Circle size={20} />
                </div>
                Múltipla Escolha
              </button>

              <button 
                onClick={() => addQuestion('true_false')}
                className={`flex-1 border p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group cursor-pointer ${
                  isDarkMode 
                    ? 'glass border-blue-500/30 hover:bg-blue-500/10 text-blue-500' 
                    : 'bg-white border-blue-500/35 hover:bg-blue-50/50 text-blue-650 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                Verdadeiro ou Falso
              </button>

              <button 
                onClick={() => addQuestion('essay')}
                className={`flex-1 border p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group cursor-pointer ${
                  isDarkMode 
                    ? 'glass border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500' 
                    : 'bg-white border-emerald-500/35 hover:bg-emerald-50/50 text-emerald-650 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlignLeft size={20} />
                </div>
                Dissertativa
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
