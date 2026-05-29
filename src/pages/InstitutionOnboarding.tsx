import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, User, Mail, ChevronRight, ChevronLeft,
  Check, GraduationCap, School, BookOpen, Sparkles,
} from 'lucide-react';
import { AuthUser } from '../types';
import { MOCK_USERS } from '../constants';
import { adminService } from '../lib/adminService';
import { supabase } from '../lib/supabase';

interface InstitutionOnboardingProps {
  onBack: () => void;
  onComplete: (user: AuthUser, mustChangePassword?: boolean, isDemoMode?: boolean) => void;
}

type SchoolType = 'faculdade' | 'escola' | 'cursinho';

const SCHOOL_TYPE_OPTIONS: { value: SchoolType; label: string; icon: React.ElementType }[] = [
  { value: 'faculdade', label: 'Faculdade / Universidade', icon: GraduationCap },
  { value: 'escola', label: 'Escola Regular', icon: School },
  { value: 'cursinho', label: 'Cursinho / Curso Livre', icon: BookOpen },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const STEPS = ['Instituição', 'Administrador', 'Confirmação'];

export default function InstitutionOnboarding({ onBack, onComplete }: InstitutionOnboardingProps) {
  const [step, setStep] = useState(0);
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState<SchoolType>('faculdade');
  const [city, setCity] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canNext =
    step === 0
      ? schoolName.trim() !== '' && city.trim() !== ''
      : step === 1
        ? adminName.trim() !== '' && adminEmail.trim() !== ''
        : true;

  const handleComplete = async () => {
    setIsLoading(true);
    setErrorMsg('');

    const { user, error } = await adminService.createInstitutionAndAdmin({
      schoolName,
      schoolType,
      city,
      adminName,
      adminEmail
    });

    if (error) {
      setErrorMsg(error);
      setIsLoading(false);
      return;
    }

    // Fazer login real no Supabase Auth para ter a sessão ativa antes de ir pra troca de senha
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'Mudar@1234'
    });

    setIsLoading(false);

    if (loginError) {
      setErrorMsg('Instituição criada, mas não foi possível logar. Tente entrar pelo modo Institucional.');
      return;
    }

    if (user) {
      // Passamos true para forçar a tela de Definir Senha, e false para isDemoMode (pois é uma conta real)
      onComplete(user, true, false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-body)]">
      {/* Lado Esquerdo — Stepper visual */}
      <div className="hidden lg:flex w-2/5 relative overflow-hidden flex-col justify-between p-12 bg-zinc-950/80 border-r border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-20">
            <img src="/logo.png" alt="Aprende+" className="h-8 w-auto" />
            <div>
              <h2 className="text-lg font-extrabold tracking-tight font-display">Aprende+</h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Plataforma Institucional</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="space-y-2">
            {STEPS.map((label, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all duration-300 ${
                        isDone
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : isActive
                            ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-500'
                            : 'bg-white/5 border border-white/10 text-zinc-600'
                      }`}
                    >
                      {isDone ? <Check size={18} /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-0.5 h-10 mt-1 rounded-full transition-all duration-500 ${isDone ? 'bg-orange-500' : 'bg-white/10'}`} />
                    )}
                  </div>
                  <div className={`transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                    <p className={`font-extrabold text-sm ${isActive ? 'text-white' : 'text-zinc-500'}`}>{label}</p>
                    <p className="text-[10px] text-zinc-600 font-medium">
                      {i === 0 ? 'Dados da escola' : i === 1 ? 'Conta do administrador' : 'Revisão e ativação'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10">
          <div className="glass border border-white/5 rounded-2xl p-6">
            <Sparkles size={20} className="text-orange-500 mb-3" />
            <p className="text-sm font-bold text-white mb-1">Plano Institucional Gratuito</p>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Comece com até 50 alunos e 5 professores sem custo. Escale conforme sua instituição crescer.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito — Formulário por etapa */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 text-zinc-400 hover:text-white transition-colors text-sm font-bold"
        >
          ← Voltar
        </button>

        {/* Stepper Mobile */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-orange-500' : i < step ? 'w-4 bg-orange-500/60' : 'w-4 bg-white/10'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* STEP 0 — Dados da Instituição */}
            {step === 0 && (
              <motion.div key="step0" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div>
                  <p className="text-orange-500 text-xs font-extrabold uppercase tracking-widest mb-2">Etapa 1 de 3</p>
                  <h2 className="text-4xl font-display font-extrabold text-white tracking-tight">Sua Instituição</h2>
                  <p className="text-zinc-400 mt-2 font-medium">Vamos configurar o ambiente da sua escola na plataforma.</p>
                </div>

                <div className="space-y-5">
                  {/* Nome da escola */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Nome da Instituição</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input
                        type="text"
                        placeholder="Ex: Faculdade Municipal de São Paulo"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Cidade */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Cidade / Estado</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, SP"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                      required
                    />
                  </div>

                  {/* Tipo de instituição */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Tipo de Instituição</label>
                    <div className="grid grid-cols-3 gap-3">
                      {SCHOOL_TYPE_OPTIONS.map((opt) => {
                        const isSelected = schoolType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSchoolType(opt.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                              isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-black/30 hover:border-white/20'
                            }`}
                          >
                            <opt.icon size={22} className={isSelected ? 'text-orange-500' : 'text-zinc-500'} />
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider leading-tight text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  disabled={!canNext}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={18} />
                </motion.button>
              </motion.div>
            )}

            {/* STEP 1 — Dados do Admin */}
            {step === 1 && (
              <motion.div key="step1" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div>
                  <p className="text-orange-500 text-xs font-extrabold uppercase tracking-widest mb-2">Etapa 2 de 3</p>
                  <h2 className="text-4xl font-display font-extrabold text-white tracking-tight">Conta do Administrador</h2>
                  <p className="text-zinc-400 mt-2 font-medium">Quem irá gerenciar a instituição na plataforma?</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input
                        type="text"
                        placeholder="Ex: Carlos Mendes"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input
                        type="email"
                        placeholder="admin@suaescola.edu.br"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-zinc-400 font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Voltar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(2)}
                    disabled={!canNext}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar <ChevronRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Confirmação */}
            {step === 2 && (
              <motion.div key="step2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div>
                  <p className="text-orange-500 text-xs font-extrabold uppercase tracking-widest mb-2">Etapa 3 de 3</p>
                  <h2 className="text-4xl font-display font-extrabold text-white tracking-tight">Tudo pronto!</h2>
                  <p className="text-zinc-400 mt-2 font-medium">Revise as informações antes de ativar sua conta institucional.</p>
                </div>

                <div className="glass border border-white/10 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-4 pb-5 border-b border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                      <Building2 size={28} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-extrabold text-lg text-white">{schoolName || 'Minha Instituição'}</p>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        {SCHOOL_TYPE_OPTIONS.find((o) => o.value === schoolType)?.label} · {city || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Administrador</p>
                    <p className="font-bold text-white">{adminName || '—'}</p>
                    <p className="text-sm text-zinc-400 font-medium">{adminEmail || '—'}</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Plano Inicial</p>
                    <span className="bg-orange-500/10 text-orange-500 text-xs font-extrabold px-3 py-1 rounded-full border border-orange-500/10 uppercase tracking-widest">Gratuito</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 py-4 px-6 rounded-2xl border border-white/10 text-zinc-400 font-bold hover:bg-white/5 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleComplete}
                    disabled={isLoading}
                    className={`flex-1 ${isLoading ? 'bg-zinc-700 text-zinc-400' : 'sidebar-grad text-white shadow-xl shadow-orange-600/20 hover:shadow-orange-500/40'} font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      'Criando Instituição...'
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Ativar Conta Institucional
                      </>
                    )}
                  </motion.button>
                </div>
                {errorMsg && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-xs font-bold text-red-400 text-center">{errorMsg}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
