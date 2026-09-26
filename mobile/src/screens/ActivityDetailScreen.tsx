import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Send
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Activity, Question } from '../types';

interface ActivityDetailScreenProps {
  activity: Activity;
  onBack: () => void;
  onFinishSubmission: (activityId: string, score: number) => void;
}

export default function ActivityDetailScreen({
  activity,
  onBack,
  onFinishSubmission,
}: ActivityDetailScreenProps) {
  // Mapa de respostas: { [questionId]: 'Opção selecionada' }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(activity.status === 'Concluída');
  const [earnedScore, setEarnedScore] = useState<number>(activity.userScore || 0);

  const handleSelectOption = (questionId: string, option: string) => {
    if (submitted) return; // Não permite alterar após envio
    setAnswers({
      ...answers,
      [questionId]: option,
    });
  };

  const handleSubmit = () => {
    const totalQuestions = activity.questions.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(`Você respondeu ${answeredCount} de ${totalQuestions} questões. Deseja enviar mesmo assim?`)) {
          processSubmission();
        }
      } else {
        Alert.alert(
          'Questões pendentes',
          `Você respondeu ${answeredCount} de ${totalQuestions} questões. Deseja enviar mesmo assim?`,
          [
            { text: 'Voltar e responder', style: 'cancel' },
            { text: 'Sim, enviar', onPress: () => processSubmission() },
          ]
        );
      }
    } else {
      processSubmission();
    }
  };

  const processSubmission = () => {
    // Calcular nota das questões objetivas
    let score = 0;
    activity.questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected && selected === q.correctAnswer) {
        score += q.points;
      }
    });

    setEarnedScore(score);
    setSubmitted(true);
    onFinishSubmission(activity.id, score);
  };

  return (
    <View style={styles.container}>
      {/* Header com Voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerType}>{activity.type.toUpperCase()}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{activity.title}</Text>
        </View>

        <View style={styles.headerPointsBadge}>
          <Text style={styles.headerPointsText}>{activity.totalPoints} pts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner de Status ou Prazo */}
        {submitted ? (
          <View style={styles.submittedBanner}>
            <View style={styles.bannerIconSuccess}>
              <CheckCircle2 size={24} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Atividade Concluída!</Text>
              <Text style={styles.bannerSubtitle}>
                Sua nota final calculada: <Text style={styles.bannerScore}>{earnedScore} / {activity.totalPoints} pontos</Text>
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <Clock size={18} color={colors.warning} />
            <Text style={styles.infoBannerText}>
              Prazo limite: <Text style={{ fontWeight: '800', color: colors.text }}>03 de Outubro às 23:59</Text>
            </Text>
          </View>
        )}

        {/* Instruções */}
        {activity.instructions ? (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>INSTRUÇÕES DO PROFESSOR</Text>
            <Text style={styles.instructionsText}>{activity.instructions}</Text>
          </View>
        ) : null}

        {/* Questões */}
        <Text style={styles.questionsHeader}>Questões ({activity.questions.length})</Text>

        {activity.questions.map((q, index) => {
          const selectedOption = answers[q.id];
          return (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.questionTop}>
                <View style={styles.questionIndexBadge}>
                  <Text style={styles.questionIndexText}>Questão {index + 1}</Text>
                </View>
                <Text style={styles.questionPoints}>{q.points} pontos</Text>
              </View>

              <Text style={styles.questionText}>{q.text}</Text>

              {/* Opções de Resposta */}
              <View style={styles.optionsList}>
                {q.options?.map((opt, optIdx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = submitted && opt === q.correctAnswer;
                  const isWrong = submitted && isSelected && opt !== q.correctAnswer;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                        isCorrect && styles.optionButtonCorrect,
                        isWrong && styles.optionButtonWrong,
                      ]}
                      onPress={() => handleSelectOption(q.id, opt)}
                      disabled={submitted}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                        isCorrect && styles.radioCircleCorrect,
                      ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        isCorrect && styles.optionTextCorrect,
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Barra Inferior com Botão Enviar */}
      {!submitted && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>ENVIAR ATIVIDADE</Text>
            <Send size={18} color={colors.black} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerType: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  headerPointsBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  headerPointsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.successLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 20,
  },
  bannerIconSuccess: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bannerScore: {
    color: colors.success,
    fontWeight: '900',
  },
  instructionsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  questionsHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  questionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionIndexBadge: {
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  questionPoints: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionButtonCorrect: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  optionButtonWrong: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioCircleCorrect: {
    borderColor: colors.success,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
