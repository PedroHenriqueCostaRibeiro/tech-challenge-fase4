import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/types';

const post: Post = {
  id: 1,
  title: 'Fotossíntese explicada',
  content: 'A fotossíntese é o processo em que as plantas usam a luz do Sol.',
  author: 'Elisa Fernandes',
  authorId: 5,
  commentCount: 2,
  createdAt: '2026-11-10T12:00:00',
  updatedAt: '2026-11-10T12:00:00',
};

describe('PostCard', () => {
  it('mostra título, autor, descrição e abre o post ao tocar', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<PostCard post={post} onPress={onPress} />);

    expect(screen.getByText('Fotossíntese explicada')).toBeOnTheScreen();
    expect(screen.getByText('Elisa Fernandes')).toBeOnTheScreen();
    expect(screen.getByText(/A fotossíntese é o processo/)).toBeOnTheScreen();
    expect(screen.getByText('2 comentários')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Fotossíntese explicada, por Elisa Fernandes' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Button', () => {
  it('não dispara quando desabilitado', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button title="Salvar" onPress={onPress} disabled />);

    await user.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Pagination', () => {
  it('mostra a página atual e navega para a próxima', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(<Pagination page={1} totalPages={3} total={14} onChange={onChange} />);

    expect(screen.getByText('Página 1 de 3')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.press(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
