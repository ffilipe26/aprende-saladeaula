import { AuthUser, Subject, Activity } from '../types';

export const mockUser: AuthUser = {
  id: 'student-demo-id',
  name: 'Aluno',
  email: 'aluno@faculdadereceba.com.br',
  role: 'student',
  schoolName: 'Faculdade Receba',
  schoolType: 'faculdade',
};

export const mockSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: 'Língua Portuguesa',
    code: 'POR-101',
    teacherName: 'Profª. Ana Paula',
  },
  {
    id: 'sub-2',
    name: 'Matemática Aplicada',
    code: 'MAT-201',
    teacherName: 'Prof. Ricardo Santos',
  },
  {
    id: 'sub-3',
    name: 'História Geral',
    code: 'HIS-102',
    teacherName: 'Prof. Marcos Vinicius',
  },
  {
    id: 'sub-4',
    name: 'Física Moderna',
    code: 'FIS-301',
    teacherName: 'Profª. Fernanda Lima',
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'act-1',
    subjectId: 'sub-1',
    subjectName: 'Língua Portuguesa',
    title: 'Atividade 01 — Interpretação de Texto e Sintaxe',
    instructions: 'Leia os enunciados com atenção e selecione a alternativa correta.',
    totalPoints: 10,
    deadlineDate: '2026-10-03T23:59:59Z',
    status: 'Pendente',
    type: 'Atividade',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Na oração "Os alunos entregaram os trabalhos com entusiasmo", o termo "com entusiasmo" classifica-se sintaticamente como:',
        points: 5,
        options: [
          'Adjunto Adverbial de Modo',
          'Adjunto Adnominal',
          'Objeto Indireto',
          'Complemento Nominal',
        ],
        correctAnswer: 'Adjunto Adverbial de Modo',
      },
      {
        id: 'q2',
        type: 'true_false',
        text: 'A palavra "paralelepípedo" é um exemplo clássico de palavra proparoxítona, e por regra da gramática normativa todas as proparoxítonas são acentuadas.',
        points: 5,
        options: ['Verdadeiro', 'Falso'],
        correctAnswer: 'Verdadeiro',
      },
    ],
  },
  {
    id: 'act-2',
    subjectId: 'sub-2',
    subjectName: 'Matemática Aplicada',
    title: 'Lista 02 — Funções de 1º Grau e Equações',
    instructions: 'Responda as questões sobre plano cartesiano e coeficientes lineares e angulares.',
    totalPoints: 10,
    deadlineDate: '2026-10-05T23:59:59Z',
    status: 'Pendente',
    type: 'Atividade',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Dada a função afim f(x) = 3x - 12, qual é a raiz (ou zero) dessa função?',
        points: 10,
        options: ['x = 4', 'x = -4', 'x = 3', 'x = 0'],
        correctAnswer: 'x = 4',
      },
    ],
  },
  {
    id: 'act-3',
    subjectId: 'sub-3',
    subjectName: 'História Geral',
    title: 'Simulado — A Era das Revoluções e Iluminismo',
    instructions: 'Avaliação sobre o impacto dos pensadores iluministas no mundo contemporâneo.',
    totalPoints: 10,
    deadlineDate: '2026-10-10T23:59:59Z',
    status: 'Pendente',
    type: 'Prova',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Qual filósofo iluminista francês ficou célebre pela formulação da teoria da separação dos Três Poderes (Executivo, Legislativo e Judiciário)?',
        points: 10,
        options: ['Montesquieu', 'Voltaire', 'Jean-Jacques Rousseau', 'John Locke'],
        correctAnswer: 'Montesquieu',
      },
    ],
  },
  {
    id: 'act-4',
    subjectId: 'sub-4',
    subjectName: 'Física Moderna',
    title: 'Exercício 01 — Leis de Newton e Movimento Uniforme',
    instructions: 'Atividade entregue no prazo com pontuação máxima.',
    totalPoints: 10,
    deadlineDate: '2026-09-20T23:59:59Z',
    status: 'Concluída',
    type: 'Atividade',
    userScore: 10,
    questions: [],
  },
];
