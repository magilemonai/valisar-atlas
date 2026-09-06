export type ArtbookPlate = {
  id: string;
  number: string;
  hash: string;
  title: string;
  subtitle?: string;
  alt: string;
  image: string;
  thumbnail: string;
  style: string;
  variantLabel: string;
  place: string;
  kind: string;
  notes: { heading: string; text: string }[];
  sources: string[];
  chapter: number;
  variants: string[];
};

export type ArtbookSpread = {
  id: string;
  chapter: number;
  primary: string;
  plates: string[];
  title: string;
  emphasis?: string;
  kicker: string;
  paragraphs: string[];
  detail?: string;
  date?: string;
  record?: string;
  speculative?: boolean;
  next?: string;
};

export type Artbook = {
  id: 'atlas' | 'chronicle';
  title: string;
  description: string;
  about: string[];
  chapters: {
    id: string;
    roman: string;
    label: string;
    title: string;
    description: string;
    cover: string;
  }[];
  spreads: ArtbookSpread[];
  plates: ArtbookPlate[];
  pins?: { art: string; label: string; x: number; y: number; spread: string }[];
};
