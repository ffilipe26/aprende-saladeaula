import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangePasswordProps {
  onSuccess: () => void;
  userName: string;
  isDarkMode: boolean;
}

export default function ChangePassword({ onSuccess, userName, isDarkMode }: ChangePasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Atualiza a senha no auth
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      // 2. Atualiza a flag na tabela users
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', userData.user.id);
        
        if (dbError) throw dbError;
      }

      setSuccessMsg(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)] p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] transition-colors duration-300 ${
          isDarkMode ? 'bg-orange-600/5' : 'bg-orange-500/[0.025]'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-300 ${
          isDarkMode ? 'bg-orange-500/5' : 'bg-orange-500/[0.02]'
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20 shadow-lg shadow-orange-500/10">
            <Lock size={32} />
          </div>
          <h2 className={`text-3xl font-display font-extrabold mb-2 tracking-tight transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-zinc-900'
          }`}>
            Defina sua Senha
          </h2>
          <p className={`font-medium text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
          }`}>
            Olá, {userName.split(' ')[0]}! Como este é o seu primeiro acesso, você precisa definir uma senha pessoal e segura.
          </p>
        </div>

        <div className={`border rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'glass border-white/10 bg-zinc-900/50' 
            : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-200/40'
        }`}>
          {successMsg ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-zinc-900'
                }`}>Senha atualizada!</h3>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}>Redirecionando para a plataforma...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-650'}`}>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest ml-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-550'
                  }`}>Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={`w-full border rounded-2xl py-4 pl-12 pr-12 transition-all focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600' 
                          : 'bg-slate-50/70 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                      required
                      minLength={6}
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
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest ml-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-550'
                  }`}>Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className={`w-full border rounded-2xl py-4 pl-12 pr-12 transition-all focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/5 text-white placeholder:text-zinc-600' 
                          : 'bg-slate-50/70 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full font-extrabold py-4 rounded-2xl transition-all mt-4 flex items-center justify-center gap-2 ${
                  isLoading 
                    ? (isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-200 text-zinc-500') 
                    : 'sidebar-grad text-white hover:shadow-lg hover:shadow-orange-600/20'
                }`}
              >
                {isLoading ? 'SALVANDO...' : 'SALVAR E CONTINUAR'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
