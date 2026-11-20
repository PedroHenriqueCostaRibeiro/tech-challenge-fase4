import { useLocalSearchParams } from 'expo-router';
import { UserFormScreen } from '@/features/users/UserFormScreen';

/** Página de edição de professores. */
export default function EditTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserFormScreen role="teacher" userId={Number(id)} />;
}
