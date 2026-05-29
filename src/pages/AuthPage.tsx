import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, BookOpen, Shield, ChevronRight } from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

import { authService } from '../lib/auth';

interface AuthPageProps {
  mode: 'login' | 'register';
  onNavigate: (mode: 'login' | 'register' | 'landing' | 'onboarding') => void;
  onLogin: (user: AuthUser, mustChangePassword?: boolean, isDemoMode?: boolean) => void;
  isDarkMode: boolean;
}

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  {
    role: 'admin',
    label: 'Administrador',
    desc: 'Gestão institucional completa',
    icon: Shield,
    color: 'from-orange-500 to-red-500',
  },
  {
    role: 'teacher',
    label: 'Professor',
    desc: 'Criação de conteúdo e avaliações',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    role: 'student',
    label: 'Aluno',
    desc: 'Acesso às aulas e atividades',
    icon: GraduationCap,
    color: 'from-emerald-500 to-teal-500',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function AuthPage({ mode, onNavigate, onLogin, isDarkMode }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [loginMode, setLoginMode] = useState<'demo' | 'prod'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find((u) => u.role === selectedRole) ?? MOCK_USERS[2];
    onLogin(user, false, true); // (user, mustChangePassword = false, isDemoMode = true)
  };

  const handleProdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { user, error, mustChangePassword } = await authService.signIn(email, password);

    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    if (user) {
      onLogin(user, mustChangePassword, false); // (user, mustChangePassword, isDemoMode = false)
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-zinc-900'
    }`}>
      {/* Lado Esquerdo — Visual (oculto em telas pequenas) */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#050505]' : 'bg-slate-50'
      }`}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] transition-all duration-300 ${
            isDarkMode ? 'bg-orange-600/5' : 'bg-orange-500/[0.025]'
          }`} />
          <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-300 ${
            isDarkMode ? 'bg-orange-500/5' : 'bg-orange-500/[0.02]'
          }`} />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-lg"
        >
          <motion.p variants={fadeUp} className="text-orange-500 font-extrabold tracking-[0.2em] text-xs uppercase mb-4">
            Acesso à Plataforma
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className={`text-6xl font-display font-extrabold leading-tight mb-6 tracking-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-zinc-900'
            }`}
          >
            Bem-vindo de<br />
            <span className="text-orange-500">volta.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className={`text-lg leading-relaxed mb-12 transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
          }`}>
            Escolha seu perfil de acesso e entre no ambiente da sua instituição. Cada role possui um painel exclusivo.
          </motion.p>

          {/* Cards de role do lado esquerdo — decorativos */}
          <motion.div variants={fadeUp} className="space-y-3">
            {ROLE_OPTIONS.map((opt) => (
              <div 
                key={opt.role} 
                className={`flex items-center gap-4 rounded-2xl px-5 py-4 border transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass border-white/5 bg-zinc-900/35' 
                    : 'bg-white border-zinc-200 shadow-md shadow-zinc-100/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center shrink-0`}>
                  <opt.icon size={20} className="text-white" />
                </div>
                <div>
                  <p className={`font-bold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-zinc-800'
                  }`}>{opt.label}</p>
                  <p className="text-xs text-zinc-500 font-medium">{opt.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      {/* Lado Direito — Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Botão Voltar */}
        <button
          onClick={() => onNavigate('landing')}
          className={`absolute top-8 left-8 transition-colors duration-300 text-sm font-bold ${
            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-550 hover:text-zinc-900'
          }`}
        >
          ← Voltar
        </button>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className={`text-3xl sm:text-4xl font-display font-extrabold mb-3 tracking-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-zinc-900'
            }`}>
              Acessar conta
            </h2>
            <p className={`font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Escolha seu perfil e entre na plataforma.
            </p>
          </div>

          {/* Abas de Modo de Login */}
          <div className={`flex gap-2 p-1.5 border rounded-[20px] mb-8 transition-all duration-300 ${
            isDarkMode 
              ? 'glass border-white/10 bg-black/20' 
              : 'bg-zinc-100 border-zinc-200 shadow-inner'
          }`}>
            <button
              onClick={() => setLoginMode('demo')}
              className={`flex-1 py-3 rounded-[14px] font-bold text-sm transition-all relative ${
                loginMode === 'demo' 
                  ? (isDarkMode ? 'text-white' : 'text-zinc-800') 
                  : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-800')
              }`}
            >
              {loginMode === 'demo' && (
                <motion.div 
                  layoutId="auth-tab"
                  className={`absolute inset-0 rounded-[14px] opacity-80 ${
                    isDarkMode ? 'sidebar-grad' : 'bg-orange-600'
                  }`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Acesso Rápido (Demo)</span>
            </button>
            <button
              onClick={() => {
                setLoginMode('prod');
                setEmail('');
                setPassword('');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 rounded-[14px] font-bold text-sm transition-all relative ${
                loginMode === 'prod' 
                  ? (isDarkMode ? 'text-white' : 'text-zinc-800') 
                  : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-800')
              }`}
            >
              {loginMode === 'prod' && (
                <motion.div 
                  layoutId="auth-tab"
                  className={`absolute inset-0 rounded-[14px] border ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/10' 
                      : 'bg-white border-zinc-300 shadow-sm'
                  }`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Institucional (Real)</span>
            </button>
          </div>

          {/* MODO DEMO */}
          {loginMode === 'demo' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >

          {/* Seletor de Role */}
          <div className="mb-6">
            <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ml-1 transition-colors duration-300 ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Entrar como
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? (isDarkMode ? 'border-orange-500 bg-orange-500/10' : 'border-orange-500 bg-orange-50/50')
                        : (isDarkMode ? 'border-white/5 bg-black/30 hover:border-white/20' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm')
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center transition-all ${isSelected ? 'scale-110 shadow-lg' : 'opacity-60'}`}
                    >
                      <opt.icon size={20} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider leading-tight text-center transition-colors duration-300 ${
                      isSelected 
                        ? (isDarkMode ? 'text-white' : 'text-orange-700') 
                        : 'text-zinc-500'
                    }`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 rounded-2xl border-2 border-orange-500 pointer-events-none"
                        transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

            <div className={`rounded-[32px] p-8 sm:p-10 shadow-2xl mt-6 border transition-all duration-300 ${
              isDarkMode 
                ? 'glass border-white/10 bg-zinc-900/50 backdrop-blur-xl' 
                : 'bg-white border-zinc-200/80 shadow-lg shadow-zinc-200/40'
            }`}>
              <form onSubmit={handleDemoSubmit} className="space-y-5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-600/20 transition-all mt-2 flex items-center justify-center gap-2"
                >
                  ACESSAR AMBIENTE DEMO
                  <ChevronRight size={18} />
                </motion.button>
              </form>

              {/* Aviso de ambiente demo */}
              <div className={`mt-6 p-3 rounded-xl border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-orange-500/5 border-orange-500/10' 
                  : 'bg-orange-50/60 border-orange-200/60'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-orange-500/80' : 'text-orange-700'
                }`}>
                  Ambiente de demonstração — acesso instantâneo com dados fictícios
                </p>
              </div>
            </div>
            </motion.div>
          )}

          {/* MODO PRODUÇÃO */}
          {loginMode === 'prod' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
            <div className={`border rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
              isDarkMode 
                ? 'glass border-white/10 bg-zinc-900/50' 
                : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-200/40'
            }`}>
              <form onSubmit={handleProdSubmit} className="space-y-5">
                
                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                    <p className="text-xs font-bold text-red-400 text-center">{errorMsg}</p>
                  </div>
                )}

                {/* E-mail */}
                <div className="space-y-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest ml-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    E-mail Institucional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@instituicao.edu.br"
                      className={`w-full border rounded-2xl py-4 pl-12 pr-4 transition-all focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600' 
                          : 'bg-slate-50/70 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest ml-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full border rounded-2xl py-4 pl-12 pr-12 transition-all focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600' 
                          : 'bg-slate-50/70 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors ${
                        isDarkMode ? 'hover:text-zinc-300' : 'hover:text-zinc-700'
                      }`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <a href="#" className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors">
                      Esqueceu a senha?
                    </a>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-extrabold py-4 rounded-2xl shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${
                    isLoading 
                      ? (isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-200 text-zinc-500') 
                      : (isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800')
                  }`}
                >
                  {isLoading ? 'Autenticando...' : 'ENTRAR'}
                  {!isLoading && <ChevronRight size={18} />}
                </motion.button>
              </form>
            </div>
            </motion.div>
          )}

            <div className="mt-6 text-center">
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
              }`}>
                Representa uma instituição?{' '}
                <button
                  onClick={() => onNavigate('onboarding')}
                  className="text-orange-500 font-bold hover:underline underline-offset-4"
                >
                  Criar conta institucional
                </button>
              </p>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
