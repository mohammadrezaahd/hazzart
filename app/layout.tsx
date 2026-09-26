import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { HeaderComponent } from '@/components/Layouts';
import { fakeData } from '@/consts/fakeData';
import './globals.css';
import './cross-browser.css';

const alef = localFont({
  src: [
    { path: '../public/fonts/Alef-Regular.ttf', weight: '400' },
    { path: '../public/fonts/Alef-Bold.ttf', weight: '700' },
  ],
  variable: '--font-alef',
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ghazal Shafiei — Artist',
    template: '%s — Ghazal Shafiei',
  },
  description: fakeData.artist.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${alef.variable} ${inter.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <HeaderComponent />
        {children}
      </body>
    </html>
  );
}
