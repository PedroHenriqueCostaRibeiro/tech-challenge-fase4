import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={typeof color === 'string' ? color : colors.textMuted} />;
  };
}

/**
 * Abas do app. Visitantes e alunos veem "Posts" e "Conta";
 * professores também veem a área administrativa, professores e alunos.
 */
export default function TabsLayout() {
  const { isTeacher, isAuthenticated } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Posts', headerTitle: 'EduBlog', tabBarIcon: icon('newspaper-outline') }}
      />

      <Tabs.Protected guard={isTeacher}>
        <Tabs.Screen
          name="admin"
          options={{ title: 'Admin', headerTitle: 'Administrar posts', tabBarIcon: icon('settings-outline') }}
        />
        <Tabs.Screen
          name="teachers"
          options={{ title: 'Professores', tabBarIcon: icon('school-outline') }}
        />
        <Tabs.Screen name="students" options={{ title: 'Alunos', tabBarIcon: icon('people-outline') }} />
      </Tabs.Protected>

      <Tabs.Screen
        name="account"
        options={{
          title: isAuthenticated ? 'Perfil' : 'Entrar',
          headerTitle: isAuthenticated ? 'Meu perfil' : 'Entrar',
          tabBarIcon: icon(isAuthenticated ? 'person-circle-outline' : 'log-in-outline'),
        }}
      />
    </Tabs>
  );
}
