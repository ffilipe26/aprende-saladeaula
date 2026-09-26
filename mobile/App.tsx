import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, BookOpen, User as UserIcon } from 'lucide-react-native';
import { colors } from './src/theme/colors';
import { AuthUser, Activity, Subject } from './src/types';
import { mockUser, mockSubjects, mockActivities } from './src/data/mockData';
import { supabase } from './src/lib/supabase';

// Telas
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import ActivityDetailScreen from './src/screens/ActivityDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type Tab = 'home' | 'activities' | 'profile';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Estados de dados da plataforma
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  // Tentar restaurar sessão do Supabase ao abrir o app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*, institutions(name, school_type)')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setCurrentUser({
                id: session.user.id,
                name: profile.name || 'Aluno',
                email: session.user.email || '',
                role: (profile.role as any) || 'student',
                schoolName: profile.institutions?.name || 'Faculdade Receba',
                schoolType: profile.institutions?.school_type || 'faculdade',
              });
            }
          });
      }
    });
  }, []);

  // Quando o aluno envia uma atividade, atualiza o status na hora
  const handleFinishSubmission = (activityId: string, score: number) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? { ...act, status: 'Concluída', userScore: score }
          : act
      )
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setCurrentUser(null);
    setSelectedActivity(null);
    setActiveTab('home');
  };

  // Se não estiver logado, exibe Tela de Login
  if (!currentUser) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={setCurrentUser} />
      </View>
    );
  }

  // Se selecionou uma atividade para responder, exibe Detalhes da Atividade
  if (selectedActivity) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ActivityDetailScreen
          activity={selectedActivity}
          onBack={() => setSelectedActivity(null)}
          onFinishSubmission={handleFinishSubmission}
        />
      </View>
    );
  }

  // Navegação Principal por Abas
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Conteúdo da Aba Ativa */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            user={currentUser}
            subjects={subjects}
            activities={activities}
            onSelectActivity={setSelectedActivity}
            onNavigateToActivities={() => setActiveTab('activities')}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesScreen
            activities={activities}
            subjects={subjects}
            onSelectActivity={setSelectedActivity}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen user={currentUser} onLogout={handleLogout} />
        )}
      </View>

      {/* Barra de Navegação Inferior (Bottom Tabs) */}
      <SafeAreaView style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <LayoutDashboard
              size={22}
              color={activeTab === 'home' ? colors.primary : colors.textDark}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'home' && styles.navLabelActive,
              ]}
            >
              Início
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('activities')}
            activeOpacity={0.7}
          >
            <BookOpen
              size={22}
              color={activeTab === 'activities' ? colors.primary : colors.textDark}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'activities' && styles.navLabelActive,
              ]}
            >
              Atividades
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <UserIcon
              size={22}
              color={activeTab === 'profile' ? colors.primary : colors.textDark}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'profile' && styles.navLabelActive,
              ]}
            >
              Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDark,
  },
  navLabelActive: {
    color: colors.primary,
  },
});
