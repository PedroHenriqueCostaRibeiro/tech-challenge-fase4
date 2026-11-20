import { useLocalSearchParams } from 'expo-router';
import { PostFormScreen } from '@/features/posts/PostFormScreen';

/** Página de edição de postagens (apenas professores). Carrega os dados atuais do post. */
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostFormScreen postId={Number(id)} />;
}
