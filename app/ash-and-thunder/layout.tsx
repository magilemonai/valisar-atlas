import type { Metadata } from 'next';
import './chronicle.css';

export const metadata: Metadata = {
  title: 'Valisar | Ash & Thunder',
  description:
    'The history section of Valisar’s Living Atlas: 24 illustrations of wars, cinematic battles, cataclysms and imagined conflicts. A world by Cody Wymore.',
};

export default function ChronicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="chronicle-theme">{children}</div>;
}
