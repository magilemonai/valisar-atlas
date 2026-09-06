import type { Artbook } from '@/components/artbook/types';
import { sitePath } from '@/lib/site-path';
import plates from './plates.json';
import acts from './acts.json';

export const chronicleBook: Artbook = {
  id: 'chronicle',
  title: 'Ash & Thunder',
  description: 'Wars, impossible battles, and the days the world gave way.',
  about: [
    'Enter Valisar’s history through twenty-four illustrations: catastrophe paintings, copperplate engravings, woven campaigns, pixel-art battles and visions of wars that may never come.',
    'Each spread follows Cody Wymore’s worldbuilding and campaign notes. The field notes distinguish the source record from artistic reconstruction. The final chapter ventures into imagined overseas conflicts and an unresolved omen.',
  ],
  chapters: acts.map((act, index) => ({
    id: `act-${index}`,
    roman: act.roman,
    label: act.short,
    title: act.title,
    description: act.intro,
    cover: plates.find((plate) => plate.act === index)!.id,
  })),
  spreads: plates.map((plate) => ({
    id: plate.id,
    chapter: plate.act,
    primary: plate.id,
    plates: [plate.id, ...plate.variants],
    title: plate.title,
    kicker: plate.place,
    paragraphs: [plate.line, plate.text],
    detail: plate.look,
    date: plate.date,
    record: plate.record,
    speculative:
      plate.record === 'Imagined conflict' || plate.record === 'Omen',
  })),
  plates: plates.map((plate, index) => ({
    id: plate.id,
    number: String(index + 1).padStart(2, '0'),
    hash: plate.id,
    title: plate.title,
    alt: plate.alt,
    image: sitePath(`art/conflicts/${plate.image}.webp`),
    thumbnail: sitePath(`art/conflicts/${plate.image}-thumb.webp`),
    style: plate.style,
    variantLabel: plate.style,
    place: plate.place,
    kind: plate.record,
    notes: [{ heading: 'From the record', text: plate.detail }],
    sources: plate.sources,
    chapter: plate.act,
    variants: plate.variants,
  })),
};
