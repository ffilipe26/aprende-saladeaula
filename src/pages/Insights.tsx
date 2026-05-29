import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Users, 
  AlertCircle, 
  Lightbulb, 
  Sparkles,
  CheckCircle,
  BarChart2,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import Header from '../components/layout/Header';
import { UserRole, Activity, Subject, SchoolMember, Notification } from '../types';

interface InsightsProps {
  userRole: UserRole;
  activities: Activity[];
  subjects: Subject[];
  schoolMembers: SchoolMember[];
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  selectedAdminSubjectId?: string | null;
  setSelectedAdminSubjectId?: (id: string | null) => void;
  isDarkMode: boolean;
}

export default function Insights({
  userRole,
  activities,
  subjects,
  schoolMembers,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  selectedAdminSubjectId,
  setSelectedAdminSubjectId,
  isDarkMode
}: InsightsProps) {
  // ==========================================
  // FRAMER MOTION CONFIG
  // ==========================================
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

  const isAdminView = userRole === 'admin' && setSelectedAdminSubjectId !== undefined;

  // ==========================================
  // VIEW: ADMINISTRATOR
  // ==========================================
  const renderAdminInsights = () => {
    const totalStudents = schoolMembers.filter(m => m.role === 'student').length;
    const totalTeachers = schoolMembers.filter(m => m.role === 'teacher').length;
    
    // Alunos em risco fictícios baseados em notas ou entregas pendentes
    const studentsAtRisk = [
      { name: 'Lucas Oliveira', avatarCode: 'L', class: 'Estruturas de Dados', risk: 'Alto', reason: '3 atividades pendentes' },
      { name: 'Gabriel Santos', avatarCode: 'G', class: 'Banco de Dados', risk: 'Médio', reason: 'Média de notas: 5.2' },
    ];

    // Se admin view ativa e sem turma selecionada, mostra grid de turmas
    if (isAdminView && selectedAdminSubjectId === null) {
      return (
        <div className="space-y-8">
          {/* Seletor de Turma Dropdown para Administrador */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-300 ${
              isDarkMode ? 'glass border border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
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
                onChange={(e) => setSelectedAdminSubjectId!(e.target.value === 'all' ? null : e.target.value)}
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

          {/* Grid de Turmas com Insights resumidos */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {subjects.map(sub => {
              const subActivities = activities.filter(a => a.subjectId === sub.id);
              const completedCount = subActivities.filter(a => a.status === 'Concluída').length;
              const totalCount = subActivities.length;
              const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              return (
                <motion.div
                  key={sub.id}
                  variants={itemVariants}
                  onClick={() => setSelectedAdminSubjectId!(sub.id)}
                  className={`border rounded-3xl p-8 transition-all cursor-pointer group flex flex-col justify-between h-56 hover:shadow-2xl hover:shadow-orange-600/5 ${
                    isDarkMode ? 'glass border-[var(--border)] hover:border-orange-500/30' : 'bg-white border-zinc-200 hover:border-orange-500/35 hover:shadow-zinc-200/50 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-extrabold text-orange-500 bg-orange-500/10 px-3 py-1 rounded border border-orange-500/10 tracking-widest uppercase">
                        {sub.code}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${completionPct >= 80 ? 'text-emerald-500 bg-emerald-500/10' : completionPct >= 50 ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {completionPct}% Conclusão
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
                    <span>Insights</span>
                    <span className="text-orange-500 flex items-center gap-2">
                      <span className="text-emerald-500">{completedCount} Feitas</span> • <span className="text-orange-500">{totalCount - completedCount} Pendentes</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      );
    }

    // Filtrar dados caso uma turma esteja selecionada
    const filteredActivities = isAdminView && selectedAdminSubjectId
      ? activities.filter(a => a.subjectId === selectedAdminSubjectId)
      : activities;

    const selectedSubject = selectedAdminSubjectId 
      ? subjects.find(s => s.id === selectedAdminSubjectId) 
      : null;

    const completedFiltered = filteredActivities.filter(a => a.status === 'Concluída').length;
    const totalFiltered = filteredActivities.length;
    const completionRateFiltered = totalFiltered > 0 
      ? Math.round((completedFiltered / totalFiltered) * 100) 
      : 85;

    // Barras de conclusão - filtradas por turma ou globais
    const completionBars = isAdminView && selectedAdminSubjectId
      ? [{ name: selectedSubject?.name || 'Turma', pct: completionRateFiltered, count: filteredActivities.length }]
      : [
        { name: 'Desenvolvimento Web Front-end', pct: 92, count: 28 },
        { name: 'Estruturas de Dados e Algoritmos', pct: 78, count: 22 },
        { name: 'Introdução a Banco de Dados', pct: 88, count: 32 },
        { name: 'Engenharia de Requisitos', pct: 95, count: 18 }
      ];

    return (
      <div className="space-y-8">
        {/* Seletor de Turma Dropdown para Administrador */}
        {isAdminView && setSelectedAdminSubjectId && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-300 ${
              isDarkMode ? 'glass border border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-150/30'
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

        {/* KPIs Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Engajamento Total</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">94.2%</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">+2.4% este semestre</p>
            </div>
          </div>

          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Award size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Média Acadêmica Global</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">8.4 / 10</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">Baseado em 140 provas</p>
            </div>
          </div>

          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Atividades Entregues</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">{isAdminView && selectedAdminSubjectId ? completedFiltered : '1.280'}</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{completionRateFiltered}% de taxa de conclusão</p>
            </div>
          </div>
        </div>

        {/* Distribuição por Turma & Alunos em Risco */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico customizado de conclusão por turma */}
          <div className="glass border border-[var(--border)] rounded-[32px] p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display text-[var(--text-main)]">Taxa de Conclusão por Turma</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Porcentagem de tarefas enviadas pelos alunos.</p>
            </div>

            <div className="space-y-5">
              {completionBars.map((barItem, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[var(--text-main)] truncate max-w-[200px] sm:max-w-none">{barItem.name}</span>
                    <span className="text-orange-500">{barItem.pct}%</span>
                  </div>
                  <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                    <div className="h-full sidebar-grad rounded-full" style={{ width: `${barItem.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alunos em Risco */}
          <div className="glass border border-[var(--border)] rounded-[32px] p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display text-red-500 flex items-center gap-2">
                <AlertCircle size={20} />
                Atenção Acadêmica
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Alunos que necessitam de intervenção ou acompanhamento.</p>
            </div>

            <div className="space-y-4">
              {studentsAtRisk.map((student, idx) => (
                <div key={idx} className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold font-display">
                      {student.avatarCode}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-main)]">{student.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{student.class} • {student.reason}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    student.risk === 'Alto' ? 'bg-red-500/10 text-red-500 border-red-500/10' : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                  }`}>
                    Risco {student.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW: TEACHER
  // ==========================================
  const renderTeacherInsights = () => {
    return (
      <div className="space-y-8">
        {/* Cards Informativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass border border-[var(--border)] rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
              <ThumbsUp size={16} className="text-emerald-500" />
              Tópicos de Maior Engajamento
            </h4>
            <ul className="space-y-3">
              <li className={`flex justify-between items-center text-xs font-bold p-3 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-white/5' : 'bg-slate-50'
              }`}>
                <span className="text-[var(--text-main)]">Introdução ao CSS Grid</span>
                <span className="text-emerald-500">98% Concluído</span>
              </li>
              <li className={`flex justify-between items-center text-xs font-bold p-3 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-white/5' : 'bg-slate-50'
              }`}>
                <span className="text-[var(--text-main)]">Instalação do Node.js e NPM</span>
                <span className="text-emerald-500">94% Concluído</span>
              </li>
            </ul>
          </div>

          <div className="glass border border-[var(--border)] rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
              <ThumbsDown size={16} className="text-red-500" />
              Tópicos de Maior Dificuldade
            </h4>
            <ul className="space-y-3">
              <li className={`flex justify-between items-center text-xs font-bold p-3 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-white/5' : 'bg-slate-50'
              }`}>
                <span className="text-[var(--text-main)]">Recursividade em Funções TS</span>
                <span className="text-red-500">Média: 5.8 / 10</span>
              </li>
              <li className={`flex justify-between items-center text-xs font-bold p-3 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-white/5' : 'bg-slate-50'
              }`}>
                <span className="text-[var(--text-main)]">Manipulação de Ponteiros</span>
                <span className="text-red-500">Média: 6.2 / 10</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sugestões Pedagógicas baseadas em cálculo fictício */}
        <div className="glass border border-orange-500/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden bg-gradient-to-br from-orange-600/5 to-transparent space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 mesh-gradient opacity-[0.08] blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl">
              <Lightbulb size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-[var(--text-main)]">Recomendações da Trilha de Ensino</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Sugestões automáticas para otimizar suas próximas aulas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
            <div className={`p-5 border rounded-2xl space-y-3 transition-colors duration-300 ${
              isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                <Sparkles size={14} />
                Reforço de Conteúdo
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                Mais de 40% dos alunos erraram a questão 4 da prova de "Estruturas de Dados" (relacionada a pilhas). Considere iniciar a próxima aula com uma revisão prática desse tópico.
              </p>
            </div>

            <div className={`p-5 border rounded-2xl space-y-3 transition-colors duration-300 ${
              isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                <Sparkles size={14} />
                Engajamento de Leitura
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                O arquivo PDF "Material de Apoio - TypeScript Avançado" possui uma taxa de leitura abaixo de 30%. Recomenda-se citar ou abrir o material rapidamente na próxima chamada ao vivo.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW: STUDENT
  // ==========================================
  const renderStudentInsights = () => {
    // Calculando estatísticas do próprio aluno
    const doneActivities = activities.filter(a => a.status === 'Concluída');
    const avgScore = doneActivities.length > 0
      ? (doneActivities.reduce((acc, a) => acc + a.totalPoints, 0) / doneActivities.reduce((acc, a) => acc + a.totalPoints, 0)) * 10
      : 8.5;

    return (
      <div className="space-y-8">
        {/* Cards Informativos Aluno */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
              <Award size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Seu Desempenho Médio</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">{avgScore.toFixed(1)} / 10</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Consistente com a meta</p>
            </div>
          </div>

          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Atividades Concluídas</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">{doneActivities.length}</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">De um total de {activities.length}</p>
            </div>
          </div>

          <div className="glass border border-[var(--border)] rounded-3xl p-6 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Horas de Estudo Estimadas</p>
              <h4 className="text-2xl font-black text-[var(--text-main)] mt-1">18 horas</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Foco principal: front-end</p>
            </div>
          </div>
        </div>

        {/* Forças e Pontos a Melhorar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass border border-[var(--border)] rounded-[32px] p-8 space-y-6">
            <h3 className="text-lg font-bold font-display text-emerald-500 flex items-center gap-2">
              <ThumbsUp size={20} />
              Pontos Fortes
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Você tem demonstrado excelente raciocínio em tarefas de <strong>lógica de programação</strong> e <strong>layout responsivo</strong>. Suas entregas nessas matérias mantêm médias superiores a 9.2.
            </p>
          </div>

          <div className="glass border border-[var(--border)] rounded-[32px] p-8 space-y-6">
            <h3 className="text-lg font-bold font-display text-orange-500 flex items-center gap-2">
              <AlertCircle size={20} />
              Pontos de Foco
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Você teve maior tempo de resposta e menor pontuação média em conceitos de <strong>banco de dados relacional</strong>. Recomendamos rever as videoaulas de chaves primárias e relacionamentos.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      {/* Header */}
      <Header 
        title="Insights de Desempenho" 
        subtitle="Analise métricas de aproveitamento e trilhas personalizadas de ensino." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Título Principal */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-display flex items-center gap-4">
          Insights Analíticos
          <span className="bg-orange-500/10 text-orange-500 text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest border border-orange-500/10">
            {userRole === 'admin' ? 'Escola' : userRole === 'teacher' ? 'Professor' : 'Aluno'}
          </span>
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-medium text-base">Acompanhe estatísticas, engajamento e direções de foco.</p>
      </motion.div>

      {/* Conteúdo Dinâmico por Role */}
      <motion.div variants={itemVariants}>
        {userRole === 'admin' && renderAdminInsights()}
        {userRole === 'teacher' && renderTeacherInsights()}
        {userRole === 'student' && renderStudentInsights()}
      </motion.div>
    </motion.div>
  );
}
