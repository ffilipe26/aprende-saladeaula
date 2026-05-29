import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, Plus, Trash2, CheckCircle2, 
  Circle, HelpCircle, AlignLeft, Calendar, BookOpen, Clock, 
  Settings2, Image as ImageIcon, Target, Type
} from 'lucide-react';
import { Subject, Question, QuestionType, AuthUser } from '../types';
import { adminService } from '../lib/adminService';
import Header from '../components/layout/Header';
import DateTimeInput from '../components/ui/DateTimeInput';

interface ActivityCreatorProps {
  currentUser: AuthUser;
  subjects: Subject[];
  onBack: () => void;
  onNavigate: (section: string) => void;
  onReload?: () => void;
}

export default function ActivityCreator({ currentUser, subjects, onBack, onNavigate, onReload }: ActivityCreatorProps) {
  // Configurações Gerais da Atividade
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Lista de Questões
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Derivados
  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

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
    if (!title || !subjectId || !deadline) {
      setFeedback({ type: 'error', msg: 'Preencha o Título, Disciplina e Data de Entrega.' });
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
    }

    setIsLoading(true);
    setFeedback(null);

    const result = await adminService.createActivity({
      subjectId,
      teacherId: currentUser.id,
      title,
      instructions,
      questions,
      totalPoints,
      deadlineDate: deadline,
      status: 'published'
    });

    setIsLoading(false);

    if (result.error) {
      setFeedback({ type: 'error', msg: result.error });
    } else {
      setFeedback({ type: 'success', msg: 'Atividade criada com sucesso!' });
      if (onReload) onReload();
      setTimeout(() => {
        onNavigate('activities');
      }, 1500);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-body)] text-white relative">
      <div className="flex items-center justify-between p-6 lg:px-12 border-b border-white/5 bg-black/20 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight">Criador de Atividades</h1>
            <p className="text-xs text-zinc-400 font-medium">Elabore provas e exercícios com correção automática</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Total de Pontos</span>
            <span className="text-2xl font-black text-orange-500">{totalPoints} <span className="text-sm text-zinc-500">pts</span></span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-600/30 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {isLoading ? 'Salvando...' : 'Salvar e Publicar'}
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
          <div className="glass border border-white/5 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Settings2 className="text-orange-500" size={24} />
              <h2 className="text-xl font-bold font-display">Configurações Gerais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Título da Atividade</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Prova Final de Cálculo II"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Disciplina Alvo</label>
                <div className="relative">
                  <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <select 
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-bold"
                  >
                    <option value="" className="bg-zinc-900">Selecione uma disciplina...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-zinc-900">{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <DateTimeInput
                value={deadline}
                onChange={setDeadline}
                label="Data e Hora Limite"
              />

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Instruções aos Alunos (Opcional)</label>
                <textarea 
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Descreva as regras da prova, o que é permitido consultar, etc."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none font-medium text-sm"
                />
              </div>
            </div>
          </div>

          {/* Construtor de Questões */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black font-display flex items-center gap-3">
                <Target className="text-orange-500" />
                Questões da Atividade
              </h2>
              <span className="text-zinc-400 font-bold text-sm">{questions.length} questões</span>
            </div>

            <AnimatePresence>
              {questions.map((q, index) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass border border-white/10 rounded-[32px] p-8 relative group"
                >
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
                        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest border border-orange-500/20 bg-orange-500/10 px-3 py-1 rounded-full">
                          {q.type === 'multiple_choice' ? 'Múltipla Escolha' : q.type === 'true_false' ? 'Verdadeiro ou Falso' : 'Dissertativa'}
                        </span>
                      </div>
                      <textarea 
                        value={q.text}
                        onChange={e => updateQuestion(q.id, { text: e.target.value })}
                        placeholder="Digite o enunciado da questão..."
                        rows={2}
                        className="w-full bg-transparent border-b border-white/10 focus:border-orange-500 px-0 py-2 text-white focus:outline-none transition-colors resize-none font-bold text-lg"
                      />
                    </div>
                    
                    <div className="w-32 shrink-0 space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pontos</label>
                      <input 
                        type="number" 
                        value={q.points}
                        onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-black text-center text-xl"
                      />
                    </div>
                  </div>

                  {/* Lógica Específica por Tipo */}
                  <div className="pl-11">
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
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
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                              }`}
                            >
                              {(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) && <CheckCircle2 size={14} />}
                            </button>
                            <input 
                              type="text" 
                              value={opt}
                              onChange={e => updateOption(q.id, optIdx, e.target.value)}
                              className={`flex-1 bg-black/20 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none transition-colors ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) ? 'border-emerald-500/50 text-emerald-100' : 'border-white/5 text-zinc-300 focus:border-white/20'
                              }`}
                            />
                            {q.options!.length > 2 && (
                              <button 
                                onClick={() => removeOption(q.id, optIdx)}
                                className="text-zinc-500 hover:text-red-500 p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => addOption(q.id)}
                          className="mt-2 text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1"
                        >
                          <Plus size={14} /> Adicionar Opção
                        </button>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gabarito:</span>
                        <button 
                          onClick={() => updateQuestion(q.id, { correctAnswer: 'true' })}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            q.correctAnswer === 'true' 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          Verdadeiro
                        </button>
                        <button 
                          onClick={() => updateQuestion(q.id, { correctAnswer: 'false' })}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            q.correctAnswer === 'false' 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          Falso
                        </button>
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-start gap-3 mt-4">
                        <HelpCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-orange-200">Correção Manual</p>
                          <p className="text-xs text-orange-200/70 mt-1 leading-relaxed">
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
                className="flex-1 glass border border-orange-500/30 hover:bg-orange-500/10 text-orange-500 p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Circle size={20} />
                </div>
                Múltipla Escolha
              </button>

              <button 
                onClick={() => addQuestion('true_false')}
                className="flex-1 glass border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                Verdadeiro ou Falso
              </button>

              <button 
                onClick={() => addQuestion('essay')}
                className="flex-1 glass border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 p-5 rounded-[24px] font-extrabold flex items-center justify-center gap-3 transition-all group"
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
