import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Check, AlertCircle, Save, CheckCircle2, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../lib/adminService';
import { supabase } from '../lib/supabase';
import { Activity } from '../types';

interface SubmissionDetailProps {
  activity: Activity;
  isExam?: boolean;
  submissionId: string;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function SubmissionDetail({ activity, isExam, submissionId, onBack, isDarkMode }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editedScore, setEditedScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>({});
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const calcSingleQuestionAutoScore = useCallback((q: any, userAnswer: any): number => {
    if (q.type === 'multiple_choice') {
      const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean);
      if (correctAnswers.length > 0) {
        const pointsPerCorrect = q.points / correctAnswers.length;
        let qScore = 0;
        let hasWrongAnswer = false;
        userAnswers.forEach((ua: string) => {
          if (correctAnswers.includes(ua)) {
            qScore += pointsPerCorrect;
          } else {
            hasWrongAnswer = true;
          }
        });
        if (userAnswers.length > correctAnswers.length || hasWrongAnswer) {
          qScore = 0;
        }
        return Math.min(qScore, q.points);
      }
    } else if (q.type === 'true_false') {
      const correct =
        q.correctAnswer === true || q.correctAnswer === 'true'
          ? true
          : q.correctAnswer === false || q.correctAnswer === 'false'
          ? false
          : q.correctAnswer;
      if (userAnswer === correct) return q.points;
    }
    return 0;
  }, []);

  // Calcula auto-score baseado no gabarito
  const calcAutoScore = useCallback(
    (answers: Record<string, any>): number => {
      let score = 0;
      activity.questions.forEach((q) => {
        score += calcSingleQuestionAutoScore(q, answers[q.id]);
      });
      return Math.round(score * 100) / 100;
    },
    [activity.questions, calcSingleQuestionAutoScore]
  );

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    const table = isExam ? 'exam_submissions' : 'activity_submissions';
    const { data } = await supabase
      .from(table)
      .select('*, users(name, email)')
      .eq('id', submissionId)
      .single();

    if (data) {
      setSubmission(data);
      
      const feedbackMap: Record<string, string> = {};
      const scoreMap: Record<string, number> = {};
      
      if (data.question_feedback) {
        Object.entries(data.question_feedback).forEach(([qId, val]: [string, any]) => {
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            feedbackMap[qId] = val.feedback || '';
            if (val.score !== undefined) {
              scoreMap[qId] = Number(val.score);
            }
          } else {
            feedbackMap[qId] = String(val || '');
          }
        });
        setQuestionFeedback(feedbackMap);
      }

      // Initialize questionScores
      const initialScores: Record<string, number> = {};
      activity.questions.forEach((q) => {
        if (scoreMap[q.id] !== undefined) {
          initialScores[q.id] = scoreMap[q.id];
        } else if (q.type === 'multiple_choice' || q.type === 'true_false') {
          initialScores[q.id] = calcSingleQuestionAutoScore(q, data.answers?.[q.id]);
        } else {
          initialScores[q.id] = 0;
        }
      });
      setQuestionScores(initialScores);

      // Usa final_score se existir; senão calcula auto_score baseado no gabarito
      if (data.final_score != null) {
        setEditedScore(Number(data.final_score));
      } else {
        const computed = calcAutoScore(data.answers || {});
        setEditedScore(computed);
      }
      if (data.teacher_feedback) {
        setFeedback(data.teacher_feedback);
      }
    }
    setLoading(false);
  }, [submissionId, isExam, calcAutoScore, calcSingleQuestionAutoScore, activity.questions]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleQuestionScoreChange = (qId: string, valStr: string, maxPoints: number) => {
    let val = valStr === '' ? NaN : Number(valStr);
    if (!isNaN(val)) {
      val = Math.min(Math.max(val, 0), maxPoints);
    }
    const updated = { ...questionScores, [qId]: val };
    setQuestionScores(updated);
    
    // Auto-calcula a nota final total no topo (ignora NaNs no somatório temporariamente para digitação fluida)
    const total = activity.questions.reduce((acc, q) => {
      const qVal = updated[q.id];
      return acc + (isNaN(qVal) ? 0 : qVal);
    }, 0);
    setEditedScore(Math.round(total * 100) / 100);
  };

  const handleSave = async () => {
    setSaving(true);
    const scoreVal = isNaN(editedScore) ? 0 : editedScore;
    const finalScoreToSave = Math.min(Math.max(scoreVal, 0), activity.totalPoints);
    
    // Combina texto do feedback e nota de cada questão para salvar no JSONB
    const combinedQuestionFeedback: Record<string, any> = {};
    activity.questions.forEach((q) => {
      const qScore = questionScores[q.id];
      combinedQuestionFeedback[q.id] = {
        feedback: questionFeedback[q.id] || '',
        score: isNaN(qScore) ? 0 : qScore
      };
    });

    const res = await adminService.gradeSubmission(
      submissionId,
      isExam ? 'exam' : 'activity',
      finalScoreToSave,
      submission.status,
      feedback,
      combinedQuestionFeedback
    );
    if (res.error) {
      showToast('Erro ao salvar correção: ' + res.error, 'error');
    } else {
      showToast('Correção salva com sucesso!', 'success');
      setTimeout(() => onBack(), 1500);
    }
    setSaving(false);
  };

  // Verifica se resposta objetiva está correta
  const isObjectiveCorrect = (q: Activity['questions'][number], userAnswer: any): boolean => {
    if (q.type === 'multiple_choice') {
      const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean);
      return (
        correct.length === user.length &&
        user.every((a: string) => correct.includes(a)) &&
        correct.every((a: string) => user.includes(a))
      );
    }
    if (q.type === 'true_false') {
      const correct =
        q.correctAnswer === true || q.correctAnswer === 'true'
          ? true
          : q.correctAnswer === false || q.correctAnswer === 'false'
          ? false
          : q.correctAnswer;
      return userAnswer === correct;
    }
    return false;
  };

  const formatCorrectAnswer = (q: Activity['questions'][number]): string => {
    if (q.type === 'true_false') {
      const val = q.correctAnswer === true || q.correctAnswer === 'true';
      return val ? 'Verdadeiro' : 'Falso';
    }
    if (q.type === 'multiple_choice') {
      const arr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      return arr.join(', ');
    }
    return String(q.correctAnswer ?? '');
  };

  const formatUserAnswer = (q: Activity['questions'][number], userAnswer: any): string => {
    if (q.type === 'true_false') {
      if (userAnswer === true) return 'Verdadeiro';
      if (userAnswer === false) return 'Falso';
      return 'Sem resposta';
    }
    if (q.type === 'multiple_choice') {
      if (Array.isArray(userAnswer)) return userAnswer.join(', ') || 'Sem resposta';
      return userAnswer || 'Sem resposta';
    }
    return userAnswer || 'Deixada em branco.';
  };

  if (loading || !submission) {
    return <div className="text-center py-20 text-[var(--text-muted)] font-bold">Carregando entrega...</div>;
  }

  const studentName = Array.isArray(submission.users) ? submission.users[0]?.name : submission.users?.name || 'Aluno';

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 space-y-8">

      {/* ========== TOAST ========== */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-50 border px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm transition-colors duration-300 ${
              toastType === 'success'
                ? (isDarkMode ? 'glass border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                : (isDarkMode ? 'glass border-red-500/30 bg-red-500/10 text-red-400' : 'bg-red-50 border-red-200 text-red-800')
            }`}
          >
            {toastType === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            <p className="text-sm font-bold">{toastMsg}</p>
            <button onClick={() => setToastMsg(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== CABEÇALHO ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 pb-6 border-b border-[var(--border)]"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className={`p-3 border rounded-2xl hover:text-orange-500 transition-all shadow-md cursor-pointer ${
            isDarkMode ? 'glass border-[var(--border)] text-zinc-400' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[var(--text-main)]">Correção Individual</h1>
          <p className="text-[var(--text-muted)] font-medium text-sm mt-1">
            {studentName} — {activity.title}
          </p>
        </div>
      </motion.div>

      {/* ========== VISÃO GERAL ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className={`border rounded-3xl p-6 transition-all duration-300 ${
          isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
        }`}>
          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Pontuação (Editável)</p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              step="0.1"
              min={0}
              max={activity.totalPoints}
              value={isNaN(editedScore) ? '' : editedScore}
              onChange={(e) => {
                const val = e.target.value;
                setEditedScore(val === '' ? NaN : Number(val));
              }}
              className={`w-24 border rounded-xl py-2 px-4 text-2xl font-extrabold focus:outline-none focus:border-orange-500/50 text-center ${
                isDarkMode ? 'bg-black/20 border-[var(--border)] text-orange-500' : 'bg-slate-100 border-zinc-200 text-orange-600'
              }`}
            />
            <span className="text-lg font-bold text-[var(--text-muted)]">/ {activity.totalPoints} pts</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Auto-calculado:{' '}
            <span className="text-orange-500 font-bold">
              {calcAutoScore(submission.answers || {}).toFixed(1)} pts
            </span>
          </p>
        </div>
        {isExam && (
          <div className={`border rounded-3xl p-6 transition-all duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
          }`}>
            <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Status da Submissão</p>
            <div className="flex flex-col gap-1">
              <span className={`text-sm font-bold ${submission.status === 'late' ? 'text-red-500' : 'text-emerald-500'}`}>
                {submission.status === 'late' ? 'Entregue com Atraso' : submission.status === 'graded' ? 'Corrigido' : 'Entregue no Prazo'}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{new Date(submission.created_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========== QUESTÕES E RESPOSTAS ========== */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold font-display tracking-tight text-[var(--text-main)]">Respostas do Aluno</h3>
        {activity.questions.map((q, idx) => {
          const userAnswer = submission.answers?.[q.id];
          const isObjective = q.type === 'multiple_choice' || q.type === 'true_false';
          const correct = isObjective ? isObjectiveCorrect(q, userAnswer) : null;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`border rounded-3xl p-6 md:p-8 space-y-4 transition-all duration-300 ${
                isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
              }`}
            >
              {/* Header questão */}
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-extrabold bg-[var(--border)] text-[var(--text-muted)] px-3 py-1 rounded-lg tracking-wider uppercase">
                  Questão {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {/* Badge correto/errado para objetivas */}
                  {isObjective && userAnswer !== undefined && userAnswer !== null && (
                    correct ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                        <CheckCircle2 size={11} /> CORRETO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                        <XCircle size={11} /> ERRADO
                      </span>
                    )
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border transition-colors duration-300 ${
                    isDarkMode ? 'bg-white/5 border-white/5 text-[var(--text-muted)]' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}>
                    {q.points} pts
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-[var(--text-main)]">{q.text}</h4>

              {/* Resposta do Aluno */}
              <div className={`border rounded-2xl p-4 transition-all duration-300 ${
                isObjective
                  ? correct
                    ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                    : (isDarkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200')
                  : (isDarkMode ? 'bg-black/20 border-white/5 text-zinc-100' : 'bg-slate-50 border-zinc-200 text-zinc-800')
              }`}>
                <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-2 ${
                  isObjective 
                    ? (correct ? (isDarkMode ? 'text-emerald-500' : 'text-emerald-700') : (isDarkMode ? 'text-red-400' : 'text-red-700'))
                    : 'text-orange-500'
                }`}>
                  Resposta do Aluno:
                </p>
                <p className={`text-sm font-medium ${
                  isObjective 
                    ? (correct ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-850 font-bold') : (isDarkMode ? 'text-red-350' : 'text-red-850 font-bold')) 
                    : 'text-[var(--text-main)] whitespace-pre-wrap'
                }`}>
                  {formatUserAnswer(q, userAnswer)}
                </p>
              </div>

              {/* Gabarito (apenas para objetivas) */}
              {isObjective && (
                <div className={`border rounded-2xl p-4 transition-all duration-300 ${
                  isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-2 ${
                    isDarkMode ? 'text-emerald-500' : 'text-emerald-700'
                  }`}>
                    Gabarito:
                  </p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-emerald-450' : 'text-emerald-800'
                  }`}>
                    {formatCorrectAnswer(q)}
                  </p>
                </div>
              )}

              {/* Para dissertativas: só campo de resposta, sem gabarito automático */}
              {q.type === 'essay' && (
                <p className="text-[10px] text-[var(--text-muted)] italic">
                  Questão dissertativa — avaliação manual pelo professor.
                </p>
              )}

              {/* Nota e Feedback por questão */}
              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Nota da Questão:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={q.points}
                      value={questionScores[q.id] !== undefined ? (isNaN(questionScores[q.id]) ? '' : questionScores[q.id]) : ''}
                      onChange={(e) => handleQuestionScoreChange(q.id, e.target.value, q.points)}
                      className={`w-16 border rounded-lg py-1 px-2 text-xs font-bold text-center focus:outline-none focus:border-orange-500/50 ${
                        isDarkMode ? 'bg-black/20 border-white/5 text-orange-500' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                      }`}
                    />
                    <span className="text-xs font-bold text-[var(--text-muted)]">/ {q.points.toFixed(1)} pts</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block">
                    Observações / Feedback da Questão
                  </label>
                  <textarea
                    value={questionFeedback[q.id] || ''}
                    onChange={(e) => setQuestionFeedback(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Escreva observações específicas para esta questão..."
                    className={`w-full h-16 border rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-xs font-medium resize-none ${
                      isDarkMode ? 'bg-black/20 border-white/5 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ========== FEEDBACK DO PROFESSOR ========== */}
      <div className={`border rounded-3xl p-6 md:p-8 mt-8 transition-all duration-300 ${
        isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
      }`}>
        <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-4 block">
          Feedback Geral / Comentários
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={`Deixe um comentário sobre o desempenho na ${isExam ? 'prova' : 'atividade'}...`}
          className={`w-full border rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-medium min-h-[120px] resize-none ${
            isDarkMode ? 'glass border-white/5 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
          }`}
        />
      </div>

      {/* ========== RODAPÉ DE AÇÕES ========== */}
      <div className="flex justify-end pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="sidebar-grad text-white px-10 py-4 rounded-2xl font-extrabold shadow-xl shadow-orange-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Salvando...' : 'Salvar Correção e Nota'}
          <Save size={18} />
        </motion.button>
      </div>
    </div>
  );
}
