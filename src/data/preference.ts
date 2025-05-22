import type { Preference } from '../types/preference';

export const IMAGE_PREFERENCES: Preference[] = [
  { id: 1, name: '유화', imageUrl: '/assets/images/oil-painting.jpg' },
  { id: 2, name: '수채화', imageUrl: '/assets/images/watercolor.jpg' },
  {
    id: 3,
    name: '아크릴화',
    imageUrl: '/assets/images/acrylic-painting.jpg',
  },
  { id: 4, name: '수묵화', imageUrl: '/assets/images/ink-painting.jpg' },
  { id: 5, name: '채색화', imageUrl: '/assets/images/color-painting.jpg' },
  { id: 6, name: '벽화', imageUrl: '/assets/images/wall-painting.jpg' },
  { id: 7, name: '판화', imageUrl: '/assets/images/art-printing.jpg' },
  {
    id: 8,
    name: '추상화',
    imageUrl: '/assets/images/abstract-painting.jpg',
  },
  {
    id: 9,
    name: '콜라주',
    imageUrl: '/assets/images/collage-painting.jpg',
  },
];

export const MUSIC_PREFERENCES: Preference[] = [
  { id: 1, name: '발라드', imageUrl: '/assets/images/ballade.jpg' },
  { id: 2, name: '댄스/팝', imageUrl: '/assets/images/dance.jpg' },
  {
    id: 3,
    name: '어쿠스틱',
    imageUrl: '/assets/images/acoustic.jpg',
  },
  { id: 4, name: '아이돌', imageUrl: '/assets/images/idol.jpg' },
  { id: 5, name: '랩/힙합', imageUrl: '/assets/images/rap.jpg' },
  { id: 6, name: '알앤비/소울', imageUrl: '/assets/images/r&b.jpg' },
  { id: 7, name: '락/메탈', imageUrl: '/assets/images/rock.jpg' },
  { id: 8, name: '재즈', imageUrl: '/assets/images/jazz.jpg' },
  { id: 9, name: '인디', imageUrl: '/assets/images/indie.jpg' },
];
