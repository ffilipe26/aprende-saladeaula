import { Activity, Exam, AuthUser, Subject, Lesson, SchoolMember, SchoolClass } from './types';

// ==========================================
// DADOS MOCK DE USUÁRIOS (para simular login)
// ==========================================
export const MOCK_USERS: AuthUser[] = [
  {
    id: 'admin-1',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@unifaculdade.edu.br',
    role: 'admin',
    schoolName: 'Uni Faculdade Metropolitana',
    schoolType: 'faculdade',
  },
  {
    id: 'teacher-1',
    name: 'Profa. Ana Lima',
    email: 'ana.lima@unifaculdade.edu.br',
    role: 'teacher',
    subjectIds: ['sub-1', 'sub-2'],
  },
  {
    id: 'student-1',
    name: 'Mateus Rodrigues',
    email: 'mateus.rodrigues@aluno.unifaculdade.edu.br',
    role: 'student',
    enrolledSubjectIds: ['sub-1', 'sub-3'],
  },
];

// ==========================================
// DADOS MOCK DE TURMAS
// ==========================================
export const MOCK_CLASSES: SchoolClass[] = [
  { id: 'class-1', name: 'Engenharia de Software - Turma A', shift: 'Manhã' },
  { id: 'class-2', name: 'Sistemas de Informação - Turma B', shift: 'Noite' },
];

// ==========================================
// DADOS MOCK DE DISCIPLINAS
// ==========================================
export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    classId: 'class-1',
    name: 'Cálculo Diferencial e Integral I',
    code: 'MAT-101',
    teacherId: 'teacher-1',
    teacherName: 'Profa. Ana Lima',
    studentIds: ['student-1', 'student-2', 'student-3'],
    color: 'orange',
  },
  {
    id: 'sub-2',
    classId: 'class-1',
    name: 'Algoritmos e Estruturas de Dados',
    code: 'CMP-201',
    teacherId: 'teacher-1',
    teacherName: 'Profa. Ana Lima',
    studentIds: ['student-2', 'student-4'],
    color: 'blue',
  },
  {
    id: 'sub-3',
    name: 'História das Civilizações',
    code: 'HIS-101',
    teacherId: 'teacher-2',
    teacherName: 'Prof. Ricardo Costa',
    studentIds: ['student-1', 'student-3', 'student-5'],
    color: 'purple',
  },
  {
    id: 'sub-4',
    classId: 'class-2',
    name: 'Física Geral II',
    code: 'FIS-202',
    teacherId: 'teacher-3',
    teacherName: 'Prof. Marcos Vieira',
    studentIds: ['student-2', 'student-4', 'student-5'],
    color: 'emerald',
  },
];

// ==========================================
// DADOS MOCK DE AULAS
// ==========================================
export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    subjectId: 'sub-1',
    subjectName: 'Cálculo Diferencial e Integral I',
    title: 'Introdução a Limites e Continuidade',
    description: 'Nesta aula, revisamos o conceito fundamental de limite de uma função, explorando exemplos práticos com gráficos e a definição épsilon-delta de forma intuitiva.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '48',
    thumbnail: 'https://img.youtube.com/vi/riXcZT2ICjA/maxresdefault.jpg',
  },
  {
    id: 'lesson-2',
    subjectId: 'sub-1',
    subjectName: 'Cálculo Diferencial e Integral I',
    title: 'Regras de Derivação — Parte 1',
    description: 'Cobrimos as regras da potência, produto, quociente e a regra da cadeia com exemplos resolvidos passo a passo. Trazer calculadora gráfica para a próxima aula.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=5yfh5cf4-0U',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '62',
    thumbnail: 'https://img.youtube.com/vi/5yfh5cf4-0U/maxresdefault.jpg',
  },
  {
    id: 'lesson-3',
    subjectId: 'sub-3',
    subjectName: 'História das Civilizações',
    title: 'Mesopotâmia — Berço da Civilização',
    description: 'Exploraremos a região entre o Tigre e o Eufrates, as primeiras formas de escrita cuneiforme, e a organização política das primeiras cidades-estado da história.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=sohXPx_XZ6Y',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '35',
    thumbnail: 'https://img.youtube.com/vi/sohXPx_XZ6Y/maxresdefault.jpg',
  },
];

// ==========================================
// DADOS MOCK DE MEMBROS DA ESCOLA
// ==========================================
export const MOCK_SCHOOL_MEMBERS: SchoolMember[] = [
  {
    id: 'teacher-1',
    name: 'Ana Lima',
    email: 'ana.lima@unifaculdade.edu.br',
    role: 'teacher',
    subjectIds: ['sub-1', 'sub-2'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'teacher-2',
    name: 'Ricardo Costa',
    email: 'ricardo.costa@unifaculdade.edu.br',
    role: 'teacher',
    subjectIds: ['sub-3'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'teacher-3',
    name: 'Marcos Vieira',
    email: 'marcos.vieira@unifaculdade.edu.br',
    role: 'teacher',
    subjectIds: ['sub-4'],
    status: 'inativo',
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-1',
    name: 'Mateus Rodrigues',
    email: 'mateus.rodrigues@aluno.unifaculdade.edu.br',
    role: 'student',
    subjectIds: ['sub-1', 'sub-3'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-2',
    name: 'Beatriz Santos',
    email: 'beatriz.santos@aluno.unifaculdade.edu.br',
    role: 'student',
    subjectIds: ['sub-1', 'sub-2', 'sub-4'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-3',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@aluno.unifaculdade.edu.br',
    role: 'student',
    subjectIds: ['sub-1', 'sub-3'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-4',
    name: 'Marina Ferreira',
    email: 'marina.ferreira@aluno.unifaculdade.edu.br',
    role: 'student',
    subjectIds: ['sub-2', 'sub-4'],
    status: 'ativo',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-5',
    name: 'Pedro Almeida',
    email: 'pedro.almeida@aluno.unifaculdade.edu.br',
    role: 'student',
    subjectIds: ['sub-3', 'sub-4'],
    status: 'inativo',
    joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ==========================================
// DADOS MOCK DE ATIVIDADES (existentes, expandidos)
// ==========================================
export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Introdução ao Cálculo Diferencial',
    subject: 'MAT-101',
    subjectId: 'sub-1',
    teacherId: 'teacher-1',
    deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pendente',
    totalPoints: 10,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Qual é o limite de f(x) = x² quando x tende a 2?',
        options: ['2', '4', '0', 'Infinito'],
        correctAnswer: ['4'],
        points: 5,
      },
      {
        id: 'q2',
        type: 'true_false',
        text: 'A derivada de uma constante é sempre zero.',
        correctAnswer: true,
        points: 5,
      },
    ],
  },
  {
    id: '2',
    title: 'História das Civilizações Antigas',
    subject: 'HIS-101',
    subjectId: 'sub-3',
    teacherId: 'teacher-2',
    deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pendente',
    totalPoints: 10,
    questions: [
      {
        id: 'h1',
        type: 'true_false',
        text: 'A Revolução Industrial começou na França no final do século XVIII.',
        correctAnswer: false,
        points: 10,
      },
    ],
  },
];

// ==========================================
// DADOS MOCK DE PROVAS (existentes)
// ==========================================
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'e1',
    title: 'Exame Final de Cálculo I',
    subject: 'MAT-101',
    subjectId: 'sub-1',
    teacherId: 'teacher-1',
    duration: '120',
    questionsCount: 20,
    deadlineDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    weight: '4.0',
    image: 'https://picsum.photos/seed/calc/800/400',
    status: 'Disponível',
    questions: [
      {
        id: 'eq1',
        type: 'multiple_choice',
        text: 'Qual é a derivada de f(x) = x²?',
        options: ['x', '2x', 'x²', '2'],
        correctAnswer: ['2x'],
        points: 1,
      },
    ],
  },
];
