'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { navigationItems } from '@/consts/navigation';
import { fakeData } from '@/consts/fakeData';
import { MenuComponent } from './Menu.component';

export function HeaderComponent() {
  const pathname = usePathname();
  const [firstName, ...lastName] = fakeData.artist.name.split(' ');
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <Link href="/" className="artist-name" aria-label={`${fakeData.artist.name} — home`}>{firstName} <span>{lastName.join(' ')}</span></Link>
    <nav className="desktop-navigation" aria-label="Main navigation">
      {navigationItems.map(item => <Link key={item.id} href={item.href} aria-label={item.label} aria-current={pathname === item.href ? 'page' : undefined} className={item.icon ? 'table-link' : 'navigation-link'}>
        {item.icon ? <Image src={item.icon} alt="" width={45} height={31} /> : item.label}
      </Link>)}
    </nav>
    <button type="button" className="menu-toggle" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
      <Image src="/icons/menu.svg" width={32} height={32} alt="" />
    </button>
    {menuOpen && <MenuComponent onClose={() => setMenuOpen(false)} />}
  </header>;
}
