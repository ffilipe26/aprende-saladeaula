import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, CheckCircle2, AlertCircle, Trophy, User, ArrowRight, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from '../types';

interface ActivityDetailProps {
  activity: Activity;
  userName: string;
  onBack: () => void;
  onFinish: (score: number) => void;
}

export default function ActivityDetail({ activity, userName, onBack, onFinish }: ActivityDetailProps) {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(parseInt(activity.duration || '60') * 60);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // ==========================================
  // EFEITOS COLATERAIS (TIMER)
  // ==========================================
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished]);

  useEffect(() => {
    if (timeLeft === 0 && isStarted && !isFinished) {
      handleFinish();
    }
  }, [timeLeft]);

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    const question = activity.questions.find(q => q.id === questionId);
    if (question?.type === 'multiple_choice') {
      const currentAnswers = Array.isArray(answers[questionId]) ? [...answers[questionId]] : [];
      if (currentAnswers.includes(answer)) {
        setAnswers(prev => ({ ...prev, [questionId]: currentAnswers.filter(a => a !== answer) }));
      } else {
        setAnswers(prev => ({ ...prev, [questionId]: [...currentAnswers, answer] }));
      }
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    }
  };

  const calculateScore = () => {
    let score = 0;
    activity.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.type === 'multiple_choice') {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean);
        
        const isCorrect = correctAnswers.length === userAnswers.length && 
                          correctAnswers.every(ca => userAnswers.includes(ca));
        
        if (isCorrect) {
          score += q.points;
        }
      } else if (q.type === 'true_false') {
        if (userAnswer === q.correctAnswer) {
          score += q.points;
        }
      } else if (q.type === 'essay') {
        if (userAnswer && userAnswer.length > 20) {
          score += q.points;
        } else if (userAnswer && userAnswer.length > 0) {
          score += q.points / 2;
        }
      }
    });
    return score;
  };

  const handleFinish = () => {
    const score = calculateScore();
    setFinalScore(score);
    setIsFinished(true);
  };

  const progress = Math.round((Object.keys(answers).length / activity.questions.length) * 100) || 0;

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL (TELA INICIAL)
  // ==========================================
  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass border border-[var(--border)] rounded-[48px] p-12 md:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 mesh-gradient opacity-10" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-8 border border-orange-500/20 shadow-xl">
              <AlertCircle size={48} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold mb-6 font-display text-display">Atenção, {userName}!</h1>
            <p className="text-[var(--text-muted)] mb-10 text-lg font-medium max-w-md mx-auto">
              Você está prestes a iniciar a atividade: <br/>
              <span className="text-white font-bold">"{activity.title}"</span>
            </p>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="glass bg-white/5 rounded-3xl p-6 border border-white/5">
                <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Duração</p>
                <p className="text-2xl font-extrabold text-orange-500">{activity.duration || '60'} min</p>
              </div>
              <div className="glass bg-white/5 rounded-3xl p-6 border border-white/5">
                <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Questões</p>
                <p className="text-2xl font-extrabold text-white">{activity.questions.length}</p>
              </div>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 mb-12 text-left">
              <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                <span className="text-orange-500 font-bold">Aviso:</span> O cronômetro começará a contar imediatamente após você clicar no botão abaixo. Você não poderá pausar o tempo.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="flex-1 glass bg-zinc-800/50 text-white py-5 rounded-[24px] font-extrabold hover:bg-zinc-800 transition-all border border-white/5"
              >
                Cancelar
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsStarted(true)}
                className="flex-1 sidebar-grad text-white py-5 rounded-[24px] font-extrabold shadow-2xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3"
              >
                Iniciar Agora
                <Play size={24} fill="currentColor" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL (TELA FINAL)
  // ==========================================
  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass border border-[var(--border)] rounded-[48px] p-12 md:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 mesh-gradient opacity-10" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-32 h-32 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-10 border border-orange-500/20 shadow-xl shadow-orange-500/10"
            >
              <Trophy size={64} />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 font-display text-display">Parabéns, {userName}!</h1>
            <p className="text-[var(--text-muted)] mb-12 text-lg font-medium max-w-md mx-auto">Você concluiu sua atividade com sucesso. Confira seu desempenho detalhado abaixo:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="glass bg-white/5 rounded-[32px] p-8 border border-white/5">
                <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3">Sua Pontuação</p>
                <p className="text-5xl font-extrabold text-orange-500 font-display">
                  {finalScore} <span className="text-2xl text-[var(--text-muted)] font-medium">/ {activity.totalPoints}</span>
                </p>
              </div>
              <div className="glass bg-white/5 rounded-[32px] p-8 border border-white/5">
                <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3">Aproveitamento</p>
                <p className="text-5xl font-extrabold text-emerald-500 font-display">{Math.round((finalScore / activity.totalPoints) * 100)}%</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="flex-1 glass bg-zinc-800/50 text-white py-5 rounded-[24px] font-extrabold hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 border border-white/5"
              >
                <ChevronLeft size={24} />
                Voltar para Atividades
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFinish(finalScore)}
                className="flex-1 sidebar-grad text-white py-5 rounded-[24px] font-extrabold shadow-2xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3"
              >
                Finalizar e Sair
                <ArrowRight size={24} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE (TELA DA ATIVIDADE)
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto px-4 pb-40">
      {/* Cabeçalho da Atividade */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8"
      >
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-4 glass border border-[var(--border)] rounded-2xl hover:text-orange-500 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight">{activity.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-extrabold bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/10">
                {activity.subject}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">• Prof. Ricardo Silva</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="glass border border-orange-500/20 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl shadow-orange-500/5">
            <Clock size={24} className="text-orange-500" />
            <span className="font-mono text-2xl font-extrabold text-orange-500">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 pl-6 border-l border-[var(--border)]">
            <div className="text-right">
              <p className="text-sm font-extrabold">{userName}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-extrabold uppercase tracking-[0.2em]">Estudante</p>
            </div>
            <div className="h-12 w-12 rounded-2xl glass border border-[var(--border)] flex items-center justify-center text-orange-500 shadow-lg">
              <User size={24} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instruções da Atividade */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-orange-500/5 border border-orange-500/10 rounded-[32px] p-8 mb-12 flex gap-6 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-orange-500/20 p-3 rounded-2xl h-fit relative z-10">
          <AlertCircle size={28} className="text-orange-500" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-extrabold text-orange-500 mb-2 uppercase tracking-widest">Instruções Importantes</h3>
          <p className="text-base text-[var(--text-muted)] font-medium leading-relaxed max-w-3xl">
            Esta atividade contém {activity.questions.length} questões e vale {activity.totalPoints} pontos. Você tem uma única tentativa. Certifique-se de revisar suas respostas antes de enviar. O cronômetro não pausa se você fechar a janela.
          </p>
        </div>
      </motion.div>

      {/* Lista de Questões */}
      <div className="space-y-10">
        {activity.questions.map((q, idx) => (
          <motion.div 
            key={q.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="glass border border-[var(--border)] rounded-[40px] p-10 md:p-14 relative group hover:border-orange-500/20 transition-all shadow-xl hover:shadow-orange-500/5"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-extrabold bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full tracking-[0.2em] uppercase border border-orange-500/10">
                QUESTÃO {idx + 1}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                {q.points.toFixed(1)} Pontos
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold mb-12 leading-tight font-display tracking-tight">
              {q.text}
            </h2>

            {/* Renderização Condicional por Tipo de Questão */}
            {q.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 gap-4">
                {q.options?.map((option, optIdx) => {
                  const isSelected = Array.isArray(answers[q.id]) ? answers[q.id].includes(option) : answers[q.id] === option;
                  return (
                    <motion.label 
                      key={optIdx}
                      whileHover={{ x: 10 }}
                      className={`flex items-center p-6 rounded-[24px] border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/5' 
                          : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        name={q.id} 
                        className="hidden" 
                        onChange={() => handleAnswer(q.id, option)}
                        checked={isSelected}
                      />
                      <div className={`w-7 h-7 rounded-xl border-2 mr-5 flex items-center justify-center transition-all ${
                        isSelected ? 'border-orange-500 bg-orange-500 shadow-lg shadow-orange-500/50' : 'border-white/10'
                      }`}>
                        {isSelected && <Check size={18} className="text-white" />}
                      </div>
                      <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-[var(--text-muted)]'}`}>{option}</span>
                    </motion.label>
                  );
                })}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex flex-col sm:flex-row gap-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(q.id, true)}
                  className={`flex-1 py-6 rounded-[24px] border font-extrabold text-lg transition-all ${
                    answers[q.id] === true 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-lg shadow-emerald-500/5' 
                      : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-emerald-500/30'
                  }`}
                >
                  Verdadeiro
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(q.id, false)}
                  className={`flex-1 py-6 rounded-[24px] border font-extrabold text-lg transition-all ${
                    answers[q.id] === false 
                      ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/5' 
                      : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-red-500/30'
                  }`}
                >
                  Falso
                </motion.button>
              </div>
            )}

            {q.type === 'essay' && (
              <textarea 
                placeholder="Digite sua resposta detalhada aqui..."
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full h-56 glass border border-white/5 rounded-[32px] p-8 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all resize-none text-lg font-medium leading-relaxed"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Barra de Progresso Flutuante */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass border border-white/10 rounded-[32px] p-6 shadow-2xl flex items-center gap-8 backdrop-blur-2xl bg-black/40"
        >
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                className="stroke-white/5"
                strokeWidth="3.5"
                fill="none"
                cx="18" cy="18" r="15.9155"
              />
              <motion.circle
                className="stroke-orange-500"
                strokeWidth="3.5"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                fill="none"
                cx="18" cy="18" r="15.9155"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${progress}, 100` }}
                transition={{ duration: 0.5 }}
              />
              <text x="18" y="20.35" className="text-[9px] font-extrabold fill-white text-center font-display" textAnchor="middle" transform="rotate(90 18 18)">{progress}%</text>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">Progresso Geral</p>
            <p className="text-lg font-extrabold">{Object.keys(answers).length} de {activity.questions.length} Questões Respondidas</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            disabled={Object.keys(answers).length < activity.questions.length}
            className="sidebar-grad text-white px-10 py-4 rounded-2xl font-extrabold shadow-xl shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Finalizar
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
