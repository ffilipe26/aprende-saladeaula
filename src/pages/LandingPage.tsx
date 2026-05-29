import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  BarChart3, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Brain,
  Users,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

// ==========================================
// COMPONENTE DE PARTÍCULAS INTERATIVAS (GLOBO 3D GIGANTE DE PONTOS AO REDOR DO MOUSE)
// DESATIVADO EM TELAS MOBILE (<768PX) PARA ECONOMIZAR PROCESSAMENTO
// ==========================================
// ==========================================
// COMPONENTE DE AURORAS LÍQUIDAS (GLOWING ORBS EM GRADIENTE FLUIDO)
// DESATIVADO EM TELAS MOBILE (<768PX) PARA ECONOMIZAR PROCESSAMENTO
// ==========================================
function LiquidAuroras({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isDarkMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCheckMobile = () => window.innerWidth < 768;
    if (handleCheckMobile()) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Estado do mouse para rastrear a força repulsiva do vento
    const mouse = {
      x: null as number | null,
      y: null as number | null,
    };

    interface Orb {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      driftRadius: number;
      timeOffset: number;
    }

    // 3 Orbs gigantes com tons quentes de laranja e cobre
    const orbs: Orb[] = [
      {
        x: width * 0.25,
        y: height * 0.3,
        baseX: width * 0.25,
        baseY: height * 0.3,
        radius: Math.min(width, height) * 0.44,
        color: 'rgba(249, 115, 22, 0.16)', // Laranja Tech
        speedX: 0.0016,
        speedY: 0.0011,
        driftRadius: Math.min(width, height) * 0.18,
        timeOffset: Math.random() * 100,
      },
      {
        x: width * 0.75,
        y: height * 0.45,
        baseX: width * 0.75,
        baseY: height * 0.45,
        radius: Math.min(width, height) * 0.48,
        color: 'rgba(217, 119, 6, 0.13)', // Âmbar Quente
        speedX: 0.0011,
        speedY: 0.0018,
        driftRadius: Math.min(width, height) * 0.22,
        timeOffset: Math.random() * 100,
      },
      {
        x: width * 0.5,
        y: height * 0.7,
        baseX: width * 0.5,
        baseY: height * 0.7,
        radius: Math.min(width, height) * 0.46,
        color: 'rgba(255, 69, 0, 0.14)', // Laranja Avermelhado
        speedX: 0.002,
        speedY: 0.0014,
        driftRadius: Math.min(width, height) * 0.2,
        timeOffset: Math.random() * 100,
      },
    ];

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];

        // 1. Calcula a posição alvo com base no movimento senoidal lento (estilo lava-lamp)
        let targetX = orb.baseX + Math.sin(time * orb.speedX + orb.timeOffset) * orb.driftRadius;
        let targetY = orb.baseY + Math.cos(time * orb.speedY + orb.timeOffset) * orb.driftRadius;

        // 2. Aplica força de repulsão suave (vento) se o mouse estiver na tela
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - targetX;
          const dy = mouse.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 480; // Alcance do vento repulsivo

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const factor = dist === 0 ? 1 : dist;
            // Empurra a mancha de luz para longe do cursor
            targetX -= (dx / factor) * force * 150; 
            targetY -= (dy / factor) * force * 150;
          }
        }

        // 3. Interpolação super viscosa para as manchas de luz fluírem de forma orgânica
        orb.x += (targetX - orb.x) * 0.022;
        orb.y += (targetY - orb.y) * 0.022;

        // 4. Desenha o gradiente radial
        const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      if (handleCheckMobile()) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Recalcula as proporções do palco
      orbs[0].baseX = width * 0.25;
      orbs[0].baseY = height * 0.3;
      orbs[0].radius = Math.min(width, height) * 0.44;
      orbs[0].driftRadius = Math.min(width, height) * 0.18;

      orbs[1].baseX = width * 0.75;
      orbs[1].baseY = height * 0.45;
      orbs[1].radius = Math.min(width, height) * 0.48;
      orbs[1].driftRadius = Math.min(width, height) * 0.22;

      orbs[2].baseX = width * 0.5;
      orbs[2].baseY = height * 0.7;
      orbs[2].radius = Math.min(width, height) * 0.46;
      orbs[2].driftRadius = Math.min(width, height) * 0.20;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  if (!isDarkMode) return null;

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none filter blur-[130px] opacity-95" />;
}

interface LandingPageProps {
  onNavigate: (mode: 'login' | 'register') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function LandingPage({ onNavigate, isDarkMode, onToggleTheme }: LandingPageProps) {
  // Estado para o acordeão do FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
      transition: { staggerChildren: 0.15 }
    }
  };

  // ==========================================
  // DADOS DO FAQ
  // ==========================================
  const faqData = [
    {
      question: "Como funciona a geração de insights por IA?",
      answer: "A inteligência artificial do Aprende+ analisa anonimamente as respostas de atividades e provas, o tempo de engajamento do aluno e suas taxas de conclusão. A partir disso, gera insights automáticos sobre os pontos fortes e temas de melhoria de cada aluno, ajudando professores a direcionar seus feedbacks."
    },
    {
      question: "A plataforma possui suporte a provas com tempo limite?",
      answer: "Sim! O Aprende+ possui suporte completo a avaliações cronometradas com salvamento de rascunhos em tempo real e entrega automática quando o tempo se esgota, garantindo a segurança e confiabilidade das avaliações acadêmicas."
    },
    {
      question: "O que mudou em relação às aulas ao vivo?",
      answer: "Decidimos focar na flexibilidade total de ensino. O Aprende+ agora prioriza trilhas de aprendizado assíncronas com aulas gravadas, arquivos de apoio e materiais estruturados para que o aluno possa evoluir no seu próprio ritmo."
    },
    {
      question: "Posso testar a plataforma gratuitamente?",
      answer: "Sim, o plano Normal (Iniciante) é totalmente gratuito e permite gerenciar 1 turma com até 15 alunos. É perfeito para professores que desejam experimentar os recursos essenciais do sistema."
    }
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden selection:bg-orange-500/30 font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50/50 text-zinc-900'
    }`}>
      
      {/* Fundo Escuro com Orbs Laranjas Tech */}
      <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#050505]' : 'bg-slate-50'
      }`}>
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-orange-600/10 to-red-600/5' 
            : 'bg-gradient-to-br from-orange-500/[0.03] to-amber-500/[0.02]'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-tr from-orange-500/5 to-amber-500/5' 
            : 'bg-gradient-to-tr from-orange-400/[0.02] to-amber-500/[0.015]'
        }`} />
      </div>

      {/* Fundo Fluido de Auroras Líquidas */}
      <LiquidAuroras isDarkMode={isDarkMode} />

      <div className="relative z-10">
        {/* ==========================================
            HEADER (REFORMULADO - SEM REDOMA)
            ========================================== */}
        <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
          isDarkMode 
            ? 'border-white/[0.04] bg-zinc-950/40 backdrop-blur-xl' 
            : 'border-zinc-200/60 bg-white/85 backdrop-blur-xl shadow-sm'
        }`}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Aprende+" 
                className={`h-8 w-auto object-contain transition-all duration-300 ${
                  isDarkMode 
                    ? 'filter brightness-110 drop-shadow-[0_0_12px_rgba(249,115,22,0.15)]' 
                    : 'filter brightness-100'
                }`}
              />
              <div className="flex flex-col">
                <span className={`text-base font-black font-display tracking-tight leading-none transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-zinc-900'
                }`}>Aprende+</span>
                <span className="text-[8px] font-bold text-orange-500 tracking-[0.2em] uppercase mt-0.5">LMS Inteligente</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors relative group py-2 ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>
                Início
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#metodologia" className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors relative group py-2 ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>
                Metodologia
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#planos" className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors relative group py-2 ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>
                Planos
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#faq" className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors relative group py-2 ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-300 group-hover:w-full" />
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-zinc-400 hover:text-white hover:bg-white/5' 
                    : 'text-zinc-650 hover:text-zinc-900 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50'
                }`}
                title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className={`text-xs font-bold transition-colors px-4 py-2 ${
                  isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-650 hover:text-zinc-900'
                }`}
              >
                Entrar
              </button>
              <motion.button 
                whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(249,115,22,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('register')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-extrabold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                Cadastrar-se
              </motion.button>
            </div>
          </div>
        </header>

        {/* ==========================================
            HERO SECTION
            ========================================== */}
        <section id="inicio" className="pt-32 pb-20 px-6 min-h-[90vh] flex items-center">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div 
                variants={fadeUp} 
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-extrabold tracking-widest text-[9px] uppercase mb-8 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-orange-500/10 bg-orange-500/5 text-orange-400' 
                    : 'border-orange-200 bg-orange-50 text-orange-700 shadow-sm'
                }`}
              >
                <Sparkles size={10} />
                <span>Plataforma LMS SaaS Acadêmica</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeUp} 
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.1] mb-6 tracking-tight"
              >
                Gestão acadêmica e{' '}
                <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'from-orange-400 via-orange-500 to-red-500' 
                    : 'from-orange-600 via-orange-500 to-red-600'
                }`}>
                  aprendizado inteligente
                </span>{' '}
                em um só lugar.
              </motion.h1>
              
              <motion.p 
                variants={fadeUp} 
                className={`text-base sm:text-lg leading-relaxed mb-10 max-w-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
                }`}
              >
                Conecte alunos, professores e coordenação com relatórios em tempo real e insights avançados. Simplifique sua rotina pedagógica.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => onNavigate('register')}
                  className={`font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all ${
                    isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/15'
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20'
                  }`}
                >
                  Criar Conta Grátis
                </button>
                <button 
                  onClick={() => onNavigate('login')}
                  className={`font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all ${
                    isDarkMode
                      ? 'glass border border-white/10 hover:bg-white/5 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-md border border-zinc-950'
                  }`}
                >
                  Entrar no Painel
                </button>
              </motion.div>
            </motion.div>

            {/* MOCKUP INTERATIVO E PROFISSIONAL (GRÁFICO RADIAL E INSIGHTS IA GEMINI) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative flex justify-center items-center w-full min-h-[380px]"
            >
              {/* Glow decorativo de fundo */}
              <div className={`absolute w-[350px] h-[350px] rounded-full blur-[80px] pointer-events-none animate-pulse-slow transition-colors duration-300 ${
                isDarkMode ? 'bg-orange-600/10' : 'bg-orange-500/5'
              }`} />

              {/* Card principal do Mockup (Frente) */}
              <div className={`relative w-full max-w-md rounded-[28px] p-6 flex flex-col gap-6 shadow-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'glass border border-white/10 bg-zinc-900/35 backdrop-blur-2xl' 
                  : 'bg-white border border-zinc-200/80 shadow-xl shadow-zinc-200/50'
              }`}>
                
                {/* Header Simulado (Simulando uma Janela de App Real) */}
                <div className={`flex items-center justify-between pb-3.5 border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-white/5' : 'border-zinc-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    <span className="text-[9px] font-bold text-zinc-500 ml-2 tracking-widest uppercase">dashboard.aprende.plus</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">LIVE</span>
                  </div>
                </div>

                {/* Perfil do Aluno */}
                <div className={`flex items-center justify-between rounded-2xl p-3 border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-white/5' 
                    : 'bg-slate-50/60 border-zinc-200/40'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 border ${
                      isDarkMode 
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                        : 'bg-orange-50 border-orange-200 text-orange-600'
                    }`}>
                      AB
                    </div>
                    <div>
                      <h4 className={`text-xs font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Ana Beatriz</h4>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Estudante • Turma A</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase transition-all duration-300 ${
                    isDarkMode ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-100/60 text-orange-650'
                  }`}>Ativa</span>
                </div>

                {/* Área Central: Gráfico Radial de Desempenho e Métricas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                    isDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50/40 border-zinc-200/40'
                  }`}>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Desempenho Geral</span>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" fill="none" className={isDarkMode ? 'text-zinc-800' : 'text-zinc-100'} />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="26" 
                          stroke="currentColor" 
                          strokeWidth="4" 
                          fill="none" 
                          className="text-orange-500" 
                          strokeDasharray="163.36" 
                          strokeDashoffset="19.6" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black transition-colors duration-300 leading-none ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>88%</span>
                        <span className="text-[7px] text-zinc-500 font-bold uppercase mt-0.5">Média</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <div className={`border rounded-2xl p-3.5 flex flex-col justify-between flex-1 transition-all duration-300 ${
                      isDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50/40 border-zinc-200/40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Entregas</span>
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                      <div className="mt-2">
                        <span className={`text-lg font-black block transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>14 / 15</span>
                        <span className={`text-[8px] font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>93.3% Concluído</span>
                      </div>
                    </div>

                    <div className={`border rounded-2xl p-3.5 flex flex-col justify-between flex-1 transition-all duration-300 ${
                      isDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50/40 border-zinc-200/40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Tempo Ativo</span>
                        <Clock size={12} className="text-orange-500" />
                      </div>
                      <div className="mt-2">
                        <span className={`text-lg font-black block transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>12.5h</span>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Esta semana</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status da Atividade Atual */}
                <div className={`border rounded-2xl p-3 flex items-center justify-between transition-all duration-300 ${
                  isDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50/40 border-zinc-200/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isDarkMode ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-655'
                    }`}>
                      <GraduationCap size={14} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black block transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Prova de Física Geral</span>
                      <span className="text-[8px] text-zinc-500 font-medium block">Física I • Cronometrada</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase transition-all duration-300 ${
                    isDarkMode ? 'text-orange-500 bg-orange-500/10' : 'text-orange-650 bg-orange-50'
                  }`}>Pendente</span>
                </div>
              </div>

              {/* CARD FLUTUANTE: INSIGHTS DA IA GEMINI (Destaque Interativo) */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-6 -right-6 px-4 py-3.5 rounded-2xl shadow-2xl flex items-start gap-3 max-w-[250px] z-20 border transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-orange-500/20 bg-zinc-950/95' 
                    : 'bg-white/95 border-orange-200 shadow-lg shadow-zinc-200/60 text-zinc-850'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-300 ${
                  isDarkMode ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600'
                }`}>
                  <Sparkles size={12} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Insights da IA</span>
                    <span className={`text-[7px] px-1 rounded font-bold transition-colors duration-300 ${
                      isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'
                    }`}>Gemini</span>
                  </div>
                  <p className={`text-[9px] mt-1 leading-normal transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    "Desempenho em Física subiu 15% após a revisão. Foco sugerido para a prova: Termodinâmica."
                  </p>
                </div>
              </motion.div>

              {/* CARD FLUTUANTE: INSIGHT DE ENGAJAMENTO (Destaque Interativo) */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, delay: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -bottom-4 -left-8 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-20 border transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-white/10 bg-zinc-950/95' 
                    : 'bg-white/95 border-zinc-200/80 shadow-lg shadow-zinc-200/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <TrendingUp size={16} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Frequência Acadêmica</span>
                  <span className={`text-[8px] font-bold uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Evolução constante</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==========================================
            METODOLOGIA (BENTO GRID - SEM LIVE CLASSES)
            ========================================== */}
        <section id="metodologia" className={`py-28 px-6 relative border-t transition-colors duration-300 ${
          isDarkMode ? 'border-white/[0.02]' : 'border-zinc-200/60 bg-slate-50/20'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-orange-500 font-extrabold tracking-[0.25em] text-[9px] uppercase">
                O Futuro do Ensino é Estruturado
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-3">
                Metodologia Acadêmica Imersiva
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
              
              {/* Card 1: Inteligência por IA (Largo) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`md:col-span-2 rounded-[32px] p-10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden border ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-orange-500/10' 
                    : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100/40 hover:border-orange-500/20 hover:shadow-lg'
                }`}
              >
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[60px] pointer-events-none transition-colors duration-300 ${
                  isDarkMode ? 'bg-orange-600/[0.02]' : 'bg-orange-500/[0.015]'
                }`} />
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform border ${
                  isDarkMode 
                    ? 'bg-orange-500/10 border-orange-500/15 text-orange-500' 
                    : 'bg-orange-50 border-orange-200/40 text-orange-650'
                }`}>
                  <Brain size={26} />
                </div>
                
                <div>
                  <h3 className={`text-2xl sm:text-3xl font-display font-bold mb-3 flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-zinc-800'
                  }`}>
                    Insights Inteligentes via IA
                    <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest border transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-orange-500/10 border-transparent text-orange-400' 
                        : 'bg-orange-50 border-orange-100 text-orange-600'
                    }`}>
                      Gemini
                    </span>
                  </h3>
                  <p className={`leading-relaxed max-w-xl text-sm sm:text-base transition-colors duration-300 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
                  }`}>
                    Nossa IA analisa padrões de estudo, engajamento e respostas dos alunos para gerar relatórios preditivos automáticos. O professor ganha tempo e o aluno ganha direcionamento cirúrgico de estudos.
                  </p>
                </div>
              </motion.div>

              {/* Card 2: Trilhas de Aulas Gravadas (Alto) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`md:row-span-2 rounded-[32px] p-10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group border ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-orange-500/10' 
                    : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100/40 hover:border-orange-500/20 hover:shadow-lg'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform relative z-10 border ${
                  isDarkMode 
                    ? 'bg-orange-500/10 border-orange-500/15 text-orange-500' 
                    : 'bg-orange-50 border-orange-200/40 text-orange-655'
                }`}>
                  <Play size={26} />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col justify-end">
                  <h3 className={`text-2xl font-display font-bold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Aulas e Trilhas</h3>
                  <p className={`leading-relaxed text-sm transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
                    Aulas estruturadas em trilhas modulares sequenciais com suporte a anexos de arquivos, PDF e conteúdos extras. Estude quando e de onde quiser, mantendo a organização pedagógica intacta.
                  </p>
                </div>

                {/* Elemento gráfico decorativo */}
                <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-8 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                  <div className="w-[18%] bg-orange-600/50 h-[30%] rounded-t-xl" />
                  <div className="w-[18%] bg-orange-500/50 h-[60%] rounded-t-xl" />
                  <div className="w-[18%] bg-orange-600/30 h-[45%] rounded-t-xl" />
                  <div className="w-[18%] bg-orange-550 h-[90%] rounded-t-xl" />
                  <div className="w-[18%] bg-orange-700/50 h-[70%] rounded-t-xl" />
                </div>
              </motion.div>

              {/* Card 3: Atividades e Provas (Largo) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`md:col-span-2 rounded-[32px] p-10 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group border ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-orange-500/10' 
                    : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100/40 hover:border-orange-500/20 hover:shadow-lg'
                }`}
              >
                <div className="flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform border ${
                    isDarkMode 
                      ? 'bg-orange-500/10 border-orange-500/15 text-orange-500' 
                      : 'bg-orange-50 border-orange-200/40 text-orange-650'
                  }`}>
                    <GraduationCap size={26} />
                  </div>
                  <h3 className={`text-2xl font-display font-bold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Atividades & Provas</h3>
                  <p className={`leading-relaxed text-sm max-w-md transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
                    Crie e execute provas seguras. Controle datas de início e fim da janela de provas, timers de duração integrada, gabaritos automáticos para multipla escolha e auto-gravação de rascunhos.
                  </p>
                </div>
                
                {/* Indicador de progresso circular decorativo */}
                <div className="w-28 h-28 rounded-full flex items-center justify-center relative shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="6" fill="none" className={isDarkMode ? 'text-zinc-800' : 'text-zinc-150'} />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      fill="none" 
                      className="text-orange-500" 
                      strokeDasharray="339.29" 
                      strokeDashoffset="84.8" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center text-center relative z-10">
                    <span className="text-2xl font-black text-orange-500 leading-none">75%</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Conclusão</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==========================================
            PLANOS DE ACESSO (REFORMULADO E PREENCHIDO)
            ========================================== */}
        <section id="planos" className={`py-28 px-6 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-white/[0.02] bg-zinc-950/20' : 'border-zinc-200/60 bg-slate-50/20'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-orange-500 font-extrabold tracking-[0.25em] text-[9px] uppercase">
                Investimento sob Medida
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-3">
                Planos de Acesso
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
              
              {/* Plano Normal (Gratuito) */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-[32px] p-8 flex flex-col justify-between border transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/20' 
                    : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100/50'
                }`}
              >
                <div>
                  <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest mb-4">Iniciante</p>
                  <h3 className={`text-3xl font-display font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{`Normal`}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className={`text-4xl font-display font-extrabold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>R$ 0</span>
                    <span className="text-zinc-500 text-xs">/mês</span>
                  </div>
                  
                  <div className={`w-full h-[1px] mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-white/5' : 'bg-zinc-150'}`} />
                  
                  <ul className="space-y-4 mb-8">
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      1 Turma Ativa
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Até 15 Alunos cadastrados
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Correção manual de atividades
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Materiais e anexos básicos
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => onNavigate('register')} 
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors mt-auto border ${
                    isDarkMode 
                      ? 'glass border-white/10 hover:bg-white/5 text-white' 
                      : 'bg-zinc-100 border-zinc-200/50 hover:bg-zinc-200 text-zinc-800 shadow-sm'
                  }`}
                >
                  Criar Conta Grátis
                </button>
              </motion.div>

              {/* Plano Premium (Professor Independente - Destaque) */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`rounded-[32px] p-9 relative flex flex-col justify-between shadow-2xl md:-translate-y-4 border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-orange-500/80 bg-zinc-900/40 shadow-orange-500/5' 
                    : 'bg-white border-orange-500 shadow-orange-500/10'
                }`}
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest py-1.5 px-4.5 rounded-full border border-orange-400/20">
                  Mais Recomendado
                </div>
                
                <div>
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest mb-4">Uso Individual</p>
                  <h3 className={`text-4xl font-display font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{`Premium`}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className={`text-5xl font-display font-extrabold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>R$ 49</span>
                    <span className="text-zinc-400 text-xs">/mês</span>
                  </div>
                  
                  <div className={`w-full h-[1px] mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-white/5' : 'bg-zinc-150'}`} />
                  
                  <ul className="space-y-4 mb-8">
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      <span><strong>1 Turma Ativa</strong> (Foco Individual)</span>
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Até 50 Alunos cadastrados
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Insights de desempenho por IA Gemini
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Estatísticas avançadas de progresso
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Exportação de relatórios (PDF/Excel)
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => onNavigate('register')} 
                  className="w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-md shadow-orange-600/10 hover:shadow-orange-500/25 transition-all mt-auto text-white"
                >
                  Experimentar Premium
                </button>
              </motion.div>

              {/* Plano Pro (Institucional) */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`rounded-[32px] p-8 flex flex-col justify-between border transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/20' 
                    : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100/50'
                }`}
              >
                <div>
                  <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest mb-4">Corporativo</p>
                  <h3 className={`text-3xl font-display font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{`Pro`}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className={`text-4xl font-display font-extrabold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>R$ 199</span>
                    <span className="text-zinc-500 text-xs">/mês</span>
                  </div>
                  
                  <div className={`w-full h-[1px] mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-white/5' : 'bg-zinc-150'}`} />
                  
                  <ul className="space-y-4 mb-8">
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Turmas Ilimitadas
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Professores e Alunos ilimitados
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Painel Administrativo para Coordenação
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      IA Gemini e insights sem limites
                    </li>
                    <li className={`flex items-center gap-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> 
                      Suporte dedicado e integração de dados
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => onNavigate('register')} 
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors mt-auto border ${
                    isDarkMode 
                      ? 'glass border-white/10 hover:bg-white/5 text-white' 
                      : 'bg-zinc-100 border-zinc-200/50 hover:bg-zinc-200 text-zinc-800 shadow-sm'
                  }`}
                >
                  Entrar em Contato
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==========================================
            FAQ SECTION (NOVO - ACORDEÃO INTERATIVO)
            ========================================== */}
        <section id="faq" className={`py-28 px-6 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-white/[0.02]' : 'border-zinc-200/60 bg-slate-50/20'
        }`}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-extrabold tracking-[0.25em] text-[9px] uppercase">
                Esclareça suas Dúvidas
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-3">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index}
                    className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                      isDarkMode 
                        ? 'glass border-white/5 bg-zinc-900/10 hover:bg-zinc-900/20' 
                        : 'bg-white border-zinc-200/80 shadow-sm hover:border-zinc-300/50 hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className={`w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base focus:outline-none ${
                        isDarkMode ? 'text-white' : 'text-zinc-800'
                      }`}
                    >
                      <span>{faq.question}</span>
                      <div className="text-orange-500">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className={`px-6 pb-6 text-xs sm:text-sm leading-relaxed border-t pt-4 ${
                            isDarkMode 
                              ? 'text-zinc-400 border-white/[0.02]' 
                              : 'text-zinc-650 border-zinc-100'
                          }`}>
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==========================================
            FOOTER
            ========================================== */}
        <footer className={`border-t py-12 px-6 transition-colors duration-300 ${
          isDarkMode ? 'border-white/[0.04] bg-zinc-950/45' : 'border-zinc-200 bg-zinc-100/40'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Aprende+" 
                className={`h-6 w-auto opacity-70 hover:opacity-100 transition-opacity ${
                  isDarkMode ? '' : 'filter brightness-95'
                }`} 
              />
              <span className={`text-xs font-black font-display transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}`}>Aprende+</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#" className={`text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>Termos de Uso</a>
              <a href="#" className={`text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>Privacidade</a>
              <a href="#" className={`text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}>Suporte</a>
            </div>

            <p className={`text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${isDarkMode ? 'text-zinc-650' : 'text-zinc-500'}`}>
              &copy; 2026 Aprende+. O Arquivo do Aprendizado Inteligente.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
