import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CheckCircle2, AlertCircle, Eye, Check, Clock, Users, BarChart2, X, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminService } from '../lib/adminService';
import { Activity, AuthUser } from '../types';

interface SubmissionsProps {
  activity: Activity;
  isExam?: boolean;
  currentUser: AuthUser;
  onBack: () => void;
  onGradeSubmission: (submissionId: string) => void;
  isDarkMode: boolean;
}

type FilterStatus = 'all' | 'submitted' | 'late' | 'graded' | 'absent';

interface CombinedRow {
  type: 'submission' | 'absent';
  id: string;
  name: string;
  email: string;
  status: string;
  final_score: number | null;
  auto_score: number | null;
  created_at: string | null;
  submission?: any;
}

export default function Submissions({ activity, isExam, currentUser, onBack, onGradeSubmission, isDarkMode }: SubmissionsProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const table = isExam ? 'exam_submissions' : 'activity_submissions';
    const idField = isExam ? 'exam_id' : 'activity_id';

    // Busca submissões
    const { data: subs } = await supabase
      .from(table)
      .select('*, users(name, email)')
      .eq(idField, activity.id);

    if (subs) setSubmissions(subs);

    // Buscar subject_id e alunos matriculados
    const tableName = isExam ? 'exams' : 'activities';
    const { data: examData } = await supabase
      .from(tableName)
      .select('subject_id')
      .eq('id', activity.id)
      .single();

    if (examData?.subject_id) {
      const { data: enrollData } = await supabase
        .from('subject_enrollments')
        .select('student_id, users(id, name, email)')
        .eq('subject_id', examData.subject_id);

      if (enrollData) {
        const students = enrollData
          .map((e: any) => (Array.isArray(e.users) ? e.users[0] : e.users))
          .filter(Boolean);
        setAllStudents(students);
      }
    }

    setLoading(false);
  }, [activity.id, isExam]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handlePublishSelected = async () => {
    if (selectedIds.size === 0) return;
    setPublishing(true);
    await adminService.publishGradesByIds(Array.from(selectedIds), isExam ? 'exam' : 'activity');
    setSelectedIds(new Set());
    await fetchSubmissions();
    setPublishing(false);
    showToast(`${selectedIds.size} nota${selectedIds.size !== 1 ? 's' : ''} publicada${selectedIds.size !== 1 ? 's' : ''} com sucesso!`);
  };


  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableRows.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Cruzamento: todos os alunos vs submissões
  const buildCombinedRows = (): CombinedRow[] => {
    const submittedIds = new Set(submissions.map((s: any) => s.student_id));

    const submissionRows: CombinedRow[] = submissions.map((sub) => ({
      type: 'submission',
      id: sub.id,
      name: Array.isArray(sub.users) ? sub.users[0]?.name : sub.users?.name || 'Aluno Desconhecido',
      email: Array.isArray(sub.users) ? sub.users[0]?.email : sub.users?.email || '',
      status: sub.status,
      final_score: sub.final_score,
      auto_score: sub.auto_score,
      created_at: sub.created_at,
      submission: sub,
    }));

    const absentRows: CombinedRow[] = allStudents
      .filter((s: any) => !submittedIds.has(s.id))
      .map((s: any) => ({
        type: 'absent',
        id: `absent-${s.id}`,
        name: s.name || 'Aluno',
        email: s.email || '',
        status: 'absent',
        final_score: null,
        auto_score: null,
        created_at: null,
      }));

    return [...submissionRows, ...absentRows];
  };

  const allRows = buildCombinedRows();

  // Submissões elegíveis para seleção: tem nota final e ainda não foi publicada
  const selectableRows = allRows.filter((r) => r.final_score !== null && r.status !== 'graded' && r.type === 'submission');
  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedIds.has(r.id));

  const filteredRows = allRows.filter((row) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'absent') return row.status === 'absent';
    if (filterStatus === 'graded') return row.status === 'graded' || row.final_score !== null;
    if (filterStatus === 'submitted') return row.status === 'submitted' && row.final_score === null;
    if (filterStatus === 'late') return row.status === 'late' && row.final_score === null;
    return row.status === filterStatus;
  });

  // Estatísticas de resumo
  const totalStudents = allStudents.length || submissions.length;
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === 'graded' || s.final_score !== null).length;
  const pendingCount = submissions.filter((s) => s.status !== 'graded' && s.final_score === null).length;
  const scoredSubmissions = submissions.filter((s) => s.final_score != null || s.auto_score != null);
  const avgScore =
    scoredSubmissions.length > 0
      ? scoredSubmissions.reduce((acc, s) => acc + Number(s.final_score ?? s.auto_score ?? 0), 0) /
        scoredSubmissions.length
      : null;

  const filters: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'Todos', value: 'all', count: allRows.length },
    { label: 'Entregues', value: 'submitted', count: allRows.filter((r) => r.status === 'submitted' && r.final_score === null).length },
    { label: 'Atrasados', value: 'late', count: allRows.filter((r) => r.status === 'late' && r.final_score === null).length },
    { label: 'Corrigidos', value: 'graded', count: allRows.filter((r) => r.status === 'graded' || r.final_score !== null).length },
    { label: 'Ausentes', value: 'absent', count: allRows.filter((r) => r.status === 'absent').length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-8">

      {/* ========== TOAST ========== */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-50 border px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'glass border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-800'
            }`}
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <p className="text-sm font-bold">{toastMsg}</p>
            <button onClick={() => setToastMsg(null)} className="ml-2 hover:opacity-80 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== CABEÇALHO ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-[var(--border)]"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={`p-3 border rounded-2xl hover:text-orange-500 transition-all shadow-md cursor-pointer ${
              isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-[var(--text-main)]">Portal de Correção</h1>
            <p className="text-[var(--text-muted)] font-medium text-sm mt-1">{activity.title}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePublishSelected}
          disabled={publishing || selectedIds.size === 0}
          className="sidebar-grad text-white px-8 py-4 rounded-2xl font-extrabold shadow-xl shadow-orange-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {publishing ? 'Publicando...' : `Publicar ${selectedIds.size} Nota${selectedIds.size !== 1 ? 's' : ''} (Lote)`}
          <Check size={18} />
        </motion.button>
      </motion.div>

      {/* ========== RESUMO DA TURMA ========== */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className={`border rounded-2xl p-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-250/20'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users size={14} className="text-[var(--text-muted)]" />
              <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Total de Alunos</p>
            </div>
            <p className="text-2xl font-extrabold font-display text-[var(--text-main)]">{totalStudents}</p>
          </div>
          <div className={`border rounded-2xl p-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-250/20'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Entregaram</p>
            </div>
            <p className="text-2xl font-extrabold font-display text-emerald-500">
              {submittedCount}
              <span className="text-sm text-[var(--text-muted)] font-medium">/{totalStudents}</span>
            </p>
          </div>
          <div className={`border rounded-2xl p-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-250/20'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart2 size={14} className="text-orange-500" />
              <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Média da Turma</p>
            </div>
            <p className="text-2xl font-extrabold font-display text-orange-500">
              {avgScore != null ? avgScore.toFixed(1) : '—'}
            </p>
          </div>
          <div className={`border rounded-2xl p-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-250/20'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={14} className="text-yellow-500" />
              <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Pendentes</p>
            </div>
            <p className="text-2xl font-extrabold font-display text-yellow-500">{pendingCount}</p>
          </div>
        </motion.div>
      )}

      {/* ========== FILTROS ========== */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === f.value
                  ? 'sidebar-grad text-white border-transparent shadow-md shadow-orange-600/20'
                  : (isDarkMode 
                      ? 'glass border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/30 hover:text-orange-500' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-orange-500/35 hover:text-orange-600 shadow-sm')
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold transition-colors duration-300 ${
                filterStatus === f.value 
                  ? 'bg-white/20' 
                  : (isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-650')
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ========== TABELA ========== */}
      <div className={`border rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/85'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b transition-colors duration-300 ${
                isDarkMode ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-slate-50'
              }`}>
                {/* ===== CHECKBOX SELECIONAR TODAS ===== */}
                <th className="pl-6 pr-2 py-6 w-12">
                  {selectableRows.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className={`p-1 rounded-lg transition-all cursor-pointer ${
                        allSelectableSelected
                          ? 'text-orange-500'
                          : 'text-[var(--text-muted)] hover:text-orange-500'
                      }`}
                      title={allSelectableSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                    >
                      {allSelectableSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  )}
                </th>
                <th className="px-6 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Aluno</th>
                <th className="px-6 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest text-center">Nota (Auto/Total)</th>
                <th className="px-6 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest text-center">Data Entrega</th>
                <th className="px-6 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-[var(--text-muted)]">
                    Carregando entregas...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-[var(--text-muted)]">
                    Nenhum resultado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSelectable = row.final_score !== null && row.status !== 'graded' && row.type === 'submission';
                  const isSelected = selectedIds.has(row.id);
                  return (
                  <tr
                    key={row.id}
                    className={`transition-colors group ${row.status === 'absent' ? 'opacity-70' : ''} ${
                      isSelected ? (isDarkMode ? 'bg-orange-500/5' : 'bg-orange-50/60') : ''
                    } ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {/* ===== CHECKBOX DE SELEÇÃO ===== */}
                    <td className="pl-6 pr-2 py-6 w-12">
                      {isSelectable ? (
                        <button
                          onClick={() => toggleSelect(row.id)}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? 'text-orange-500'
                              : 'text-[var(--text-muted)] hover:text-orange-500'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      ) : (
                        <span className="block w-[18px]" />
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          row.status === 'absent' ? 'bg-zinc-500/10 text-zinc-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {row.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors">{row.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {row.status === 'graded' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Corrigido & Publicado
                        </span>
                      ) : row.final_score !== null ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-blue-500/20">
                          <CheckCircle2 size={12} /> Corrigido (Rascunho)
                        </span>
                      ) : row.status === 'late' ? (
                        <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-red-500/20">
                          <AlertCircle size={12} /> Atrasado
                        </span>
                      ) : row.status === 'absent' ? (
                        <span className="inline-flex items-center gap-1.5 bg-zinc-500/10 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-zinc-500/20">
                          <X size={12} /> Não Entregou
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-orange-500/20">
                          <Clock size={12} /> Entregue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center">
                      {row.status === 'absent' ? (
                        <span className="text-[var(--text-muted)] font-bold">—</span>
                      ) : (
                        <span className="text-xl font-extrabold font-display text-[var(--text-main)]">
                          {row.final_score != null
                            ? Number(row.final_score).toFixed(1)
                            : row.auto_score != null
                            ? Number(row.auto_score).toFixed(1)
                            : '-'}{' '}
                          <span className="text-sm text-[var(--text-muted)]">/ {activity.totalPoints || 10}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center text-sm font-medium text-[var(--text-muted)]">
                      {row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-6 text-right">
                      {row.type === 'submission' ? (
                        <button
                          onClick={() => onGradeSubmission(row.submission.id)}
                          className={`p-3 border rounded-xl hover:text-orange-500 hover:border-orange-500/30 transition-all inline-flex items-center gap-2 cursor-pointer ${
                            isDarkMode ? 'glass border-white/5 text-[var(--text-muted)]' : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:shadow-md'
                          }`}
                        >
                          <Eye size={16} /> Corrigir
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ausente</span>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
