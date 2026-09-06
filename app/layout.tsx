import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Valisar | A Living Atlas',
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg` },
  description: 'A guided, illustrated journey through Cody Wymore’s world of Valisar. Explore 28 maps and paintings, from pixel kingdoms to the mirrored sky.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
