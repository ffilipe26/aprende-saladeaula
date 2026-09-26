import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, GraduationCap, BookOpen } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { mockUser } from '../data/mockData';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*, institutions(name, school_type)')
          .eq('id', data.user.id)
          .single();

        const user: AuthUser = {
          id: data.user.id,
          name: profile?.name || 'Aluno',
          email: data.user.email || '',
          role: (profile?.role as any) || 'student',
          schoolName: profile?.institutions?.name || 'Faculdade Receba',
          schoolType: profile?.institutions?.school_type || 'faculdade',
        };

        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado na conexão.');
    } finally {
      setLoading(false);
    }
  };

  const [devNotice, setDevNotice] = useState(false);

  const handleQuickDemoLogin = () => {
    onLoginSuccess(mockUser);
  };

  const handleTeacherClick = () => {
    setDevNotice(true);
    setTimeout(() => setDevNotice(false), 3500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header com Logo Oficial */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandSubtitle}>Central do Aluno • Mobile</Text>
        </View>

        {/* Card do Formulário */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
          <Text style={styles.welcomeSubtitle}>Entre com as suas credenciais institucionais</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo E-mail */}
          <Text style={styles.label}>E-MAIL ACADÊMICO</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.textDark} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="seu.email@escola.com.br"
              placeholderTextColor={colors.textDark}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Campo Senha */}
          <Text style={styles.label}>SUA SENHA</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.textDark} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDark}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textMuted} />
              ) : (
                <Eye size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Botão Entrar Oficial */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>ENTRAR NO APRENDE+</Text>
                <ArrowRight size={18} color={colors.black} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CONTAS DEMO</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Grid de Contas Demo: Aluno vs Professor */}
          <View style={styles.demoGrid}>
            {/* Card Aluno */}
            <TouchableOpacity
              style={styles.demoCard}
              onPress={handleQuickDemoLogin}
              activeOpacity={0.8}
            >
              <View style={styles.demoIconStudent}>
                <GraduationCap size={22} color={colors.primary} />
              </View>
              <Text style={styles.demoCardTitle}>Aluno</Text>
              <View style={styles.demoActiveBadge}>
                <Text style={styles.demoActiveText}>Acessar</Text>
              </View>
            </TouchableOpacity>

            {/* Card Professor */}
            <TouchableOpacity
              style={[styles.demoCard, styles.demoCardDisabled]}
              onPress={handleTeacherClick}
              activeOpacity={0.7}
            >
              <View style={styles.demoIconTeacher}>
                <BookOpen size={20} color={colors.textDark} />
              </View>
              <Text style={[styles.demoCardTitle, { color: colors.textMuted }]}>Professor</Text>
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>DESENVOLVIMENTO</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Feedback se clicar no Professor */}
          {devNotice && (
            <View style={styles.devNoticeBox}>
              <Text style={styles.devNoticeText}>
                ⚠️ Módulo do Docente em desenvolvimento para a próxima entrega!
              </Text>
            </View>
          )}
        </View>

        {/* Rodapé */}
        <Text style={styles.footerText}>Aprende+ LMS • Versão Mobile 1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoImage: {
    width: 280,
    height: 130,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textDark,
    paddingHorizontal: 10,
    letterSpacing: 1,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  demoCard: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  demoCardDisabled: {
    borderColor: colors.border,
    opacity: 0.8,
  },
  demoIconStudent: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoIconTeacher: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  demoActiveBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoActiveText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.black,
  },
  devBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  devBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.warning,
    letterSpacing: 0.5,
  },
  devNoticeBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    alignItems: 'center',
  },
  devNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    textAlign: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 28,
  },
});
