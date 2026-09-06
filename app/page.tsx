import { ArtbookReader } from '@/components/artbook/reader';
import { atlasBook } from './atlas-book';

export default function Home() {
  return <ArtbookReader book={atlasBook} />;
}
