import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Mail, 
  Check, 
  X,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import Header from '../components/layout/Header';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { SchoolMember, Subject, Notification, SchoolClass, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { adminService } from '../lib/adminService';

interface AdminPanelProps {
  currentUser: AuthUser | null;
  classes: SchoolClass[];
  schoolMembers: SchoolMember[];
  setSchoolMembers: React.Dispatch<React.SetStateAction<SchoolMember[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  userRole: string;
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  isDarkMode: boolean;
}

type TabType = 'teachers' | 'students' | 'subjects';

export default function AdminPanel({
  currentUser,
  classes,
  schoolMembers,
  setSchoolMembers,
  subjects,
  setSubjects,
  userRole,
  userName,
  notifications,
  onRemoveNotification,
  onMarkAsRead,
  onProfileClick,
  isDarkMode
}: AdminPanelProps) {
  const isTeacher = userRole === 'teacher';
  const [activeTab, setActiveTab] = useState<TabType>(isTeacher ? 'students' : 'teachers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modais de Criação
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Estados de formulário de membros
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'teacher' | 'student'>('teacher');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [memberPassword, setMemberPassword] = useState('Mudar@1234');
  
  // Loading and Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error', msg: string, data?: string } | null>(null);

  // Delete Confirmation
  const [memberToDelete, setMemberToDelete] = useState<SchoolMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de formulário de disciplinas
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectTeacherId, setSubjectTeacherId] = useState('');

  const myStudentIds = isTeacher ? subjects.filter(s => s.teacherId === currentUser?.id).flatMap(s => s.studentIds) : [];

  // Filtra dados com base na aba ativa e na busca
  const teachers = isTeacher ? [] : schoolMembers.filter(m => m.role === 'teacher');
  const students = isTeacher 
    ? schoolMembers.filter(m => m.role === 'student' && myStudentIds.includes(m.id))
    : schoolMembers.filter(m => m.role === 'student');

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // FUNÇÕES DE CRUD
  // ==========================================
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberEmail || !currentUser) return;
    setIsLoading(true);
    setModalFeedback(null);

    const instId = currentUser.institutionId;
    if (!instId) {
       setModalFeedback({ type: 'error', msg: 'Conta sem instituição vinculada.' });
       setIsLoading(false);
       return;
    }

    const { user, error, tempPassword } = await adminService.createUser({
      institutionId: instId,
      name: memberName,
      email: memberEmail,
      role: memberRole,
      password: memberPassword,
      classId: memberRole === 'student' ? selectedClassId : undefined
    });

    if (error || !user) {
      setModalFeedback({ type: 'error', msg: error || 'Erro desconhecido.' });
      setIsLoading(false);
      return;
    }

    if (memberRole === 'student' && selectedClassId) {
      const classSubjects = subjects.filter(s => s.classId === selectedClassId);
      
      if (classSubjects.length > 0) {
        const enrollmentsToInsert = classSubjects.map(sub => ({
          student_id: user.id,
          subject_id: sub.id,
          class_id: selectedClassId
        }));
        
        const { error: enrollError } = await supabase
          .from('subject_enrollments')
          .insert(enrollmentsToInsert);
          
        if (!enrollError) {
          setSubjects(prev => prev.map(sub => 
            classSubjects.some(cs => cs.id === sub.id)
              ? { ...sub, studentIds: [...sub.studentIds, user.id] } 
              : sub
          ));
        }
      }
    }

    const newMember: SchoolMember = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: memberRole,
      status: 'ativo',
      joinedAt: new Date().toISOString(),
      classId: memberRole === 'student' ? selectedClassId : undefined,
      subjectIds: memberRole === 'student' && selectedClassId ? subjects.filter(s => s.classId === selectedClassId).map(s => s.id) : []
    };

    setSchoolMembers(prev => [newMember, ...prev]);
    setModalFeedback({ type: 'success', msg: `Cadastrado! Senha:`, data: tempPassword || memberPassword });
    setIsLoading(false);
    
    setMemberName('');
    setMemberEmail('');
    setMemberPassword('Mudar@1234');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !subjectCode) return;

    const assignedTeacher = teachers.find(t => t.id === subjectTeacherId);

    const newSubject: Subject = {
      id: `s-${Date.now()}`,
      name: subjectName,
      code: subjectCode.toUpperCase(),
      teacherId: subjectTeacherId || 'unassigned',
      teacherName: assignedTeacher ? assignedTeacher.name : 'Sem Professor',
      studentIds: []
    };

    setSubjects(prev => [...prev, newSubject]);

    // Reset formulário
    setSubjectName('');
    setSubjectCode('');
    setSubjectTeacherId('');
    setIsSubjectModalOpen(false);
  };

  const executeDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);

    const { error } = await adminService.deleteUser(memberToDelete.id);

    if (error) {
      console.error('Erro ao excluir membro:', error);
      setIsDeleting(false);
      return;
    }

    setSchoolMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
    setSubjects(prev => prev.map(sub => ({
      ...sub,
      studentIds: sub.studentIds.filter(sId => sId !== memberToDelete.id),
      teacherId: sub.teacherId === memberToDelete.id ? '' : sub.teacherId,
      teacherName: sub.teacherId === memberToDelete.id ? 'Sem Professor' : sub.teacherName
    })));

    setIsDeleting(false);
    setMemberToDelete(null);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <Header 
        title="Controle Administrativo" 
        subtitle="Gerencie matrículas de alunos, atribuição de professores e disciplinas." 
        userName={userName}
        onProfileClick={onProfileClick}
        notifications={notifications}
        onRemoveNotification={onRemoveNotification}
        onMarkAsRead={onMarkAsRead}
      />

      {/* Título e Ação Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-display">Gestão Acadêmica</h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium text-base">Modifique dados cadastrais da instituição em tempo real.</p>
        </div>

        {!isTeacher && (
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {activeTab === 'subjects' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSubjectModalOpen(true)}
              className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all w-full lg:w-auto justify-center"
            >
              <Plus size={18} />
              Criar Disciplina
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setMemberRole(activeTab === 'teachers' ? 'teacher' : 'student');
                setIsMemberModalOpen(true);
              }}
              className="sidebar-grad text-white px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all w-full lg:w-auto justify-center"
            >
              <Plus size={18} />
              Adicionar {activeTab === 'teachers' ? 'Professor' : 'Aluno'}
            </motion.button>
          )}
        </div>
        )}
      </div>

      {/* Mensagem de Feedback de Criação de Senha */}
      <AnimatePresence>
        {modalFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-5 rounded-2xl border flex items-center justify-between shadow-xl ${
              modalFeedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/5' 
                : 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/5'
            }`}
          >
            <div>
              <p className="font-bold text-sm">{modalFeedback.msg}</p>
              {modalFeedback.data && (
                <p className="font-extrabold text-2xl mt-1 tracking-widest">{modalFeedback.data}</p>
              )}
            </div>
            <button onClick={() => setModalFeedback(null)} className="p-3 hover:bg-black/20 rounded-xl transition-all">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles de Busca e Abas */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
        {/* Abas */}
        <div className={`flex gap-2 p-1.5 border rounded-[20px] overflow-x-auto transition-all duration-300 ${
          isDarkMode ? 'glass border border-[var(--border)]' : 'bg-zinc-100 border-zinc-200 shadow-inner'
        }`}>
          {[
            { id: 'teachers', label: 'Professores', count: teachers.length },
            { id: 'students', label: 'Alunos', count: students.length },
            { id: 'subjects', label: 'Disciplinas', count: subjects.length }
          ].filter(tab => isTeacher ? tab.id === 'students' : true).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSearchQuery('');
              }}
              className={`px-5 py-2.5 rounded-[14px] font-bold text-sm transition-all relative shrink-0 cursor-pointer ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : (isDarkMode ? 'text-[var(--text-muted)] hover:text-white' : 'text-zinc-550 hover:text-zinc-900')
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="admin-active-tab"
                  className="absolute inset-0 sidebar-grad rounded-[14px]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id 
                    ? 'bg-white/20' 
                    : (isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-orange-500/10 text-orange-650 font-bold')
                }`}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative flex-1 md:flex-none">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`border rounded-2xl py-3.5 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-sm font-medium ${
              isDarkMode ? 'glass border-[var(--border)] text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
            }`}
          />
        </div>
      </div>

      {/* Tabelas de Dados */}
      <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isDarkMode ? 'glass border-[var(--border)]' : 'bg-white border-zinc-200/80 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          {activeTab === 'teachers' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b transition-all duration-300 ${
                  isDarkMode ? 'border-[var(--border)] bg-white/5' : 'border-zinc-200 bg-slate-50'
                }`}>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Membro</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Cadastro</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-16 text-[var(--text-muted)] font-medium">Nenhum professor encontrado.</td>
                  </tr>
                ) : (
                  filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className={`transition-colors group ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                    }`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors">{teacher.name}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} />
                              {teacher.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-[var(--text-muted)] font-bold">
                        {teacher.joinedAt ? new Date(teacher.joinedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setMemberToDelete(teacher)}
                          className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'students' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b transition-all duration-300 ${
                  isDarkMode ? 'border-[var(--border)] bg-white/5' : 'border-zinc-200 bg-slate-50'
                }`}>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Membro</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Cadastro</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-16 text-[var(--text-muted)] font-medium">Nenhum aluno encontrado.</td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className={`transition-colors group ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                    }`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors">{student.name}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-[var(--text-muted)] font-bold">
                        {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!isTeacher && (
                          <button 
                            onClick={() => setMemberToDelete(student)}
                            className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'subjects' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b transition-all duration-300 ${
                  isDarkMode ? 'border-[var(--border)] bg-white/5' : 'border-zinc-200 bg-slate-50'
                }`}>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Código / Nome</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Professor</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-16 text-[var(--text-muted)] font-medium">Nenhuma disciplina cadastrada.</td>
                  </tr>
                ) : (
                  filteredSubjects.map(subject => (
                    <tr key={subject.id} className={`transition-colors group ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                    }`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded tracking-wider uppercase">
                              {subject.code}
                            </span>
                            <p className="font-bold text-[var(--text-main)] group-hover:text-orange-500 transition-colors mt-1.5">{subject.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-[var(--text-muted)] font-bold">{subject.teacherName}</td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Adicionar Membro */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={`border w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl flex flex-col gap-6 transition-all duration-300 ${
                isDarkMode ? 'bg-[var(--bg-card)] border-[var(--border)]' : 'bg-white border-zinc-200 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-bold font-display ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Adicionar Novo Membro</h3>
                <button 
                  onClick={() => setIsMemberModalOpen(false)}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode ? 'text-[var(--text-muted)] hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Cargo / Função</label>
                  <div className={`flex gap-2 p-1 border rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-zinc-800/80 border-white/5' : 'bg-slate-100 border-zinc-200'
                  }`}>
                    <button 
                      type="button" 
                      onClick={() => setMemberRole('teacher')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        memberRole === 'teacher' ? 'bg-orange-600 text-white shadow-lg' : (isDarkMode ? 'text-[var(--text-muted)] hover:text-white' : 'text-zinc-500 hover:text-zinc-900')
                      }`}
                    >
                      Professor
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMemberRole('student')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        memberRole === 'student' ? 'bg-orange-600 text-white shadow-lg' : (isDarkMode ? 'text-[var(--text-muted)] hover:text-white' : 'text-zinc-500 hover:text-zinc-900')
                      }`}
                    >
                      Aluno
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Ex: Ana Clara Lima"
                    className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all ${
                      isDarkMode ? 'bg-zinc-900 border-[var(--border)] text-white placeholder:text-zinc-600' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">E-mail Acadêmico</label>
                  <input 
                    type="email" 
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="Ex: ana.clara@escola.com"
                    className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all ${
                      isDarkMode ? 'bg-zinc-900 border-[var(--border)] text-white placeholder:text-zinc-600' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                {memberRole === 'student' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text-muted)]">Vincular à Turma</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 appearance-none font-medium transition-all ${
                          isDarkMode ? 'bg-black/20 border-[var(--border)] text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                        }`}
                        required
                      >
                        <option value="">Selecione uma turma</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={18} />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsMemberModalOpen(false)}
                    className={`flex-1 py-3.5 border rounded-xl text-xs font-bold transition-all text-center ${
                      isDarkMode ? 'border-[var(--border)] text-[var(--text-muted)] hover:bg-white/5' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 py-3.5 sidebar-grad text-white rounded-xl text-xs font-extrabold shadow-lg shadow-orange-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-center disabled:opacity-50"
                  >
                    {isLoading ? 'Cadastrando...' : 'Confirmar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Criar Disciplina */}
      <AnimatePresence>
        {isSubjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubjectModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={`border w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl flex flex-col gap-6 transition-all duration-300 ${
                isDarkMode ? 'bg-[var(--bg-card)] border-[var(--border)]' : 'bg-white border-zinc-200 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-bold font-display ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Criar Nova Disciplina</h3>
                <button 
                  onClick={() => setIsSubjectModalOpen(false)}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode ? 'text-[var(--text-muted)] hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Código da Matéria</label>
                  <input 
                    type="text" 
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Ex: PROG-202"
                    className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all uppercase ${
                      isDarkMode ? 'bg-zinc-900 border-[var(--border)] text-white placeholder:text-zinc-600' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Nome da Disciplina</label>
                  <input 
                    type="text" 
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Ex: Introdução à Programação Orientada a Objetos"
                    className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all ${
                      isDarkMode ? 'bg-zinc-900 border-[var(--border)] text-white placeholder:text-zinc-600' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Atribuir Professor Responsável</label>
                  <div className="relative">
                    <select 
                      value={subjectTeacherId}
                      onChange={(e) => setSubjectTeacherId(e.target.value)}
                      className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none pr-10 ${
                        isDarkMode ? 'bg-zinc-900 border-[var(--border)] text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                      }`}
                    >
                      <option value="">Selecione um professor...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsSubjectModalOpen(false)}
                    className={`flex-1 py-3.5 border rounded-xl text-xs font-bold transition-all text-center ${
                      isDarkMode ? 'border-[var(--border)] text-[var(--text-muted)] hover:bg-white/5' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3.5 sidebar-grad text-white rounded-xl text-xs font-extrabold shadow-lg shadow-orange-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
                  >
                    Criar Disciplina
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!memberToDelete}
        title="Remover Membro"
        message={`Tem certeza que deseja remover permanentemente o membro "${memberToDelete?.name}"? Esta ação não poderá ser desfeita e todas as atividades ou matrículas associadas serão perdidas.`}
        confirmText="Sim, remover membro"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDeleteMember}
        onClose={() => setMemberToDelete(null)}
      />
    </div>
  );
}
