/**
 * Licensed demo photography (Pexels License – free to use, attribution not required but recorded).
 * Every URL is hot-linked from images.pexels.com. Frontend builds responsive sizes by changing ?w= & ?h=.
 * Photos are STOCK images used to illustrate FICTIONAL demo projects – they are not the studio's completed work.
 */
export interface ImageRef {
  url: string;
  alt: string;
  width: number;
  height: number;
  attribution: { creator: string; source: string; sourceUrl: string; license: string };
}

const CREATORS: Record<number, string> = {
  38800611: 'artdjartem',
  32791637: 'Pușcaș Adryan',
  29631653: 'Pușcaș Adryan',
  6447384: 'Max Vakhtbovych',
  7045358: 'Max Vakhtbovych',
  6284232: 'Max Vakhtbovych',
  7214332: 'Max Vakhtbovych',
  6758534: 'Max Vakhtbovych',
  20036481: 'Ahmed Khaled',
  26571206: 'Athenea Codjambassis Rossitto',
  2082093: 'Dmitry Zvolskiy',
  8251914: 'PNW Production',
  38197473: 'Roy Serafin',
  36199038: 'Hale Ş',
  33393712: 'Usman Abdulrasheed Gambo',
  37293743: 'Hilal Bülbül',
  34165409: 'Maks057Kh',
  13203190: 'Bilal Mansuri',
  34573691: 'Marina Zvada',
  9617366: 'Ron Lach',
  6614757: 'Tima Miroshnichenko',
};

export const photoBase = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

/** Landscape (1600×1000) by default; pass w/h for portrait crops. */
export function img(id: number, alt: string, w = 1600, h = 1000): ImageRef {
  return {
    url: photoBase(id),
    alt,
    width: w,
    height: h,
    attribution: {
      creator: CREATORS[id] ?? 'Pexels contributor',
      source: 'Pexels',
      sourceUrl: `https://www.pexels.com/photo/${id}/`,
      license: 'Pexels License (free to use) – stock photo illustrating a fictional demo project',
    },
  };
}

/** Machine-readable list used to generate docs/IMAGE_CREDITS.md */
export const ALL_PHOTO_IDS = [
  5570222, 26732551, 6186813, 6436746, 2440471, 38800611, 32791637, 6447384, 20036481, 26571206, 7045358, 6284232, 7214332, 2082093, 8251914, 6758534,
  29631653, 27924620, 17264519, 28999491, 35215413, 18426842, 38197473, 13369919, 33393712, 36631699, 37293743, 13041118, 34165409, 13203190, 30484316,
  19574410, 38579646, 34573691, 9617366, 6614757,
];
export const creatorOf = (id: number) => CREATORS[id] ?? 'Pexels contributor';
