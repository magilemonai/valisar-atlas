import { Compass, Swords } from 'lucide-react';
import { sitePath } from '@/lib/site-path';

export function BookNavigation({
  current,
}: {
  current: 'atlas' | 'chronicle';
}) {
  return (
    <nav className="valisar-books" aria-label="Valisar collections">
      <a
        href={sitePath()}
        aria-current={current === 'atlas' ? 'page' : undefined}
      >
        <Compass size={16} aria-hidden="true" />
        <span>Living Atlas</span>
      </a>
      <a
        href={sitePath('ash-and-thunder/')}
        aria-current={current === 'chronicle' ? 'page' : undefined}
      >
        <Swords size={16} aria-hidden="true" />
        <span>Ash &amp; Thunder</span>
      </a>
    </nav>
  );
}
