import { Activity, Exam } from './types';

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Introdução ao Cálculo Diferencial',
    subject: 'MATEMÁTICA APLICADA',
    duration: '45',
    deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pendente',
    image: 'https://picsum.photos/seed/math/400/300',
    totalPoints: 10,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Qual é o limite de f(x) = x² quando x tende a 2?',
        options: ['2', '4', '0', 'Infinito'],
        correctAnswer: ['4'],
        points: 5
      },
      {
        id: 'q2',
        type: 'true_false',
        text: 'A derivada de uma constante é sempre zero.',
        correctAnswer: true,
        points: 5
      }
    ]
  },
  {
    id: '2',
    title: 'História das Civilizações Antigas',
    subject: 'HISTÓRIA GERAL',
    duration: '60',
    deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pendente',
    image: 'https://picsum.photos/seed/history/400/300',
    totalPoints: 10,
    questions: [
      {
        id: 'h1',
        type: 'true_false',
        text: 'A Revolução Industrial começou na França no final do século XVIII.',
        correctAnswer: false,
        points: 10
      }
    ]
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'e1',
    title: 'Exame Final de Cálculo I',
    subject: 'MATEMÁTICA APLICADA',
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
        points: 1
      }
    ]
  }
];
