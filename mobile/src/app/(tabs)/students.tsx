import { UserListScreen } from '@/features/users/UserListScreen';

/** Listagem paginada de alunos (apenas professores logados). */
export default function StudentsScreen() {
  return <UserListScreen role="student" />;
}
