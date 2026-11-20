import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { CommentRepository } from '../modules/comments/comment.repository.js';
import { PostRepository } from '../modules/posts/post.repository.js';
import { UserRepository, type UserRow } from '../modules/users/user.repository.js';
import { transaction, type Database } from './database.js';

/** Contas de demonstração (também documentadas no README). */
export const DEMO_ACCOUNTS = {
  teacher: { email: 'professor@edublog.com', password: 'prof123' },
  student: { email: 'aluno@edublog.com', password: 'aluno123' },
} as const;

const TEACHERS = [
  { name: 'Ana Souza', email: DEMO_ACCOUNTS.teacher.email, subject: 'Língua Portuguesa' },
  { name: 'Carlos Lima', email: 'carlos.lima@edublog.com', subject: 'Matemática' },
  { name: 'Beatriz Rocha', email: 'beatriz.rocha@edublog.com', subject: 'História' },
  { name: 'Diego Martins', email: 'diego.martins@edublog.com', subject: 'Física' },
  { name: 'Elisa Fernandes', email: 'elisa.fernandes@edublog.com', subject: 'Biologia' },
  { name: 'Fábio Nunes', email: 'fabio.nunes@edublog.com', subject: 'Geografia' },
  { name: 'Gabriela Teixeira', email: 'gabriela.teixeira@edublog.com', subject: 'Química' },
];

const STUDENTS = [
  { name: 'João Pereira', email: DEMO_ACCOUNTS.student.email, registration: '2026001' },
  { name: 'Mariana Alves', email: 'mariana.alves@edublog.com', registration: '2026002' },
  { name: 'Lucas Costa', email: 'lucas.costa@edublog.com', registration: '2026003' },
  { name: 'Juliana Mendes', email: 'juliana.mendes@edublog.com', registration: '2026004' },
  { name: 'Rafael Gomes', email: 'rafael.gomes@edublog.com', registration: '2026005' },
  { name: 'Larissa Barbosa', email: 'larissa.barbosa@edublog.com', registration: '2026006' },
  { name: 'Thiago Carvalho', email: 'thiago.carvalho@edublog.com', registration: '2026007' },
  { name: 'Camila Duarte', email: 'camila.duarte@edublog.com', registration: '2026008' },
  { name: 'Bruno Araújo', email: 'bruno.araujo@edublog.com', registration: '2026009' },
  { name: 'Letícia Moreira', email: 'leticia.moreira@edublog.com', registration: '2026010' },
  { name: 'Vinícius Ramos', email: 'vinicius.ramos@edublog.com', registration: '2026011' },
  { name: 'Isabela Freitas', email: 'isabela.freitas@edublog.com', registration: '2026012' },
];

/** [autor (índice em TEACHERS), título, conteúdo] — do mais antigo para o mais novo. */
const POSTS: [number, string, string][] = [
  [
    0,
    'Bem-vindos ao EduBlog!',
    'Este é o espaço oficial dos professores para compartilhar conteúdos, avisos e materiais de apoio com a turma.\n\nAqui vocês vão encontrar resumos das aulas, dicas de estudo, calendários e indicações de leitura. Usem a busca para encontrar rapidamente um assunto e não deixem de comentar quando tiverem dúvidas.\n\nBons estudos!',
  ],
  [
    1,
    'Frações no dia a dia: receitas e compras',
    'Frações aparecem o tempo todo fora da sala de aula. Quando uma receita pede 3/4 de xícara de farinha, ou quando uma loja oferece 1/3 de desconto, estamos usando frações.\n\nUm exercício simples: dobre uma receita que leva 2/3 de xícara de açúcar. Quanto você vai usar? Multiplique o numerador por 2 e simplifique: 4/3, ou seja, 1 xícara e 1/3.\n\nTraga na próxima aula um exemplo de fração que você encontrou em casa.',
  ],
  [
    2,
    'A Revolução Industrial e o mundo do trabalho',
    'A Revolução Industrial, iniciada na Inglaterra no século XVIII, transformou a forma de produzir e de viver. A máquina a vapor, as fábricas e as ferrovias mudaram cidades inteiras.\n\nCom ela vieram também jornadas exaustivas, trabalho infantil e o crescimento desordenado das cidades — fatores que deram origem aos primeiros movimentos operários e às leis trabalhistas.\n\nReflexão para o próximo encontro: que mudanças tecnológicas de hoje se parecem com as daquela época?',
  ],
  [
    3,
    'Por que o céu é azul?',
    'A luz do Sol parece branca, mas é formada por todas as cores. Ao atravessar a atmosfera, ela se choca com as moléculas de ar, que espalham muito mais as cores de comprimento de onda curto, como o azul.\n\nEsse fenômeno se chama espalhamento de Rayleigh. No fim da tarde, a luz percorre um caminho maior na atmosfera, o azul se espalha antes de chegar até nós e sobram os tons alaranjados e avermelhados do pôr do sol.',
  ],
  [
    4,
    'Fotossíntese explicada em 5 minutos',
    'A fotossíntese é o processo em que as plantas usam a luz do Sol, a água e o gás carbônico para produzir glicose e liberar oxigênio.\n\nEla acontece nos cloroplastos, graças à clorofila — o pigmento que dá a cor verde às folhas. A equação resumida é: 6 CO2 + 6 H2O + luz → C6H12O6 + 6 O2.\n\nSem fotossíntese não haveria oxigênio suficiente para respirarmos nem a base das cadeias alimentares.',
  ],
  [
    5,
    'Como ler mapas e escalas',
    'A escala indica quantas vezes a área real foi reduzida para caber no mapa. Em uma escala 1:100.000, cada 1 cm no papel representa 100.000 cm (ou 1 km) no terreno.\n\nPara calcular distâncias, meça com a régua e multiplique pelo valor da escala. Não se esqueça também da legenda, da orientação (rosa dos ventos) e do título — elementos essenciais de qualquer mapa.',
  ],
  [
    6,
    'Tabela periódica sem mistério',
    'A tabela periódica organiza os elementos químicos pelo número atômico. As linhas são os períodos e as colunas, os grupos ou famílias.\n\nElementos de um mesmo grupo têm propriedades parecidas: os metais alcalinos (grupo 1) reagem facilmente com a água, enquanto os gases nobres (grupo 18) quase não reagem.\n\nDica de estudo: em vez de decorar tudo, entenda a lógica das famílias e das camadas eletrônicas.',
  ],
  [
    0,
    'Dicas para uma boa redação no ENEM',
    'A redação do ENEM é dissertativo-argumentativa: você precisa defender um ponto de vista e apresentar uma proposta de intervenção para o problema.\n\nAlgumas dicas: leia com atenção a proposta e os textos motivadores; planeje antes de escrever (introdução, dois parágrafos de desenvolvimento e conclusão); use repertório sociocultural pertinente; e detalhe a proposta de intervenção com agente, ação, meio, finalidade e detalhamento.\n\nPratique uma redação por semana e peça correção!',
  ],
  [
    1,
    'Grupo de estudos de Matemática: inscrições abertas',
    'Estão abertas as inscrições para o grupo de estudos de Matemática, às terças e quintas, das 14h às 15h30, na sala 12.\n\nVamos revisar funções, geometria plana e resolver questões de vestibulares. A participação é gratuita e aberta a todas as turmas do ensino médio.\n\nInscreva-se com o professor Carlos até sexta-feira.',
  ],
  [
    3,
    'Energia renovável: debate em sala',
    'Na próxima aula faremos um debate sobre fontes de energia renováveis: solar, eólica, hidrelétrica e biomassa.\n\nCada grupo vai defender uma fonte, apresentando vantagens, desvantagens, impactos ambientais e custos. Pesquisem dados sobre a matriz energética brasileira — ela é uma das mais renováveis do mundo.\n\nTempo de apresentação: 5 minutos por grupo.',
  ],
  [
    0,
    'Leitura recomendada: Dom Casmurro',
    'Dom Casmurro, de Machado de Assis, é narrado por Bento Santiago, que conta sua história com Capitu e a dúvida que atravessa todo o livro: houve ou não traição?\n\nO grande trunfo do romance é o narrador não confiável. Ao ler, preste atenção em como Bentinho seleciona as lembranças e tenta convencer o leitor.\n\nVamos discutir os capítulos 1 a 30 na próxima semana.',
  ],
  [
    0,
    'Calendário de provas do bimestre',
    'Confira as datas das avaliações do bimestre:\n\n• Língua Portuguesa — 24/11\n• Matemática — 25/11\n• História e Geografia — 26/11\n• Física e Química — 27/11\n• Biologia — 28/11\n\nAs provas começam às 7h30. Tragam caneta azul ou preta e cheguem com 10 minutos de antecedência.',
  ],
];

/** [post (índice em POSTS), aluno (índice em STUDENTS), comentário] */
const COMMENTS: [number, number, string][] = [
  [0, 0, 'Que legal ter um blog da escola! Vou acompanhar sempre.'],
  [0, 1, 'Ótima iniciativa, professora!'],
  [1, 2, 'Nunca tinha pensado em frações na cozinha. Muito bom!'],
  [3, 3, 'Então é por isso que o pôr do sol é laranja! Adorei a explicação.'],
  [7, 0, 'Professora, a proposta de intervenção precisa ter todos os 5 elementos?'],
  [8, 4, 'Já fiz minha inscrição, nos vemos na terça!'],
  [11, 5, 'Obrigada pelo calendário!'],
];

const DAY = 24 * 60 * 60 * 1000;

/**
 * Apaga todos os dados e recria a base de demonstração.
 */
export function seedDatabase(db: Database): void {
  const users = new UserRepository(db);
  const posts = new PostRepository(db);
  const comments = new CommentRepository(db);

  const teacherHash = bcrypt.hashSync(DEMO_ACCOUNTS.teacher.password, config.bcryptRounds);
  const studentHash = bcrypt.hashSync(DEMO_ACCOUNTS.student.password, config.bcryptRounds);

  transaction(db, () => {
    db.exec('DELETE FROM comments; DELETE FROM posts; DELETE FROM users;');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('comments', 'posts', 'users');");

    const teachers: UserRow[] = TEACHERS.map((t) =>
      users.create({ ...t, role: 'teacher', passwordHash: teacherHash }),
    );
    const students: UserRow[] = STUDENTS.map((s) =>
      users.create({ ...s, role: 'student', passwordHash: studentHash }),
    );

    // Datas escalonadas: um post por dia até hoje.
    const start = Date.now() - POSTS.length * DAY;
    const createdPosts = POSTS.map(([teacherIndex, title, content], i) => {
      const teacher = teachers[teacherIndex];
      const createdAt = new Date(start + i * DAY).toISOString();
      return posts.create(
        { title, content, author: teacher.name, authorId: teacher.id },
        createdAt,
      );
    });

    COMMENTS.forEach(([postIndex, studentIndex, content], i) => {
      const post = createdPosts[postIndex];
      const student = students[studentIndex];
      const createdAt = new Date(Date.parse(post.createdAt) + (i + 1) * 60 * 60 * 1000).toISOString();
      comments.create(
        { postId: post.id, userId: student.id, authorName: student.name, content },
        createdAt,
      );
    });
  });
}
