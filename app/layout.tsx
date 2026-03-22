import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'NyayaMithran - Legal Aid Assistant',
  description: 'AI-powered legal aid assistant providing accessible justice for all',
  keywords: ['legal', 'ai', 'assistant', 'justice', 'rights', 'law'],
  authors: [{ name: 'NyayaMithran' }],
  openGraph: {
    title: 'NyayaMithran - Legal Aid Assistant',
    description: 'AI-powered legal aid assistant providing accessible justice for all',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F4C75',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-powered legal aid assistant providing accessible justice for all" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
