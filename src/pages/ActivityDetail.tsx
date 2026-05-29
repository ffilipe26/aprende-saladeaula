import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, AlertCircle, Trophy, User, ArrowRight, Play, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AuthUser } from '../types';
import { adminService } from '../lib/adminService';
import { supabase } from '../lib/supabase';

interface ActivityDetailProps {
  activity: Activity;
  currentUser: AuthUser;
  isExam?: boolean;
  onBack: () => void;
  onFinish: (score?: number) => void;
  isDarkMode: boolean;
}

export default function ActivityDetail({ activity, currentUser, isExam = false, onBack, onFinish, isDarkMode }: ActivityDetailProps) {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const isAlreadyConcluida = activity.status === 'Concluída';
  
  // Rastreia início da prova para evitar cheat de F5
  const draftKey = `draft_${activity.id}_${currentUser.id}`;
  const startKey = `started_at_${activity.id}_${currentUser.id}`;
  const savedStart = localStorage.getItem(startKey);
  const [isStarted, setIsStarted] = useState(isAlreadyConcluida || !!savedStart);
  
  // Calcula tempo inicial com base na duração máxima e na janela síncrona
  const calculateInitialTime = () => {
    if (isExam) {
      const durationSeconds = Number((activity as any).duration || 60) * 60;
      const startTime = savedStart ? Number(savedStart) : new Date().getTime();
      
      const elapsedSeconds = Math.floor((new Date().getTime() - startTime) / 1000);
      const examTimeLeft = Math.max(0, durationSeconds - elapsedSeconds);
      
      if (activity.deadlineDate) {
        const deadline = new Date(activity.deadlineDate).getTime();
        const deadlineTimeLeft = Math.max(0, Math.floor((deadline - new Date().getTime()) / 1000));
        return Math.min(examTimeLeft, deadlineTimeLeft);
      }
      return examTimeLeft;
    }
    return 60 * 60;
  };
  
  const [timeLeft, setTimeLeft] = useState(calculateInitialTime());
  const initialAnswers = () => {
    try {
      const draft = localStorage.getItem(draftKey);
      return draft ? JSON.parse(draft) : {};
    } catch {
      return {};
    }
  };
  
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers());
  const [isFinished, setIsFinished] = useState(isAlreadyConcluida);
  const [finalScore, setFinalScore] = useState(0);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'submitted' | 'late' | 'graded' | null>(null);
  const [teacherFeedback, setTeacherFeedback] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(isAlreadyConcluida);
  const isDeadlinePassed = activity.deadlineDate ? new Date() > new Date(activity.deadlineDate) : false;

  useEffect(() => {
    if (isAlreadyConcluida) {
      const fetchSubmission = async () => {
        const table = isExam ? 'exam_submissions' : 'activity_submissions';
        const idField = isExam ? 'exam_id' : 'activity_id';
        const { data } = await supabase
          .from(table)
          .select('*')
          .eq(idField, activity.id)
          .eq('student_id', currentUser.id)
          .single();
        if (data) {
          setAnswers(data.answers || {});
          setFinalScore(data.final_score != null ? data.final_score : (data.auto_score || 0));
          setSubmissionStatus(data.status);
          setTeacherFeedback(data.teacher_feedback || null);
        }
        setIsLoadingReview(false);
      };
      fetchSubmission();
    }
  }, [activity.id, isAlreadyConcluida, currentUser.id]);

  // ==========================================
  // EFEITOS COLATERAIS (TIMER DO QUIZ E AUTOSAVE)
  // ==========================================
  useEffect(() => {
    if (!isStarted || isFinished) return;
    
    // Se a prova começou e ainda não salvamos o timestamp inicial no localStorage, salva agora
    if (isExam && !localStorage.getItem(startKey) && !isAlreadyConcluida) {
      localStorage.setItem(startKey, String(new Date().getTime()));
    }

    // Salva rascunho a cada alteração nas answers
    if (!isAlreadyConcluida) {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (isExam) {
          const durationSeconds = Number((activity as any).duration || 60) * 60;
          const savedStart = localStorage.getItem(startKey);
          const startTime = savedStart ? Number(savedStart) : new Date().getTime();
          
          const elapsedSeconds = Math.floor((new Date().getTime() - startTime) / 1000);
          const examTimeLeft = Math.max(0, durationSeconds - elapsedSeconds);
          
          let calculatedLeft = examTimeLeft;
          if (activity.deadlineDate) {
            const deadline = new Date(activity.deadlineDate).getTime();
            const deadlineTimeLeft = Math.max(0, Math.floor((deadline - new Date().getTime()) / 1000));
            calculatedLeft = Math.min(examTimeLeft, deadlineTimeLeft);
          }
          return Math.max(0, Math.min(prev, calculatedLeft));
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished, answers, isExam, activity.deadlineDate, draftKey, startKey, isAlreadyConcluida]);

  useEffect(() => {
    if (timeLeft === 0 && isStarted && !isFinished) {
      handleFinish();
    }
  }, [timeLeft]);

  // ==========================================
  // FUNÇÕES AUXILIARES DE CÁLCULO
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
        
        if (correctAnswers.length > 0) {
          const pointsPerCorrect = q.points / correctAnswers.length;
          let questionScore = 0;
          userAnswers.forEach((ua: string) => {
            if (correctAnswers.includes(ua)) {
              questionScore += pointsPerCorrect;
            }
          });
          score += Math.min(questionScore, q.points);
        }
      } else if (q.type === 'true_false') {
        if (userAnswer === q.correctAnswer) {
          score += q.points;
        }
      } 
      // Questões dissertativas (essay) NÃO recebem nota automática.
      // O professor dará a nota manualmente.
    });
    return score;
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const score = calculateScore();
    setFinalScore(score);
    
    // Verifica se está com atraso
    const now = new Date();
    const deadline = new Date(activity.deadlineDate);
    const isLate = now > deadline;
    const status = isLate ? 'late' : 'submitted';
    setSubmissionStatus(status);

    if (isExam) {
      const res = await adminService.submitExam({
        examId: activity.id,
        studentId: currentUser.id,
        answers,
        score,
        status
      });
      if (res.error) {
        console.error("Erro ao enviar prova:", res.error);
        alert("Erro ao enviar prova no banco de dados: " + res.error);
        setIsSubmitting(false);
        return;
      }
    } else {
      const res = await adminService.submitActivity({
        activityId: activity.id,
        studentId: currentUser.id,
        answers,
        score,
        status
      });
      if (res.error) {
        console.error("Erro ao enviar atividade:", res.error);
        alert("Erro ao enviar atividade no banco de dados: " + res.error);
        setIsSubmitting(false);
        return;
      }
    }

    localStorage.removeItem(draftKey);
    localStorage.removeItem(startKey);
    setIsFinished(true);
    setIsSubmitting(false);
  };

  const progress = Math.round((Object.keys(answers).length / activity.questions.length) * 100) || 0;

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL: PROVA ENCERRADA
  // ==========================================
  if (isExam && isDeadlinePassed && !isAlreadyConcluida) {
    const formattedDeadline = activity.deadlineDate
      ? new Date(activity.deadlineDate).toLocaleString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

    return (
      <div className="max-w-2xl mx-auto text-center py-6 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
            isDarkMode 
              ? 'glass border-red-500/30' 
              : 'bg-white border-red-200/80'
          }`}
        >
          {/* Fundo sutil vermelho */}
          <div className="absolute inset-0 bg-red-500/3 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Ícone principal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
              className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-500/30 shadow-lg shadow-red-500/10"
            >
              <Lock size={36} />
            </motion.div>

            {/* Título e subtítulo */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-[var(--text-main)]">
                Prova Encerrada
              </h1>
              <p className="text-[var(--text-muted)] mt-2 text-sm font-medium max-w-sm mx-auto">
                O período de acesso a esta prova foi encerrado.
              </p>
            </div>

            {/* Box de informações */}
            <div className={`border rounded-2xl p-5 text-left space-y-3 transition-colors duration-300 ${
              isDarkMode ? 'glass bg-red-500/5 border-red-500/15' : 'bg-red-50/50 border-red-250/60'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Prova</span>
                <span className="text-sm font-bold text-[var(--text-main)] text-right max-w-[60%]">{activity.title}</span>
              </div>
              <div className={`h-px transition-colors duration-300 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-200/50'}`} />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Matéria</span>
                <span className="text-sm font-bold text-orange-500">{activity.subject}</span>
              </div>
              <div className={`h-px transition-colors duration-300 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-200/50'}`} />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Prazo encerrado em</span>
                <span className="text-sm font-bold text-red-650 dark:text-red-400">{formattedDeadline}</span>
              </div>
            </div>

            {/* Mensagem de contato */}
            <p className={`text-xs border rounded-xl px-4 py-3 leading-relaxed transition-colors duration-300 ${
              isDarkMode ? 'text-[var(--text-muted)] bg-white/5 border-white/5' : 'text-zinc-600 bg-slate-50 border-zinc-200'
            }`}>
              Caso acredite que há um erro, entre em contato com seu professor.
            </p>

            {/* Botão de voltar */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className={`w-full py-3 rounded-xl font-extrabold transition-all border text-sm flex items-center justify-center gap-2 cursor-pointer ${
                isDarkMode 
                  ? 'glass bg-zinc-800/50 hover:bg-zinc-800 border-white/5 text-[var(--text-main)]' 
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800 shadow-sm'
              }`}
            >
              <ChevronLeft size={18} />
              Voltar às Provas
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL: TELA INICIAL
  // ==========================================
  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-6 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/85'
          }`}
        >
          {/* Fundo mesh fluido para design premium */}
          <div className="absolute inset-0 mesh-gradient opacity-10" />
          
          <div className="relative z-10 space-y-6">
            {/* Ícone de alerta animado */}
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto border border-orange-500/20 shadow-lg">
              <AlertCircle size={32} />
            </div>
            
            {/* Títulos principais da introdução */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-[var(--text-main)]">
                Atenção, {currentUser.name}!
              </h1>
              <p className="text-[var(--text-muted)] mt-2 text-sm md:text-base font-medium max-w-md mx-auto">
                Você está prestes a iniciar a {isExam ? 'prova' : 'atividade'}: <br/>
                <span className="text-[var(--text-main)] font-bold">"{activity.title}"</span>
              </p>
            </div>

            {/* Metadados resumidos da atividade */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl p-4 border transition-colors duration-300 ${
                isDarkMode ? 'glass bg-white/5 border-white/5' : 'bg-slate-50 border-zinc-200 shadow-sm'
              }`}>
                <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1">Duração Estimada</p>
                <p className="text-xl font-extrabold text-orange-500">{isExam ? `${(activity as any).duration || '60'} min` : '60 min'}</p>
              </div>
              <div className={`rounded-2xl p-4 border transition-colors duration-300 ${
                isDarkMode ? 'glass bg-white/5 border-white/5' : 'bg-slate-50 border-zinc-200 shadow-sm'
              }`}>
                <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1">Questões</p>
                <p className="text-xl font-extrabold text-[var(--text-main)]">{activity.questions.length}</p>
              </div>
            </div>

            {/* Caixa de aviso importante */}
            <div className={`border rounded-xl p-4 text-left transition-colors duration-300 ${
              isDarkMode ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-200/50'
            }`}>
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                <span className="text-orange-500 font-bold">Aviso:</span> O cronômetro começará a conta imediatamente após você iniciar. Você não poderá pausar o tempo.
              </p>
            </div>
            
            {/* Botões de Ação de Início */}
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className={`flex-1 py-3 rounded-xl font-extrabold transition-all border text-sm cursor-pointer ${
                  isDarkMode 
                    ? 'glass bg-zinc-800/50 hover:bg-zinc-800 border-white/5 text-[var(--text-main)]' 
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800 shadow-sm'
                }`}
              >
                Cancelar
              </motion.button>
              {isDeadlinePassed ? (
                <div className={`flex-1 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 text-sm border cursor-not-allowed ${
                  isDarkMode ? 'glass bg-red-500/10 text-red-550 border-red-500/20' : 'bg-red-50 text-red-650 border-red-200'
                }`}>
                  Prazo Encerrado
                </div>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsStarted(true)}
                  className="flex-1 sidebar-grad text-white py-3 rounded-xl font-extrabold shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  Iniciar Agora
                  <Play size={16} fill="currentColor" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL: TELA DE RESULTADOS
  // ==========================================
  if (isFinished && !showReview) {
    return (
      <div className="max-w-2xl mx-auto text-center py-6 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/85'
          }`}
        >
          {/* Fundo mesh fluido */}
          <div className="absolute inset-0 mesh-gradient opacity-10" />
          
          <div className="relative z-10 space-y-6">
            {/* Ícone de troféu de sucesso */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto border border-orange-500/20 shadow-lg shadow-orange-500/5"
            >
              <Trophy size={40} />
            </motion.div>
            
            {/* Títulos principais de parabenização */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-[var(--text-main)]">
                Parabéns, {currentUser.name}!
              </h1>
              {submissionStatus === 'late' ? (
                <p className="text-red-400 mt-2 text-sm font-bold max-w-sm mx-auto bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                  Enviado com Atraso. Sua pontuação poderá sofrer penalidades do professor.
                </p>
              ) : (
                <p className="text-[var(--text-muted)] mt-2 text-sm font-medium max-w-sm mx-auto">
                  Você concluiu sua {isExam ? 'prova' : 'atividade'} com sucesso. Confira seu desempenho preliminar abaixo:
                </p>
              )}
            </div>
            
            {/* Cartões de estatísticas de aproveitamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                isDarkMode ? 'glass bg-white/5 border-white/5' : 'bg-slate-50 border-zinc-200 shadow-sm'
              }`}>
                <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-1">Sua Pontuação</p>
                <p className="text-3xl font-extrabold text-orange-500 font-display">
                  {finalScore} <span className="text-lg text-[var(--text-muted)] font-medium">/ {activity.totalPoints}</span>
                </p>
              </div>
              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                isDarkMode ? 'glass bg-white/5 border-white/5' : 'bg-slate-50 border-zinc-200 shadow-sm'
              }`}>
                <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-1">Aproveitamento</p>
                <p className="text-3xl font-extrabold text-emerald-500 font-display">
                  {Math.round((finalScore / activity.totalPoints) * 100)}%
                </p>
              </div>
            </div>

            {/* Ações de finalização da atividade */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!isAlreadyConcluida) onFinish();
                  else onBack();
                }}
                className={`flex-1 py-3 rounded-xl font-extrabold transition-all border text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  isDarkMode 
                    ? 'glass bg-zinc-800/50 hover:bg-zinc-800 border-white/5 text-[var(--text-main)]' 
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800 shadow-sm'
                }`}
              >
                <ChevronLeft size={18} />
                Voltar para {isExam ? 'Provas' : 'Atividades'}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowReview(true)}
                className="flex-1 sidebar-grad text-white py-3 rounded-xl font-extrabold shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Ver Revisão da {isExam ? 'Prova' : 'Atividade'}
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const showCorrectAnswers = showReview;

  if (isLoadingReview) {
    return <div className="text-center py-20 font-bold text-zinc-500">Carregando revisão...</div>;
  }

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL: TELA DE EXECUÇÃO
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 space-y-6">
      
      {/* ========================================== */}
      {/* CABEÇALHO DA ATIVIDADE                     */}
      {/* ========================================== */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]"
      >
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (showReview) setShowReview(false);
              else onBack();
            }}
            className={`p-2.5 border rounded-xl hover:text-orange-500 transition-all shadow-md cursor-pointer ${
              isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-[var(--text-main)]">{activity.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-extrabold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider border border-orange-500/10">
                {activity.subject}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">• Prof. Ricardo Silva</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Mostrador de tempo restante */}
          {!showReview && (
            <div className={`border rounded-xl px-4 py-2 flex items-center gap-2 shadow-md transition-colors duration-300 ${
              isDarkMode ? 'glass border-orange-500/20' : 'bg-orange-50 border-orange-200'
            }`}>
              <Clock size={18} className="text-orange-500" />
              <span className="font-mono text-lg font-bold text-orange-500">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          {/* Perfil e avatar do aluno */}
          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[var(--text-main)]">{currentUser.name}</p>
              <p className="text-[8px] text-[var(--text-muted)] font-extrabold uppercase tracking-widest">Estudante</p>
            </div>
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center text-orange-500 transition-colors duration-300 ${
              isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200'
            }`}>
              <User size={18} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* BARRA DE PROGRESSO ADESIVA (STICKY TOP BAR) */}
      {/* ========================================== */}
      <div className="sticky top-4 z-40">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`border rounded-2xl p-4 shadow-xl flex items-center justify-between gap-6 backdrop-blur-2xl transition-all duration-300 ${
            isDarkMode ? 'glass border-white/10 bg-black/60' : 'bg-white/80 border-zinc-200 shadow-zinc-200/50 text-zinc-800'
          }`}
        >
          {/* Metadados de progresso textual */}
          <div className="shrink-0">
            <p className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Progresso Geral</p>
            <p className="text-sm font-bold text-[var(--text-main)]">
              {Object.keys(answers).length} de {activity.questions.length} Questões
            </p>
          </div>
          
          {/* Barra de progresso horizontal fina */}
          <div className={`flex-1 h-2 rounded-full overflow-hidden border transition-colors duration-300 ${
            isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-100 border-zinc-200/80'
          }`}>
            <motion.div 
              className="h-full sidebar-grad rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Porcentagem calculada */}
          <span className="text-xs font-extrabold text-orange-500 font-display">{progress}%</span>

          {/* Botão Finalizar compacto na mesma linha */}
          {!showReview ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              disabled={Object.keys(answers).length < activity.questions.length || isSubmitting}
              className="sidebar-grad text-white px-5 py-2 rounded-xl text-xs font-extrabold tracking-widest uppercase shadow-md shadow-orange-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar'}
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <div className="px-5 py-2 rounded-xl text-xs font-extrabold tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Modo Revisão
            </div>
          )}
        </motion.div>
      </div>

      {/* ========================================== */}
      {/* ACCORDION DE INSTRUÇÕES DA ATIVIDADE       */}
      {/* ========================================== */}
      <motion.div 
        layout
        className={`border rounded-2xl overflow-hidden shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50/50 border-orange-200/70'
        }`}
      >
        {/* Cabeçalho para abrir/fechar instruções */}
        <button 
          onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-500/5 transition-colors focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-xl">
              <AlertCircle size={18} className="text-orange-500" />
            </div>
            <h3 className="text-sm font-extrabold text-orange-500 uppercase tracking-widest">Instruções Importantes</h3>
          </div>
          <motion.div
            animate={{ rotate: isInstructionsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-orange-500"
          >
            <ChevronLeft size={16} className="-rotate-90" />
          </motion.div>
        </button>

        {/* Corpo expansivo com AnimatePresence */}
        <AnimatePresence>
          {isInstructionsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-orange-500/10"
            >
              <div className="p-4 text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                {showReview 
                  ? (isDeadlinePassed 
                      ? "O prazo final da atividade encerrou, portanto o gabarito oficial agora está disponível para visualização." 
                      : "O gabarito oficial só será exibido após o encerramento do prazo desta atividade.")
                  : `Esta atividade contém ${activity.questions.length} questões e vale ${activity.totalPoints} pontos. Você tem uma única tentativa. Certifique-se de revisar suas respostas antes de enviar. O cronômetro não pausa se você fechar a janela.`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========================================== */}
      {/* FEEDBACK DO PROFESSOR                      */}
      {/* ========================================== */}
      {showReview && teacherFeedback && (
        <div className={`border rounded-3xl p-6 md:p-8 space-y-3 transition-colors duration-300 ${
          isDarkMode ? 'glass border-orange-500/20 bg-orange-500/5' : 'bg-orange-50 border-orange-200/60 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <Trophy className="text-orange-500 animate-bounce" size={24} />
            <h3 className="text-lg font-bold font-display text-[var(--text-main)]">Feedback do Professor</h3>
          </div>
          <p className={`text-sm font-medium leading-relaxed p-4 rounded-2xl border transition-colors duration-300 ${
            isDarkMode ? 'bg-black/20 text-zinc-300 border-white/5' : 'bg-white text-zinc-700 border-orange-200'
          }`}>
            {teacherFeedback}
          </p>
        </div>
      )}

      {/* ========================================== */}
      {/* LISTA DE QUESTÕES (DESIGN COMPACTADO)      */}
      {/* ========================================== */}
      <div className="space-y-6">
        {activity.questions.map((q, idx) => (
          <motion.div 
            key={q.id} 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className={`border rounded-3xl p-6 md:p-8 relative group transition-all shadow-md space-y-6 duration-300 ${
              isDarkMode 
                ? 'glass border-[var(--border)] hover:border-orange-500/10 hover:shadow-orange-500/5' 
                : 'bg-white border-zinc-200 shadow-zinc-200/30 hover:border-orange-500/20 hover:shadow-orange-500/2'
            }`}
          >
            {/* Badge de número da questão e pontos */}
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-extrabold bg-orange-500/10 text-orange-500 px-3 py-1 rounded-lg tracking-wider uppercase border border-orange-500/10">
                QUESTÃO {idx + 1}
              </span>
              <span className={`text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border transition-colors duration-300 ${
                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-55 border-zinc-250'
              }`}>
                {q.points.toFixed(1)} Pontos
              </span>
            </div>
            
            {/* Texto principal do enunciado */}
            <h2 className="text-base md:text-lg font-bold leading-snug font-display tracking-tight text-[var(--text-main)]">
              {q.text}
            </h2>

            {/* Renderizadores específicos para cada tipo de questão */}
            {q.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 gap-2.5">
                {q.options?.map((option, optIdx) => {
                  const isSelected = Array.isArray(answers[q.id]) ? answers[q.id].includes(option) : answers[q.id] === option;
                  const isCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(option) : q.correctAnswer === option;
                  
                  let borderClass = isSelected 
                    ? 'border-orange-500/40 bg-orange-500/5 shadow-sm' 
                    : (isDarkMode 
                        ? 'border-[var(--border)] bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--text-muted)]' 
                        : 'border-zinc-200 bg-slate-50/50 hover:bg-slate-100/60 text-zinc-600');

                  let checkClass = isSelected 
                    ? 'border-orange-500 bg-orange-500 shadow-md shadow-orange-500/30' 
                    : (isDarkMode ? 'border-white/10' : 'border-zinc-300');
                  
                  if (showCorrectAnswers) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500/60 bg-emerald-500/10 shadow-sm shadow-emerald-500/5 text-emerald-700 dark:text-emerald-300';
                      checkClass = 'border-emerald-500 bg-emerald-500 text-white';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-red-500/40 bg-red-500/5 text-red-650 dark:text-red-400';
                      checkClass = 'border-red-500 bg-red-500 text-white';
                    }
                  }

                  return (
                    <motion.label 
                      key={optIdx}
                      whileHover={{ x: showReview ? 0 : 4 }}
                      className={`flex items-center p-4 rounded-xl border transition-all ${borderClass} ${showReview ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <input 
                        type="checkbox" 
                        name={q.id} 
                        className="hidden" 
                        onChange={() => !showReview && handleAnswer(q.id, option)}
                        checked={isSelected}
                        disabled={showReview}
                      />
                      {/* Seletor visual da opção */}
                      <div className={`w-5 h-5 rounded-lg border mr-4 flex items-center justify-center transition-all ${checkClass}`}>
                        {(isSelected || (showCorrectAnswers && isCorrect)) && <Check size={12} className="text-white" />}
                      </div>
                      <span className={`text-sm font-semibold ${isSelected || (showCorrectAnswers && isCorrect) ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{option}</span>
                    </motion.label>
                  );
                })}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: showReview ? 1 : 1.01 }}
                  whileTap={{ scale: showReview ? 1 : 0.99 }}
                  onClick={() => !showReview && handleAnswer(q.id, true)}
                  disabled={showReview}
                  className={`flex-1 py-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    showCorrectAnswers
                      ? (q.correctAnswer === 'true'
                          ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 shadow-sm' : 'bg-emerald-50 border-emerald-550 text-emerald-700 shadow-sm')
                          : answers[q.id] === true
                            ? 'bg-red-500/10 border-red-500/40 text-red-500'
                            : (isDarkMode ? 'bg-white/5 border-[var(--border)] text-[var(--text-muted)]' : 'bg-slate-50 border-zinc-200 text-zinc-550'))
                      : (answers[q.id] === true 
                          ? (isDarkMode ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-sm' : 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm') 
                          : (isDarkMode ? 'bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/20' : 'bg-slate-50 border-zinc-200 text-zinc-550 hover:bg-slate-100'))
                  }`}
                >
                  Verdadeiro
                </motion.button>
                <motion.button 
                  whileHover={{ scale: showReview ? 1 : 1.01 }}
                  whileTap={{ scale: showReview ? 1 : 0.99 }}
                  onClick={() => !showReview && handleAnswer(q.id, false)}
                  disabled={showReview}
                  className={`flex-1 py-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    showCorrectAnswers
                      ? (q.correctAnswer === 'false'
                          ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 shadow-sm' : 'bg-emerald-50 border-emerald-550 text-emerald-700 shadow-sm')
                          : answers[q.id] === false
                            ? 'bg-red-500/10 border-red-500/40 text-red-500'
                            : (isDarkMode ? 'bg-white/5 border-[var(--border)] text-[var(--text-muted)]' : 'bg-slate-50 border-zinc-200 text-zinc-550'))
                      : (answers[q.id] === false 
                          ? (isDarkMode ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-sm' : 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm') 
                          : (isDarkMode ? 'bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/20' : 'bg-slate-50 border-zinc-200 text-zinc-550 hover:bg-slate-100'))
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
                onChange={(e) => !showReview && handleAnswer(q.id, e.target.value)}
                readOnly={showReview}
                className={`w-full h-36 border rounded-2xl p-4 focus:outline-none transition-all resize-none text-sm font-medium leading-relaxed ${
                  showReview 
                    ? (isDarkMode ? 'bg-black/20 text-zinc-300 border-white/5' : 'bg-slate-50 text-zinc-500 border-zinc-200') 
                    : (isDarkMode 
                        ? 'glass border-white/5 text-white focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/40' 
                        : 'bg-white text-zinc-800 border-zinc-200 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/40')
                }`}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
