import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { 
  ClipboardList, 
  Calendar, 
  Award, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Filter
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Activity, Subject } from '../types';

interface ActivitiesScreenProps {
  activities: Activity[];
  subjects: Subject[];
  onSelectActivity: (activity: Activity) => void;
}

export default function ActivitiesScreen({
  activities,
  subjects,
  onSelectActivity,
}: ActivitiesScreenProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  const filteredActivities = activities.filter((act) => {
    const matchesTab = activeTab === 'pending' 
      ? act.status === 'Pendente' 
      : act.status === 'Concluída';

    const matchesSubject = selectedSubjectId === 'all' 
      ? true 
      : act.subjectId === selectedSubjectId;

    return matchesTab && matchesSubject;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Atividades e Provas</Text>
        <Text style={styles.subtitle}>Gerencie suas entregas e notas do semestre</Text>

        {/* Abas: Pendentes vs Concluídas */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
            onPress={() => setActiveTab('pending')}
            activeOpacity={0.8}
          >
            <Clock size={16} color={activeTab === 'pending' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pendentes ({activities.filter(a => a.status === 'Pendente').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
            onPress={() => setActiveTab('completed')}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={16} color={activeTab === 'completed' ? colors.success : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Concluídas ({activities.filter(a => a.status === 'Concluída').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtro por Disciplina (Pills) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedSubjectId === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedSubjectId('all')}
          >
            <Text style={[styles.filterPillText, selectedSubjectId === 'all' && styles.filterPillTextActive]}>
              Todas as Disciplinas
            </Text>
          </TouchableOpacity>

          {subjects.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[styles.filterPill, selectedSubjectId === sub.id && styles.filterPillActive]}
              onPress={() => setSelectedSubjectId(sub.id)}
            >
              <Text style={[styles.filterPillText, selectedSubjectId === sub.id && styles.filterPillTextActive]}>
                {sub.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Atividades */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={40} color={colors.textDark} />
            <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'pending' 
                ? 'Você não possui entregas pendentes para esse filtro!' 
                : 'Nenhuma atividade concluída ainda.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectActivity(item)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={[
                styles.typeTag,
                item.type === 'Prova' ? styles.typeTagExam : styles.typeTagActivity
              ]}>
                <Text style={[
                  styles.typeTagText,
                  item.type === 'Prova' ? styles.typeTagTextExam : styles.typeTagTextActivity
                ]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>

              {item.status === 'Concluída' ? (
                <View style={styles.scoreBadge}>
                  <Award size={14} color={colors.success} />
                  <Text style={styles.scoreText}>{item.userScore || item.totalPoints}/{item.totalPoints} pts</Text>
                </View>
              ) : (
                <Text style={styles.pointsText}>{item.totalPoints} pontos</Text>
              )}
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubject}>{item.subjectName || 'Disciplina'}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.footerDate}>
                <Calendar size={13} color={item.status === 'Concluída' ? colors.textDark : colors.warning} />
                <Text style={[
                  styles.footerDateText,
                  item.status === 'Concluída' && { color: colors.textDark }
                ]}>
                  {item.status === 'Concluída' ? 'Entregue no prazo' : 'Prazo: 03/10 às 23:59'}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <Text style={styles.actionText}>
                  {item.status === 'Concluída' ? 'Ver Resultado' : 'Responder'}
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagActivity: {
    backgroundColor: colors.cardSecondary,
  },
  typeTagExam: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeTagTextActivity: {
    color: colors.textMuted,
  },
  typeTagTextExam: {
    color: colors.danger,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  cardSubject: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});
