export interface NavItem {
  id: string;
  label: string;
  href: string;
  index: string;
}

export interface EditorialFilm {
  id: string;
  number: string;
  title: string;
  originalTitle: string;
  year: string;
  director: string;
  caption: string;
  imageUrl: string;
  imageAlt: string;
  aspect: 'portrait' | 'landscape' | 'wide';
  fallbackTheme: 'edward' | 'midnight' | 'amelie';
  frameCode: string;
}

export interface MoodDirection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  filmsHint: string;
  accentNote: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'journal', label: 'Журнал', href: '#journal', index: '01' },
  { id: 'catalog', label: 'Каталог', href: '#catalog', index: '02' },
  { id: 'library', label: 'Моя кинотека', href: '#moods', index: '03' },
];

export const HERO_DATA = {
  sectionIndex: '001',
  rubric: 'РЕДАКЦИОННЫЙ МАНИФЕСТ / ВЫПУСК № 01',
  titleFirstLine: 'Не просто смотреть.',
  titleAccentLine: 'Чувствовать.',
  description:
    'Независимый цифровой журнал об авторском и атмосферном кинематографе. Мы собираем фильмы не по сухим рейтингам, а по оттенкам света, тишине между репликами и тому состоянию, которое остаётся с вами после финальных титров.',
  editorialNote:
    'От камерных ретроспектив до будущей личной кинотеки — пространство для вдумчивого зрителя.',
  imageUrl:
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=85',
  imageAlt: 'Свет кинопроектора в полумраке классического зала',
  imageCaption:
    'Илл. 01 — Свет в тёмном зале как начало личного диалога с экраном. 35 мм, тёплая зернистость.',
  frameCode: 'KODAK 2383 // КАДР 014-A',
};

export const EDITORIAL_PICKS: EditorialFilm[] = [
  {
    id: 'edward-scissorhands',
    number: '01',
    title: 'Эдвард руки-ножницы',
    originalTitle: 'Edward Scissorhands',
    year: '1990',
    director: 'Тим Бёртон',
    caption:
      'Хрупкая зимняя готика о нежности, обречённой на одиночество среди пастельных пригородных газонов и бумажных снежинок.',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Готический силуэт и падающий снег в сумерках — Эдвард руки-ножницы',
    aspect: 'portrait',
    fallbackTheme: 'edward',
    frameCode: '35MM // 1.85:1',
  },
  {
    id: 'midnight-in-paris',
    number: '02',
    title: 'Полночь в Париже',
    originalTitle: 'Midnight in Paris',
    year: '2011',
    director: 'Вуди Аллен',
    caption:
      'Тёплый золотой свет мокрых бульваров, запах старой бумаги и вечная тоска по эпохе, в которой мы никогда не жили.',
    imageUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
    imageAlt: 'Вечерний Париж в тёплом свете уличных фонарей — Полночь в Париже',
    aspect: 'landscape',
    fallbackTheme: 'midnight',
    frameCode: '35MM // 1.85:1',
  },
  {
    id: 'amelie',
    number: '03',
    title: 'Амели',
    originalTitle: 'Le Fabuleux Destin d’Amélie Poulain',
    year: '2001',
    director: 'Жан-Пьер Жене',
    caption:
      'Поэзия мелких деталей на Монмартре: хруст карамельной корочки, забытая жестяная шкатулка и тихое чудо посреди будней.',
    imageUrl:
      'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Уютное парижское кафе и тёплые изумрудно-красные тона — Амели',
    aspect: 'portrait',
    fallbackTheme: 'amelie',
    frameCode: '35MM // 2.35:1',
  },
];

export const MOOD_DIRECTIONS: MoodDirection[] = [
  {
    id: 'strange-beauty',
    number: '01',
    title: 'Красота странного',
    subtitle: 'Поэтика инаковости и визуальных миров',
    description:
      'Фильмы с причудливой оптикой, симметрией и героями, которые не вписываются в привычный порядок вещей, но создают собственную гармонию.',
    filmsHint: 'Бёртон · Андерсон · Лантимос',
    accentNote: 'Эстетика детали',
  },
  {
    id: 'night-city',
    number: '02',
    title: 'Ночной город',
    subtitle: 'Огни витрин, такси и случайные разговоры',
    description:
      'Кинематограф полуночных прогулок, неоновых отражений на мокром асфальте и ощущения, что после полуночи время течёт по другим законам.',
    filmsHint: 'Карвай · Джармуш · Аллен',
    accentNote: 'Свет и тень',
  },
  {
    id: 'quiet-melancholy',
    number: '03',
    title: 'Тихая меланхолия',
    subtitle: 'Созерцательность и светлая грусть',
    description:
      'Неспешные истории о памяти, ускользающих мгновениях и невысказанных словах — когда пауза в диалоге говорит больше любого монолога.',
    filmsHint: 'Коппола · Корэ-эда · Соррентино',
    accentNote: 'Длинное дыхание',
  },
  {
    id: 'adult-fairytale',
    number: '04',
    title: 'Сказка для взрослых',
    subtitle: 'Магический реализм и тёплая ирония',
    description:
      'Картины, возвращающие способность удивляться: тонкая грань между вымыслом и реальностью, согревающая взгляд на повседневный мир.',
    filmsHint: 'Жене · Дель Торо · Гондри',
    accentNote: 'Хрупкое чудо',
  },
];
