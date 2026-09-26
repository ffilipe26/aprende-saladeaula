import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  User, 
  GraduationCap, 
  Mail, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  ChevronRight
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { AuthUser } from '../types';

interface ProfileScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const handleConfirmLogout = () => {
    onLogout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header com Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.roleBadge}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={styles.roleBadgeText}>ALUNO OFICIAL</Text>
        </View>
      </View>

      {/* Card Instituição */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>MINHA INSTITUIÇÃO</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Building2 size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{user.schoolName || 'Faculdade Receba'}</Text>
            <Text style={styles.infoSubtitle}>Ensino Superior • Semestre Letivo 2026/2</Text>
          </View>
        </View>
      </View>

      {/* Configurações & Informações */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>DADOS DO APLICATIVO</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingItemTitle}>Versão do Aplicativo</Text>
          <Text style={styles.settingItemValue}>1.0.0 (Expo SDK 57)</Text>
        </View>

        <View style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={styles.settingItemTitle}>Ambiente</Text>
          <Text style={[styles.settingItemValue, { color: colors.success }]}>Online (Supabase)</Text>
        </View>
      </View>

      {/* Botão Sair */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleConfirmLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Encerrar Sessão</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Aprende+ • Projeto Integrador 2026</Text>
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
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.cardSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  infoSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  settingItemValue: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    height: 52,
    marginTop: 10,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textDark,
    fontSize: 12,
    marginTop: 28,
    fontWeight: '500',
  },
});
