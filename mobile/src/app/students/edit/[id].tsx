import { useLocalSearchParams } from 'expo-router';
import { UserFormScreen } from '@/features/users/UserFormScreen';

/** Página de edição de alunos. */
export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserFormScreen role="student" userId={Number(id)} />;
}
