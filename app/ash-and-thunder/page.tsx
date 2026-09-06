import { ArtbookReader } from '@/components/artbook/reader';
import { chronicleBook } from './chronicle-book';

export default function Chronicle() {
  return <ArtbookReader book={chronicleBook} />;
}
