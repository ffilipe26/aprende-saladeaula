import { Search, User, MoreVertical, ChevronLeft, ChevronRight, GraduationCap, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import Header from './Header';
import { Notification } from '../types';

interface MembersProps {
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
}

export default function Members({
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick
}: MembersProps) {
  // ==========================================
  // DADOS MOCKADOS (A SEREM SUBSTITUÍDOS POR API)
  // ==========================================
  const members = [
    { name: 'Ricardo Costa', email: 'ricardo.costa@aprende.com', role: 'Professor', status: 'Online' },
    { name: 'Ana Silva', email: 'ana.silva@student.com', role: 'Aluno', status: 'Online' },
    { name: 'Lucas Oliveira', email: 'lucas.oliveira@student.com', role: 'Aluno', status: 'Offline' },
    { name: 'Beatriz Santos', email: 'beatriz.santos@student.com', role: 'Aluno', status: 'Online' },
    { name: 'Marina Lima', email: 'marina.lima@aprende.com', role: 'Professor', status: 'Offline' },
  ];

  // ==========================================
  // ANIMAÇÕES
  // ==========================================
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* Cabeçalho */}
      <Header 
        title="Membros da Turma" 
        subtitle="Visualize e interaja com os colegas e professores." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Título da Página e Barra de Busca */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <motion.div variants={item}>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-display flex flex-col sm:flex-row items-start sm:items-center gap-4">
            Membros da Turma
            <span className="bg-orange-500/10 text-orange-500 text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-orange-500/10">
              42 Alunos
            </span>
          </h1>
          <p className="text-[var(--text-muted)] mt-3 font-medium text-lg">Visualize e interaja com os colegas e professores.</p>
        </motion.div>
        
        <motion.div variants={item} className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
            <input 
              type="text" 
              placeholder="Buscar membros..." 
              className="glass border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 w-full lg:w-96 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-medium"
            />
          </div>
        </motion.div>
      </div>

      {/* Lista de Membros (Tabela Desktop / Cards Mobile) */}
      <motion.div variants={item} className="glass border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl shadow-black/20">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-white/5">
                <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Membro</th>
                <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-8 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {members.map((member, idx) => (
                <motion.tr 
                  key={idx} 
                  variants={item}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className={`h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center ring-2 ring-white/5 group-hover:ring-orange-500/30 transition-all ${member.role === 'Professor' ? 'text-orange-500' : 'text-zinc-500'}`}>
                          {member.role === 'Professor' ? <GraduationCap size={28} /> : <User size={28} />}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-body)] ${member.status === 'Online' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-lg group-hover:text-orange-500 transition-colors">{member.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5 mt-0.5">
                          <Mail size={12} />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${member.status === 'Online' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
                      <span className={`text-sm font-extrabold uppercase tracking-widest ${member.status === 'Online' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                        {member.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button className="p-3 glass border border-white/5 rounded-xl text-[var(--text-muted)] hover:text-white hover:border-white/20 transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {members.map((member, idx) => (
            <motion.div 
              key={idx} 
              variants={item}
              className="p-8 flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className={`h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center ring-2 ring-white/5 ${member.role === 'Professor' ? 'text-orange-500' : 'text-zinc-500'}`}>
                    {member.role === 'Professor' ? <GraduationCap size={28} /> : <User size={28} />}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-body)] ${member.status === 'Online' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white group-hover:text-orange-500 transition-colors">{member.name}</p>
                  <p className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[150px]">{member.email}</p>
                </div>
              </div>
              <button className="p-3 glass border border-white/5 rounded-xl text-[var(--text-muted)]">
                <MoreVertical size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Paginação */}
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-center gap-8 px-4">
        <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">Mostrando 1-5 de 42 membros</p>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass border border-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-white disabled:opacity-50 transition-all"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <button className="w-12 h-12 sidebar-grad text-white rounded-xl font-extrabold shadow-lg shadow-orange-600/20">1</button>
          <button className="w-12 h-12 glass border border-[var(--border)] text-[var(--text-muted)] rounded-xl font-extrabold hover:text-white transition-all">2</button>
          <button className="w-12 h-12 glass border border-[var(--border)] text-[var(--text-muted)] rounded-xl font-extrabold hover:text-white transition-all">3</button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass border border-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-white transition-all"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
