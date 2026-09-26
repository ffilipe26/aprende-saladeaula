import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  BookOpen, 
  Clock, 
  Award, 
  ChevronRight, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { AuthUser, Activity, Subject } from '../types';

interface HomeScreenProps {
  user: AuthUser;
  subjects: Subject[];
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onNavigateToActivities: () => void;
}

export default function HomeScreen({
  user,
  subjects,
  activities,
  onSelectActivity,
  onNavigateToActivities,
}: HomeScreenProps) {
  const pendingActivities = activities.filter((a) => a.status === 'Pendente');
  const completedActivities = activities.filter((a) => a.status === 'Concluída');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header com Boas-vindas */}
      <View style={styles.header}>
        <View>
          <View style={styles.schoolTag}>
            <Sparkles size={12} color={colors.primary} />
            <Text style={styles.schoolTagText}>{user.schoolName || 'Faculdade Receba'}</Text>
          </View>
          <Text style={styles.greetingTitle}>
            Olá, <Text style={styles.greetingName}>{user.name.split(' ')[0]}</Text> 👋
          </Text>
          <Text style={styles.greetingSubtitle}>Pronto para os estudos de hoje?</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {/* Cards de Métricas / Resumo */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
            <Clock size={18} color={colors.primary} />
          </View>
          <Text style={styles.statNumber}>{pendingActivities.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CheckCircle2 size={18} color={colors.success} />
          </View>
          <Text style={styles.statNumber}>{completedActivities.length}</Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Award size={18} color="#3b82f6" />
          </View>
          <Text style={styles.statNumber}>9.5</Text>
          <Text style={styles.statLabel}>Média Geral</Text>
        </View>
      </View>

      {/* Seção: Tarefas Prioritárias */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Próximas Entregas</Text>
        <TouchableOpacity onPress={onNavigateToActivities}>
          <Text style={styles.sectionLink}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {pendingActivities.length === 0 ? (
        <View style={styles.emptyCard}>
          <CheckCircle2 size={32} color={colors.success} />
          <Text style={styles.emptyTitle}>Tudo em dia!</Text>
          <Text style={styles.emptySubtitle}>Você não possui atividades pendentes no momento.</Text>
        </View>
      ) : (
        pendingActivities.slice(0, 3).map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.activityCard}
            onPress={() => onSelectActivity(act)}
            activeOpacity={0.8}
          >
            <View style={styles.activityHeader}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{act.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.pointsBadge}>{act.totalPoints} pts</Text>
            </View>

            <Text style={styles.activityTitle}>{act.title}</Text>
            <Text style={styles.activitySubject}>{act.subjectName || 'Disciplina'}</Text>

            <View style={styles.activityFooter}>
              <View style={styles.deadlineBadge}>
                <Calendar size={13} color={colors.warning} />
                <Text style={styles.deadlineText}>Prazo: 03/10 às 23:59</Text>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Seção: Minhas Disciplinas */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Text style={styles.sectionTitle}>Minhas Disciplinas</Text>
        <Text style={styles.subjectCount}>{subjects.length} ativas</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
        {subjects.map((sub) => (
          <View key={sub.id} style={styles.subjectCard}>
            <View style={styles.subjectIcon}>
              <BookOpen size={20} color={colors.primary} />
            </View>
            <Text style={styles.subjectCode}>{sub.code}</Text>
            <Text style={styles.subjectName} numberOfLines={2}>
              {sub.name}
            </Text>
            <Text style={styles.teacherName}>{sub.teacherName || 'Prof. Responsável'}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  schoolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  schoolTagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
  },
  greetingName: {
    color: colors.primary,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  subjectCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  activitySubject: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  subjectsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  subjectCard: {
    width: 170,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectCode: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    lineHeight: 18,
    minHeight: 36,
  },
  teacherName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
