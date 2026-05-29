import { motion } from 'motion/react';
import { 
  Play, 
  BarChart3, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  GraduationCap 
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (mode: 'login' | 'register') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // ==========================================
  // ANIMAÇÕES
  // ==========================================
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white overflow-x-hidden selection:bg-orange-500/30">
      
      {/* Fundo Escuro com Orbs Laranjas (Estilo do Sistema) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--bg-body)]">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* ==========================================
            HEADER
            ========================================== */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Aprende+" className="h-10 w-auto filter drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]" />
              <div className="flex flex-col">
                <span className="text-lg font-black font-display tracking-tight text-white leading-none">Aprende+</span>
                <span className="text-[9px] font-bold text-orange-500 tracking-widest uppercase">LMS Inteligente</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Início</a>
              <a href="#metodologia" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Metodologia</a>
              <a href="#planos" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Planos</a>
            </nav>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('login')}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold uppercase tracking-widest px-6 py-2.5 rounded-full shadow-lg shadow-orange-600/20 transition-all"
            >
              Login
            </motion.button>
          </div>
        </header>

        {/* ==========================================
            HERO SECTION
            ========================================== */}
        <section id="inicio" className="pt-40 pb-20 px-6 min-h-[90vh] flex items-center">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.p variants={fadeUp} className="text-orange-500 font-extrabold tracking-[0.2em] text-[10px] uppercase mb-6">
                Plataforma LMS SaaS Inteligente
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-display font-extrabold leading-[1.1] mb-6 tracking-tight">
                Gestão acadêmica e aprendizado inteligente em um só lugar.
              </motion.h1>
              <motion.p variants={fadeUp} className="text-zinc-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
                Conecte alunos, professores e coordenação. Crie aulas, gerencie atividades e acompanhe o progresso em tempo real.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => onNavigate('register')}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-8 py-4 rounded-full shadow-lg shadow-orange-600/20 transition-all"
                >
                  EXPLORAR
                </button>
                <button 
                  onClick={() => onNavigate('login')}
                  className="glass border border-white/10 hover:bg-white/5 text-white font-extrabold px-8 py-4 rounded-full transition-all"
                >
                  COMEÇAR
                </button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:flex justify-center items-center w-full"
            >
              {/* ==========================================
                  EFEITO GLOW DE FUNDO
                  ========================================== */}
              <div className="absolute w-72 h-72 rounded-full bg-orange-500/10 blur-[60px] animate-pulse-slow pointer-events-none" />

              {/* ==========================================
                  PAINEL PRINCIPAL DO MOCKUP
                  ========================================== */}
              <div className="relative w-full max-w-md glass border border-white/10 rounded-[32px] bg-zinc-900/40 p-6 flex flex-col gap-5 shadow-2xl backdrop-blur-xl">
                
                {/* ==========================================
                    HEADER SIMULADO
                    ========================================== */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="text-[10px] font-bold text-zinc-500 ml-2 tracking-widest uppercase">dashboard.aprende.plus</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-orange-500">P</span>
                  </div>
                </div>

                {/* ==========================================
                    METRICAS DE KPI (MEDIA & DISCIPLINAS)
                    ========================================== */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass border border-white/5 rounded-2xl p-3 bg-zinc-950/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Média Global</span>
                      <TrendingUp size={10} className="text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-white">8.8</span>
                      <span className="text-[8px] text-emerald-500 font-bold">+5%</span>
                    </div>
                  </div>
                  <div className="glass border border-white/5 rounded-2xl p-3 bg-zinc-950/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Disciplinas</span>
                      <BookOpen size={10} className="text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-white">12</span>
                      <span className="text-[8px] text-zinc-500 font-medium">Cadastradas</span>
                    </div>
                  </div>
                </div>

                {/* ==========================================
                    TAXA DE CONCLUSAO (PROGRESSO CIRCULAR)
                    ========================================== */}
                <div className="glass border border-white/5 rounded-2xl p-4 bg-zinc-950/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest block">Progresso Geral</span>
                    <span className="text-sm font-extrabold text-white block">Taxa de Conclusão</span>
                    <span className="text-[10px] text-zinc-500 block">Atividades concluídas no prazo</span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center relative shrink-0">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4.5" fill="none" className="text-zinc-800" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="26" 
                        stroke="currentColor" 
                        strokeWidth="4.5" 
                        fill="none" 
                        className="text-orange-500" 
                        strokeDasharray="163.36" 
                        strokeDashoffset="26.13" 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <span className="text-xs font-black text-orange-500">84%</span>
                  </div>
                </div>

                {/* ==========================================
                    TAREFA RECENTE SIMULADA
                    ========================================== */}
                <div className="glass border border-white/5 rounded-2xl p-3 bg-zinc-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/10 flex items-center justify-center text-orange-500">
                      <HelpCircle size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-white block">Prova de Física Geral</span>
                      <span className="text-[8px] text-zinc-500 font-medium block">Física I • Prova Cronometrada</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/10 px-2 py-0.5 rounded-full text-orange-500">
                    <Clock size={8} />
                    <span className="text-[8px] font-extrabold tracking-wider uppercase">45 min</span>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  BADGE FLUTUANTE: GEMINI IA
                  ========================================== */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 glass border border-orange-500/20 bg-zinc-900/80 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Sparkles size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">IA Gemini Ativa</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Questões Automáticas</span>
                </div>
              </motion.div>

              {/* ==========================================
                  BADGE FLUTUANTE: MODO PROFESSOR
                  ========================================== */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, delay: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-6 glass border border-white/10 bg-zinc-900/80 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <GraduationCap size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">Painel do Docente</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Fácil e Intuitivo</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==========================================
            METODOLOGIA (BENTO GRID)
            ========================================== */}
        <section id="metodologia" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
                Metodologia Imersiva
              </h2>
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                O Futuro do Ensino é Agora
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              {/* Card 1: Aulas ao vivo (Largo) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 glass border border-white/5 rounded-[32px] p-10 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors flex flex-col justify-between group"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <Play size={28} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold mb-3">Aulas ao vivo</h3>
                  <p className="text-zinc-400 leading-relaxed max-w-md">
                    Interação em tempo real com especialistas e mentores globais. Sinta a energia de uma sala de aula física de onde estiver.
                  </p>
                </div>
              </motion.div>

              {/* Card 2: Insights (Alto) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:row-span-2 glass border border-white/5 rounded-[32px] p-10 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors flex flex-col relative overflow-hidden group"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                  <BarChart3 size={28} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-display font-bold mb-3">Insights</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Análise de dados avançada para identificar seus pontos fortes e áreas de melhoria. Evolução constante e guiada.
                  </p>
                </div>
                {/* Gráfico decorativo no fundo */}
                <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-between px-6 opacity-40 group-hover:opacity-60 transition-opacity">
                  <div className="w-1/4 bg-orange-600/40 h-1/3 rounded-t-lg" />
                  <div className="w-1/4 bg-orange-500/60 h-2/3 rounded-t-lg" />
                  <div className="w-1/4 bg-orange-700/40 h-1/2 rounded-t-lg" />
                  <div className="w-1/4 bg-orange-500 h-full rounded-t-lg" />
                </div>
              </motion.div>

              {/* Card 3: Atividades e Provas (Largo) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2 glass border border-white/5 rounded-[32px] p-10 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group"
              >
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                    <HelpCircle size={28} />
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-3">Atividades e Provas</h3>
                  <p className="text-zinc-400 leading-relaxed max-w-md">
                    Desafios gamificados que testam sua capacidade analítica e técnica em cenários de alta pressão.
                  </p>
                </div>
                {/* Círculo de progresso decorativo */}
                <div className="w-32 h-32 rounded-full flex items-center justify-center relative shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                    {/* Fundo do círculo */}
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-800" />
                    {/* Progresso do círculo */}
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="56" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="none" 
                      className="text-orange-500" 
                      strokeDasharray="351.85" 
                      strokeDashoffset="87.96" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="text-2xl font-display font-bold text-orange-500">75%</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==========================================
            PLANOS DE ACESSO
            ========================================== */}
        <section id="planos" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
                Planos de Acesso
              </h2>
              <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
              
              {/* Plano Normal */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass border border-white/5 rounded-[32px] p-8 bg-zinc-900/30"
              >
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-4">Iniciante</p>
                <h3 className="text-3xl font-display font-bold mb-2">Normal</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-display font-extrabold">R$00</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                </ul>
                <button onClick={() => onNavigate('register')} className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest glass border border-white/10 hover:bg-white/5 transition-colors">
                  Assinar Agora
                </button>
              </motion.div>

              {/* Plano Premium (Destaque) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass border-2 border-orange-500 rounded-[32px] p-10 bg-zinc-900/60 relative transform md:-translate-y-4 shadow-2xl shadow-orange-500/10"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest py-1.5 px-4 rounded-full">
                  Mais Popular
                </div>
                <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mb-4">Intermediário</p>
                <h3 className="text-4xl font-display font-bold mb-2">Premium</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-display font-extrabold">R$00</span>
                  <span className="text-zinc-400 text-sm">/mês</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                </ul>
                <button onClick={() => onNavigate('register')} className="w-full py-4 rounded-2xl font-extrabold text-sm uppercase tracking-widest bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all">
                  Assinar Agora
                </button>
              </motion.div>

              {/* Plano Pro */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass border border-white/5 rounded-[32px] p-8 bg-zinc-900/30"
              >
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-4">Corporativo</p>
                <h3 className="text-3xl font-display font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-display font-extrabold">R$00</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                  <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> BENEFÍCIO</li>
                </ul>
                <button onClick={() => onNavigate('register')} className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest glass border border-white/10 hover:bg-white/5 transition-colors">
                  Assinar Agora
                </button>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ==========================================
            FOOTER
            ========================================== */}
        <footer className="border-t border-white/5 py-12 px-6 mt-12 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <img src="/logo.png" alt="Aprende+" className="h-6 w-auto opacity-50 hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Suporte</a>
            </div>

            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-600">
              &copy; 2026 Aprende+. O Arquivo do Aprendizado Imersivo.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
