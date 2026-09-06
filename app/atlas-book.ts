import type { Artbook } from '@/components/artbook/types';
import { sitePath } from '@/lib/site-path';
import artworks from './artworks.json';
import { chapters, stops, plateLabels, worldPins } from './journey';

export const atlasBook: Artbook = {
  id: 'atlas',
  title: 'Living Atlas',
  description: 'Maps, places, spirits and stars from the world of Cody Wymore.',
  about: [
    'Trace Valisar through twenty-eight maps and paintings, from pixel kingdoms to the mirrored sky. The guided passages follow the continent, its towns, and the worlds beyond its familiar shores.',
    'The worldbuilding master document, campaign notes and embedded illustrations inform every plate. Continental maps follow Cody’s preferred early outline. The field notes distinguish recorded lore from artistic interpretation.',
  ],
  chapters,
  spreads: stops.map((stop) => ({
    id: stop.id,
    chapter: stop.chapter,
    primary: stop.plates[0],
    plates: stop.plates,
    title: stop.title,
    emphasis: stop.emphasis,
    kicker: stop.kicker,
    paragraphs: stop.paragraphs,
    detail: stop.detail,
    next: stop.next,
  })),
  plates: artworks.map((art) => {
    const stop = stops.find((item) => item.plates.includes(art.id))!;
    const filename = art.id === '28' ? '28-unwritten' : art.id;
    return {
      id: art.id,
      number: art.id,
      hash: `plate-${art.id}`,
      title: art.title.split(' · ')[0],
      subtitle: art.title.split(' · ').slice(1).join(' · '),
      alt: `${art.title}. ${art.kind} in ${art.style.toLowerCase()}.`,
      image: sitePath(`art/${filename}.webp`),
      thumbnail: sitePath(`art/${filename}-thumb.webp`),
      style: art.style,
      variantLabel: plateLabels[art.id],
      place: art.region,
      kind: art.kind,
      notes: [
        { heading: 'From the lore', text: art.lore },
        {
          heading: 'Where the artist fills the gaps',
          text: art.interpretation,
        },
      ],
      sources: art.sources,
      chapter: stop.chapter,
      variants: stop.plates.filter((id) => id !== art.id),
    };
  }),
  pins: worldPins.map((pin) => ({
    art: '01',
    label: pin.label,
    x: pin.x,
    y: pin.y,
    spread: pin.stop,
  })),
};
