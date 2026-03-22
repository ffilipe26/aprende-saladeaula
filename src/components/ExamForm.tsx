import { useState } from 'react';
import { X, Plus, Trash2, Save, Image as ImageIcon, Clock, GraduationCap, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Question, QuestionType } from '../types';

interface ExamFormProps {
  exam?: Exam;
  onSave: (exam: Exam) => void;
  onCancel: () => void;
}

export default function ExamForm({ exam, onSave, onCancel }: ExamFormProps) {
  // ==========================================
  // ESTADOS DO FORMULÁRIO
  // ==========================================
  const [title, setTitle] = useState(exam?.title || '');
  const [subject, setSubject] = useState(exam?.subject || 'MATEMÁTICA');
  const [duration, setDuration] = useState(exam?.duration || '60');
  const [deadlineDate, setDeadlineDate] = useState(exam?.deadlineDate || '');
  const [weight, setWeight] = useState(exam?.weight || '1.0');
  const [image, setImage] = useState(exam?.image || 'https://picsum.photos/seed/exam/800/400');
  const [questions, setQuestions] = useState<Question[]>(exam?.questions || []);

  // ==========================================
  // MANIPULAÇÃO DE QUESTÕES
  // ==========================================
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'multiple_choice',
      options: ['', ''],
      points: 1,
      correctAnswer: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  // ==========================================
  // MANIPULAÇÃO DE ALTERNATIVAS
  // ==========================================
  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...(q.options || []), ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optIdx: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOpts = [...(q.options || [])];
        newOpts.splice(optIdx, 1);
        
        let newCorrect = q.correctAnswer;
        const removedOpt = q.options![optIdx];
        if (Array.isArray(newCorrect)) {
          newCorrect = newCorrect.filter(c => c !== removedOpt);
        } else if (newCorrect === removedOpt) {
          newCorrect = '';
        }

        return { ...q, options: newOpts, correctAnswer: newCorrect };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (questionId: string, option: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        let newCorrect = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [q.correctAnswer].filter(Boolean);
        
        if (newCorrect.includes(option)) {
          newCorrect = newCorrect.filter(c => c !== option);
        } else {
          newCorrect.push(option);
        }
        
        return { ...q, correctAnswer: newCorrect };
      }
      return q;
    }));
  };

  // ==========================================
  // VALIDAÇÃO E SALVAMENTO
  // ==========================================
  const handleSave = () => {
    if (!title || !deadlineDate || questions.length === 0) {
      alert('Por favor, preencha o título, o prazo e adicione pelo menos uma questão.');
      return;
    }

    const newExam: Exam = {
      id: exam?.id || Math.random().toString(36).substr(2, 9),
      title,
      subject,
      duration,
      questionsCount: questions.length,
      deadlineDate,
      weight,
      image: image.trim(),
      status: exam?.status || 'Disponível',
      questions
    };

    onSave(newExam);
  };

  // ==========================================
  // RENDERIZAÇÃO DO FORMULÁRIO
  // ==========================================
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass border border-white/10 w-full max-w-7xl max-h-[90vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl shadow-black/50"
      >
        {/* Cabeçalho do Modal */}
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 sidebar-grad rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight">{exam ? 'Editar Prova' : 'Criar Nova Prova'}</h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">Configure os parâmetros da avaliação oficial.</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel} 
            className="p-3 hover:bg-white/10 rounded-2xl transition-all text-[var(--text-muted)] hover:text-white border border-transparent hover:border-white/5"
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Corpo do Formulário */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Título da Prova</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Exame Final de Cálculo I"
                  className="w-full glass border border-white/5 rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Matéria</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: MATEMÁTICA"
                    className="w-full glass border border-white/5 rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-extrabold uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Duração (minutos)</label>
                  <div className="relative">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full glass border border-white/5 rounded-2xl py-5 pl-16 pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Nota da Prova</label>
                  <input 
                    type="text" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 4.0"
                    className="w-full glass border border-white/5 rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Prazo Final</label>
                  <input 
                    type="datetime-local" 
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full glass border border-white/5 rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">URL da Imagem</label>
                <div className="relative">
                  <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                  <input 
                    type="text" 
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://exemplo.com/prova.jpg"
                    className="w-full glass border border-white/5 rounded-2xl py-5 pl-16 pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Questões */}
          <div className="pt-12 border-t border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
              <div>
                <h3 className="text-2xl font-extrabold font-display tracking-tight">Questões da Avaliação</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Defina as questões e sua respectiva pontuação oficial.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addQuestion}
                className="flex items-center gap-3 bg-orange-500/10 text-orange-500 px-8 py-4 rounded-2xl text-sm font-extrabold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-lg border border-orange-500/20"
              >
                <Plus size={20} />
                Adicionar Questão
              </motion.button>
            </div>

            <div className="space-y-12">
              <AnimatePresence mode="popLayout">
                {questions.map((q, idx) => (
                  <motion.div 
                    key={q.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass border border-white/5 rounded-[40px] p-8 md:p-12 relative group hover:border-orange-500/20 transition-all shadow-xl"
                  >
                    <motion.button 
                      whileHover={{ scale: 1.1, color: '#ef4444' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-8 right-8 p-3 text-zinc-600 transition-all bg-white/5 rounded-2xl border border-white/5"
                      title="Remover Questão"
                    >
                      <Trash2 size={20} />
                    </motion.button>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                      <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center text-sm font-extrabold shadow-lg shadow-orange-500/20">
                              {idx + 1}
                            </span>
                            <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Enunciado da Questão</label>
                          </div>
                          <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                            placeholder="Digite aqui o que você quer perguntar na prova..."
                            className="w-full glass border border-white/5 rounded-[24px] py-6 px-8 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-lg font-medium min-h-[140px] resize-none leading-relaxed"
                          />
                        </div>

                        {q.type === 'multiple_choice' && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Alternativas (Marque as corretas)</label>
                              <button 
                                onClick={() => addOption(q.id)}
                                className="text-[10px] font-extrabold text-orange-500 hover:text-orange-400 flex items-center gap-2 uppercase tracking-widest transition-colors"
                              >
                                <Plus size={14} /> Adicionar Alternativa
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {q.options?.map((opt, optIdx) => (
                                <motion.div 
                                  key={optIdx} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-4 group/opt"
                                >
                                  <motion.div 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleCorrectAnswer(q.id, opt)}
                                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                                      (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) && opt !== ''
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                        : 'border-white/10 hover:border-orange-500/50'
                                    }`}
                                  >
                                    {(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt) && opt !== '' && <Check size={18} />}
                                  </motion.div>
                                  <input 
                                    type="text" 
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(q.options || [])];
                                      newOpts[optIdx] = e.target.value;
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                    placeholder={`Opção ${optIdx + 1}`}
                                    className="flex-1 glass border border-white/5 rounded-2xl py-4 px-6 text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
                                  />
                                  {q.options!.length > 2 && (
                                    <button 
                                      onClick={() => removeOption(q.id, optIdx)}
                                      className="p-3 text-zinc-600 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all bg-white/5 rounded-xl border border-white/5"
                                    >
                                      <X size={18} />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                        <div className="glass bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Tipo de Questão</label>
                            <div className="relative">
                              <select 
                                value={q.type}
                                onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType, options: e.target.value === 'multiple_choice' ? ['', ''] : undefined, correctAnswer: e.target.value === 'multiple_choice' ? [] : '' })}
                                className="w-full glass bg-black/40 border border-white/5 rounded-2xl py-4 pl-6 pr-12 text-[10px] font-extrabold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
                              >
                                <option value="multiple_choice">MÚLTIPLA ESCOLHA</option>
                                <option value="true_false">VERDADEIRO/FALSO</option>
                                <option value="essay">DISSERTATIVA</option>
                              </select>
                              <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Nota</label>
                            <div className="flex items-center gap-4">
                              <input 
                                type="number" 
                                value={q.points}
                                onChange={(e) => updateQuestion(q.id, { points: parseFloat(e.target.value) || 0 })}
                                className="w-full glass bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-center font-extrabold text-lg text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
                              />
                              <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">PTS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-8 md:p-10 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-6 bg-white/5">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-10 py-5 rounded-[24px] font-extrabold text-sm uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all order-2 sm:order-1 glass border border-white/5"
          >
            Descartar
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="sidebar-grad text-white px-12 py-5 rounded-[24px] font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-orange-600/30 transition-all order-1 sm:order-2"
          >
            <Save size={20} />
            Finalizar Prova
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
