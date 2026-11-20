import type { IconName } from '@/components/Button';
import type { Role } from '@/types';

/** Textos e caminhos de cada tipo de usuário — as telas de professores e alunos são as mesmas. */
export const ROLE_CONFIG: Record<
  Role,
  {
    singular: string;
    plural: string;
    article: 'o' | 'a';
    extraField: 'subject' | 'registration';
    extraLabel: string;
    extraPlaceholder: string;
    basePath: '/teachers' | '/students';
    icon: IconName;
  }
> = {
  teacher: {
    singular: 'professor',
    plural: 'professores',
    article: 'o',
    extraField: 'subject',
    extraLabel: 'Disciplina',
    extraPlaceholder: 'Ex.: Matemática',
    basePath: '/teachers',
    icon: 'school-outline',
  },
  student: {
    singular: 'aluno',
    plural: 'alunos',
    article: 'o',
    extraField: 'registration',
    extraLabel: 'Matrícula',
    extraPlaceholder: 'Ex.: 2026013',
    basePath: '/students',
    icon: 'people-outline',
  },
};

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
