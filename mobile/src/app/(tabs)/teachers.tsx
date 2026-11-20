import { UserListScreen } from '@/features/users/UserListScreen';

/** Listagem paginada de professores (apenas professores logados). */
export default function TeachersScreen() {
  return <UserListScreen role="teacher" />;
}
