import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, GraduationCap, BookOpen, TrendingUp, Plus, School, 
  ChevronRight, ChevronLeft, Building, UserPlus, X, Loader2
} from 'lucide-react';
import Header from '../components/layout/Header';
import { Subject, SchoolMember, Activity, Notification, SchoolClass, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { adminService } from '../lib/adminService';

interface AdminDashboardProps {
  currentUser: AuthUser | null;
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  schoolMembers: SchoolMember[];
  setSchoolMembers: React.Dispatch<React.SetStateAction<SchoolMember[]>>;
  activities: Activity[];
  userName: string;
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onProfileClick: () => void;
  onNavigate: (section: string) => void;
}

export default function AdminDashboard({
  currentUser, classes, setClasses, subjects, setSubjects, schoolMembers, setSchoolMembers,
  activities, userName, notifications, onRemoveNotification, onMarkAsRead, onProfileClick, onNavigate
}: AdminDashboardProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subjects' | 'students'>('subjects');

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isFlexibleEnrollmentModalOpen, setIsFlexibleEnrollmentModalOpen] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error', msg: string, data?: string } | null>(null);

  // Form states
  const [className, setClassName] = useState('');
  const [classShift, setClassShift] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Manhã');

  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subTeacherId, setSubTeacherId] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('Mudar@1234');

  const totalStudents = schoolMembers.filter(m => m.role === 'student').length;
  const totalTeachers = schoolMembers.filter(m => m.role === 'teacher').length;
  
  // A busca global agora é feita inteiramente pelo App.tsx no loadInstitutionData.
  // Não precisamos mais do fetchAdminData local pois ele estava sobrescrevendo
  // os dados com informações globais não filtradas.

  // ==========================================
  // AÇÕES COM O BANCO DE DADOS (SUPABASE REAL)
  // ==========================================
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    setModalFeedback(null);

    // 1. Tentar salvar no Supabase
    console.log('[CreateClass] institutionId =', currentUser.institutionId);
    const { data, error } = await supabase.from('classes').insert([{
      institution_id: currentUser.institutionId,
      name: className,
      shift: classShift,
      year: new Date().getFullYear().toString()
    }]).select().single();

    if (error) {
      console.error('[CreateClass] Supabase error:', error);
      setModalFeedback({ type: 'error', msg: `Erro ao salvar: ${error.message}` });
      setIsLoading(false);
      return;
    }

    const newId = data ? data.id : `class-${Date.now()}`;
    
    setClasses(prev => [...prev, { id: newId, name: className, shift: classShift }]);
    setIsLoading(false);
    setIsClassModalOpen(false);
    setClassName('');
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !currentUser) return;
    setIsLoading(true);
    setModalFeedback(null);

    const teacher = schoolMembers.find(m => m.id === subTeacherId);

    console.log('[CreateSubject] institutionId =', currentUser.institutionId, 'classId =', selectedClassId);
    const { data, error } = await supabase.from('subjects').insert([{
      institution_id: currentUser.institutionId,
      class_id: selectedClassId,
      teacher_id: subTeacherId || null,
      name: subName,
      code: subCode
    }]).select().single();

    if (error) {
      console.error('[CreateSubject] Supabase error:', error);
      setModalFeedback({ type: 'error', msg: `Erro ao salvar disciplina: ${error.message}` });
      setIsLoading(false);
      return;
    }

    const newId = data ? data.id : `sub-${Date.now()}`;
    
    // Auto-matricula todos os alunos desta turma na nova matéria
    const classStudents = schoolMembers.filter(m => m.classId === selectedClassId && m.role === 'student');
    const studentIds = classStudents.map(s => s.id);
    
    if (studentIds.length > 0 && data) {
      const enrollmentsToInsert = studentIds.map(sId => ({
        student_id: sId,
        subject_id: newId,
        class_id: selectedClassId
      }));
      await supabase.from('subject_enrollments').insert(enrollmentsToInsert);
    }

    setSubjects(prev => [...prev, {
      id: newId, classId: selectedClassId, name: subName, code: subCode,
      teacherId: subTeacherId, teacherName: teacher?.name || 'Sem professor atribuído',
      studentIds: studentIds, color: 'blue'
    }]);

    setIsLoading(false);
    setIsSubjectModalOpen(false);
    setSubName(''); setSubCode(''); setSubTeacherId('');
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !currentUser) return;
    setIsLoading(true);
    setModalFeedback(null);

    const instId = currentUser.institutionId; 
    if (!instId) return;

    const { user, error, tempPassword } = await adminService.createUser({
      name: studentName,
      email: studentEmail,
      role: 'student',
      institutionId: instId,
      password: studentPassword,
      classId: selectedClassId
    });

    if (error && !error.includes('auth')) {
      const classSubjects = subjects.filter(s => s.classId === selectedClassId).map(s => s.id);
      const newId = `student-${Date.now()}`;
      setSchoolMembers(prev => [...prev, {
        id: newId, name: studentName, email: studentEmail, role: 'student',
        subjectIds: classSubjects, status: 'ativo', joinedAt: new Date().toISOString(),
        classId: selectedClassId
      }]);
      setModalFeedback({ type: 'success', msg: `Aluno matriculado com a senha:`, data: studentPassword });
      setIsLoading(false);
      setStudentName(''); setStudentEmail(''); setStudentPassword('Mudar@1234');
      return;
    }

    if (user && tempPassword) {
      const classSubjects = subjects.filter(s => s.classId === selectedClassId);
      
      if (classSubjects.length > 0) {
        const enrollmentsToInsert = classSubjects.map(sub => ({
          student_id: user.id,
          subject_id: sub.id,
          class_id: selectedClassId
        }));
        await supabase.from('subject_enrollments').insert(enrollmentsToInsert);
        
        setSubjects(prev => prev.map(sub => 
          classSubjects.some(cs => cs.id === sub.id)
            ? { ...sub, studentIds: [...sub.studentIds, user.id] } 
            : sub
        ));
      }

      setSchoolMembers(prev => [...prev, {
        id: user.id, name: user.name, email: user.email, role: 'student',
        subjectIds: classSubjects.map(s => s.id), status: 'ativo', joinedAt: new Date().toISOString(),
        classId: selectedClassId
      }]);
      setModalFeedback({ type: 'success', msg: `Matriculado com sucesso! A senha provisória dele é:`, data: tempPassword });
    } else if (error) {
      setModalFeedback({ type: 'error', msg: error });
    }

    setIsLoading(false);
    setStudentName(''); setStudentEmail(''); setStudentPassword('Mudar@1234');
  };

  const handleChangeTeacher = async (subjectId: string, newTeacherId: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('subjects')
      .update({ teacher_id: newTeacherId || null })
      .eq('id', subjectId);
      
    if (!error) {
       setSubjects(prev => prev.map(s => s.id === subjectId ? { 
         ...s, 
         teacherId: newTeacherId, 
         teacherName: newTeacherId ? (schoolMembers.find(m => m.id === newTeacherId)?.name || 'Professor') : 'Sem Professor' 
       } : s));
    }
  };

  const handleToggleEnrollment = async (studentId: string, isEnrolled: boolean) => {
    if (!selectedSubjectId || !selectedClassId) return;
    setIsEnrolling(studentId);

    if (isEnrolled) {
      // Remove enrollment
      const { error } = await supabase
        .from('subject_enrollments')
        .delete()
        .eq('student_id', studentId)
        .eq('subject_id', selectedSubjectId);

      if (!error) {
        setSubjects(prev => prev.map(s => s.id === selectedSubjectId ? {
          ...s,
          studentIds: s.studentIds.filter(id => id !== studentId)
        } : s));
      } else {
        console.error('Erro ao desmatricular:', error);
      }
    } else {
      // Add enrollment
      const { error } = await supabase
        .from('subject_enrollments')
        .insert([{
          student_id: studentId,
          subject_id: selectedSubjectId,
          class_id: selectedClassId
        }]);

      if (!error) {
        setSubjects(prev => prev.map(s => s.id === selectedSubjectId ? {
          ...s,
          studentIds: [...s.studentIds, studentId]
        } : s));
      } else {
        console.error('Erro ao matricular:', error);
      }
    }
    setIsEnrolling(null);
  };

  const headerProps = { userName, notifications, onRemoveNotification, onMarkAsRead, onProfileClick };

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL DA DISCIPLINA
  // ==========================================
  if (selectedSubjectId) {
    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    if (!currentSubject) return null;
    
    // Alunos matriculados nesta disciplina específica
    const subjectStudents = schoolMembers.filter(m => m.role === 'student' && currentSubject.studentIds.includes(m.id));

    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-body)] text-white relative">
        <Header title="Gestão de Disciplina" {...headerProps} />
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedSubjectId(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-display font-extrabold mb-2">{currentSubject.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-400 font-medium bg-white/5 px-3 py-1 rounded-lg">Cód: {currentSubject.code}</span>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-zinc-400">Professor:</span>
                    <select 
                      value={currentSubject.teacherId || ''} 
                      onChange={(e) => handleChangeTeacher(currentSubject.id, e.target.value)}
                      className="bg-transparent text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="" className="bg-zinc-900">Sem Professor</option>
                      {schoolMembers.filter(m => m.role === 'teacher').map(t => (
                        <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <Users size={20} className="text-orange-500" /> Alunos Matriculados na Disciplina
                </h2>
                <button 
                  onClick={() => setIsFlexibleEnrollmentModalOpen(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <UserPlus size={16} /> Adicionar/Remover Alunos
                </button>
              </div>

              {subjectStudents.length === 0 ? (
                <div className="p-12 border border-white/10 border-dashed rounded-3xl text-center glass">
                  <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400 font-medium">Nenhum aluno matriculado nesta disciplina ainda.</p>
                </div>
              ) : (
                <div className="glass border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Nome</th>
                        <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">E-mail</th>
                        <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subjectStudents.map(student => (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold">{student.name}</td>
                          <td className="p-4 text-zinc-400">{student.email}</td>
                          <td className="p-4 text-right">
                            <button className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors">
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL: MATRÍCULA FLEXÍVEL */}
        {isFlexibleEnrollmentModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl max-h-[80vh] flex flex-col glass border border-white/10 rounded-[32px] p-8 relative">
              <button onClick={() => setIsFlexibleEnrollmentModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-2xl font-bold font-display mb-2">Matrícula Flexível</h2>
              <p className="text-zinc-400 text-sm mb-6">Adicione ou remova alunos desta disciplina. Alunos da mesma turma já são matriculados automaticamente.</p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {classes.map(cls => {
                  const classStudents = schoolMembers.filter(m => m.classId === cls.id && m.role === 'student');
                  if (classStudents.length === 0) return null;
                  return (
                    <div key={cls.id} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <h3 className="text-sm font-extrabold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <School size={16} /> {cls.name}
                      </h3>
                      <div className="space-y-2">
                        {classStudents.map(student => {
                          const isEnrolled = currentSubject.studentIds.includes(student.id);
                          return (
                            <div key={student.id} className="flex items-center justify-between p-3 glass rounded-xl">
                              <div>
                                <p className="font-bold text-sm">{student.name}</p>
                                <p className="text-xs text-zinc-400">{student.email}</p>
                              </div>
                              <button 
                                onClick={() => handleToggleEnrollment(student.id, isEnrolled)}
                                disabled={isEnrolling === student.id}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                                  isEnrolled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                }`}
                              >
                                {isEnrolling === student.id ? <Loader2 size={14} className="animate-spin" /> : (isEnrolled ? 'Remover' : 'Adicionar')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL DA TURMA
  // ==========================================
  if (selectedClassId) {
    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) return null;

    const classSubjects = subjects.filter(s => s.classId === selectedClassId);
    const classSubjectIds = classSubjects.map(s => s.id);
    const classStudents = schoolMembers.filter(m => 
      m.role === 'student' && m.classId === selectedClassId
    );
    const availableTeachers = schoolMembers.filter(m => m.role === 'teacher');

    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-body)] text-white relative">
        <Header title="Gestão da Instituição" {...headerProps} />
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedClassId(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h1 className="text-3xl font-display font-extrabold">{currentClass.name}</h1>
                  <p className="text-zinc-400 font-medium">Turno: {currentClass.shift}</p>
                </div>
              </div>
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button onClick={() => setActiveTab('subjects')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'subjects' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>Disciplinas</button>
                <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>Alunos Matriculados</button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'subjects' ? (
                <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <BookOpen size={20} className="text-orange-500" /> Grade Curricular
                    </h2>
                    <button onClick={() => setIsSubjectModalOpen(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                      <Plus size={16} /> Nova Disciplina
                    </button>
                  </div>
                  
                  {classSubjects.length === 0 ? (
                    <div className="p-12 border border-white/10 border-dashed rounded-3xl text-center glass">
                      <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                      <p className="text-zinc-400 font-medium">Nenhuma disciplina cadastrada nesta turma.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classSubjects.map(subject => (
                        <div key={subject.id} onClick={() => setSelectedSubjectId(subject.id)} className="p-5 glass border border-white/10 rounded-2xl hover:border-orange-500/30 transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                              <BookOpen size={18} className="text-orange-500" />
                            </div>
                            <span className="text-[10px] font-extrabold bg-white/5 px-2 py-1 rounded-lg text-zinc-400">{subject.code}</span>
                          </div>
                          <h3 className="font-extrabold text-lg mb-1">{subject.name}</h3>
                          <p className="text-sm text-zinc-400">Prof. {subject.teacherName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <Users size={20} className="text-orange-500" /> Alunos da Turma
                    </h2>
                    <button onClick={() => setIsStudentModalOpen(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-orange-600/20">
                      <UserPlus size={16} /> Matricular Aluno
                    </button>
                  </div>

                  {modalFeedback && activeTab === 'students' && (
                    <div className={`p-4 rounded-2xl border ${modalFeedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      <p className="font-bold text-sm text-center">
                        {modalFeedback.msg} {modalFeedback.data && <span className="px-2 py-1 bg-black/30 rounded-md font-mono text-white ml-2 select-all">{modalFeedback.data}</span>}
                      </p>
                    </div>
                  )}

                  {classStudents.length === 0 ? (
                    <div className="p-12 border border-white/10 border-dashed rounded-3xl text-center glass">
                      <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                      <p className="text-zinc-400 font-medium">Nenhum aluno matriculado nesta turma ainda.</p>
                    </div>
                  ) : (
                    <div className="glass border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Nome</th>
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">E-mail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {classStudents.map(student => (
                            <tr key={student.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-bold">{student.name}</td>
                              <td className="p-4 text-zinc-400">{student.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MODAL: NOVA DISCIPLINA */}
        {isSubjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass border border-white/10 rounded-[32px] p-8 relative">
              <button onClick={() => setIsSubjectModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-2xl font-bold font-display mb-6">Nova Disciplina</h2>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Nome da Disciplina</label>
                  <input type="text" required value={subName} onChange={e => setSubName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: Banco de Dados" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Código</label>
                  <input type="text" required value={subCode} onChange={e => setSubCode(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: COD-101" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Professor Responsável (Opcional)</label>
                  <select value={subTeacherId} onChange={e => setSubTeacherId(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none appearance-none">
                    <option value="">-- Selecione um Professor --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-4 rounded-2xl transition-all flex justify-center">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar Disciplina'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: MATRICULAR ALUNO */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass border border-white/10 rounded-[32px] p-8 relative">
              <button onClick={() => setIsStudentModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-2xl font-bold font-display mb-6">Matricular Novo Aluno</h2>
              <form onSubmit={handleEnrollStudent} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Nome do Aluno</label>
                  <input type="text" required value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: João da Silva" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">E-mail Institucional</label>
                  <input type="email" required value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: joao@instituicao.edu.br" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Senha Provisória (O aluno terá que mudar no 1º acesso)</label>
                  <input type="text" required value={studentPassword} onChange={e => setStudentPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: Mudar@1234" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-4 rounded-2xl transition-all flex justify-center">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Matricular e Gerar Senha'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VISÃO GERAL (LISTA DE TURMAS)
  // ==========================================
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-body)] text-white relative">
      <Header title="Painel da Instituição" {...headerProps} />

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div>
            <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2"><TrendingUp size={24} className="text-orange-500" /> Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={School} title="Turmas" value={classes.length} color="text-blue-500" bg="bg-blue-500/10" />
              <StatCard icon={BookOpen} title="Disciplinas" value={subjects.length} color="text-orange-500" bg="bg-orange-500/10" />
              <StatCard icon={GraduationCap} title="Professores" value={totalTeachers} color="text-purple-500" bg="bg-purple-500/10" />
              <StatCard icon={Users} title="Alunos" value={totalStudents} color="text-green-500" bg="bg-green-500/10" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display flex items-center gap-2"><Building size={24} className="text-orange-500" /> Gestão de Turmas</h2>
              <button onClick={() => setIsClassModalOpen(true)} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-extrabold transition-colors flex items-center gap-2 shadow-lg shadow-orange-600/20">
                <Plus size={18} /> Nova Turma
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="p-16 border border-white/10 border-dashed rounded-[32px] text-center glass">
                <School size={48} className="mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma turma cadastrada</h3>
                <p className="text-zinc-400 font-medium">Sua instituição está vazia. Comece criando a primeira turma para adicionar disciplinas e matricular alunos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                  <motion.div key={cls.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedClassId(cls.id)} className="p-6 glass border border-white/10 rounded-3xl cursor-pointer hover:border-orange-500/50 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                        <School size={24} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} className="text-orange-500" />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-extrabold font-display mb-1">{cls.name}</h3>
                      <p className="text-sm text-zinc-400 font-medium mb-6">Turno {cls.shift}</p>
                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <BookOpen size={14} />
                          <span className="text-xs font-bold">{subjects.filter(s => s.classId === cls.id).length} disciplinas</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NOVA TURMA */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass border border-white/10 rounded-[32px] p-8 relative">
            <button onClick={() => setIsClassModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white"><X size={20} /></button>
            <h2 className="text-2xl font-bold font-display mb-6">Criar Nova Turma</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Nome da Turma</label>
                <input type="text" required value={className} onChange={e => setClassName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none" placeholder="Ex: Engenharia Turma C" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Turno</label>
                <select value={classShift} onChange={e => setClassShift(e.target.value as any)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white focus:border-orange-500/50 outline-none appearance-none">
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading} className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-4 rounded-2xl transition-all flex justify-center">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Turma'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, bg }: any) {
  return (
    <div className="p-5 glass border border-white/10 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon size={24} className={color} /></div>
      <div><p className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest">{title}</p><p className="text-2xl font-display font-extrabold text-white leading-none mt-1">{value}</p></div>
    </div>
  );
}
