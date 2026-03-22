import { Bell, User, Mail, Shield, BellRing, Moon, ChevronRight, Save, Terminal } from 'lucide-react';
import { useState } from 'react';

interface SettingsProps {
  isDevMode: boolean;
  setIsDevMode: (val: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  userName: string;
  setUserName: (val: string) => void;
  userEmail: string;
  setUserEmail: (val: string) => void;
}

export default function Settings({ 
  isDevMode, 
  setIsDevMode, 
  isDarkMode, 
  toggleTheme,
  userName,
  setUserName,
  userEmail,
  setUserEmail
}: SettingsProps) {
  // ==========================================
  // ESTADOS LOCAIS
  // ==========================================
  const [activeTab, setActiveTab] = useState('perfil');
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const [showSaved, setShowSaved] = useState(false);

  // ==========================================
  // CONFIGURAÇÃO DAS ABAS
  // ==========================================
  const tabs = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'conta', label: 'Conta' },
    { id: 'privacidade', label: 'Privacidade' },
    { id: 'notificacoes', label: 'Notificações' },
  ];

  // ==========================================
  // FUNÇÕES DE AÇÃO
  // ==========================================
  const handleSave = () => {
    setUserName(tempName);
    setUserEmail(tempEmail);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Configurações</h1>
          <p className="text-[var(--text-muted)] mt-2">Gerencie sua conta e preferências da plataforma.</p>
        </div>
        <button className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-white transition-all">
          <Bell size={24} />
        </button>
      </div>

      {/* Navegação de Abas */}
      <div className="flex gap-4 md:gap-8 border-b border-[var(--border)] mb-12 overflow-x-auto">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 font-semibold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-orange-500' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div className="space-y-12">
        {activeTab === 'perfil' && (
          <>
            {/* Seção: Modo Desenvolvedor */}
            <section className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                  <Terminal size={28} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-orange-500">Modo Desenvolvedor (Professor)</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md">
                    Ative para simular as funcionalidades de professor, permitindo criar, editar e excluir atividades e provas.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDevMode(!isDevMode)}
                className={`w-16 h-8 rounded-full p-1 transition-all duration-300 flex items-center shrink-0 ${isDevMode ? 'bg-orange-600' : 'bg-zinc-700'}`}
              >
                <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 transform ${isDevMode ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
            </section>

            {/* Seção: Editar Perfil */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <h2 className="text-2xl font-bold">Editar Perfil</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {showSaved && <span className="text-emerald-500 text-sm font-bold animate-fade-in">Alterações salvas!</span>}
                  <button 
                    onClick={handleSave}
                    className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 w-full sm:w-auto justify-center"
                  >
                    <Save size={18} />
                    Salvar Alterações
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                      type="email" 
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Biografia</label>
                <textarea 
                  defaultValue="Estudante de Engenharia de Software apaixonada por tecnologia e educação."
                  className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                />
              </div>
            </section>

            {/* Seção: Modo Noturno */}
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                  <Moon size={28} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold">Modo Noturno</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md">
                    O Modo Noturno ajusta as cores da tela para reduzir o cansaço visual e proporcionar uma experiência de leitura mais confortável em ambientes com pouca luz.
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-16 h-8 rounded-full p-1 transition-all duration-300 flex items-center shrink-0 ${isDarkMode ? 'bg-orange-600' : 'bg-zinc-700'}`}
              >
                <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 transform ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
            </section>
          </>
        )}

        {/* Aba: Conta */}
        {activeTab === 'conta' && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-8">Segurança da Conta</h2>
            <div className="space-y-4">
              <button className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between hover:border-orange-500/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[var(--text-muted)] group-hover:text-orange-500 transition-colors">
                    <Shield size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Alterar Senha</p>
                    <p className="text-xs text-[var(--text-muted)]">Atualize sua senha periodicamente para manter-se seguro.</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </button>

              <button className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between hover:border-orange-500/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[var(--text-muted)] group-hover:text-orange-500 transition-colors">
                    <BellRing size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Autenticação em Duas Etapas</p>
                    <p className="text-xs text-[var(--text-muted)]">Adicione uma camada extra de proteção ao seu acesso.</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>
          </section>
        )}

        {/* Aba: Privacidade */}
        {activeTab === 'privacidade' && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-8">Privacidade</h2>
            <p className="text-[var(--text-muted)]">Configurações de privacidade em desenvolvimento.</p>
          </section>
        )}

        {/* Aba: Notificações */}
        {activeTab === 'notificacoes' && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-8">Notificações</h2>
            <p className="text-[var(--text-muted)]">Configurações de notificações em desenvolvimento.</p>
          </section>
        )}
      </div>
    </div>
  );
}
