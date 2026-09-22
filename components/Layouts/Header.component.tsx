'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/consts/navigation';
import { fakeData } from '@/consts/fakeData';
import { MenuComponent } from './Menu.component';

function NavigationIndicator() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  useLayoutEffect(() => {
    const calculate = () => {
      const nav = navRef.current;
      const activeIndex = navigationItems.findIndex(item => item.href === pathname);
      const activeItem = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;

      if (!nav || !activeItem) {
        setIndicator(prev => ({ ...prev, opacity: 0 }));
        return;
      }

      const navRect = nav.getBoundingClientRect();
      // Prefer inner <span> so the indicator matches the text glyph width exactly
      const target = (activeItem.querySelector('span') ?? activeItem);
      const targetRect = target.getBoundingClientRect();

      setIndicator({
        left: targetRect.left - navRect.left,
        width: targetRect.width,
        opacity: 1,
      });
    };

    calculate();
    document.fonts.ready.then(calculate);
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [pathname]);

  return <nav ref={navRef} className="desktop-navigation" aria-label="Main navigation">
    <div className="nav-indicator" aria-hidden="true" style={{ left: indicator.left, width: indicator.width, opacity: indicator.opacity }} />
    {navigationItems.map((item, index) => {
      const isActive = pathname === item.href;
      return <Link
        key={item.id}
        ref={node => { itemRefs.current[index] = node; }}
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={item.icon ? 'table-link' : 'navigation-link'}
      >
        {item.icon ? <Image src={item.icon} alt="" width={32} height={32} /> : <span>{item.label}</span>}
      </Link>;
    })}
  </nav>;
}

export function HeaderComponent() {
  const [firstName, ...lastName] = fakeData.artist.name.split(' ');
  const [menuOpen, setMenuOpen] = useState(false);

  return <header className="site-header">
    <Link href="/" className="artist-name" aria-label={`${fakeData.artist.name} — home`}>{firstName} <span>{lastName.join(' ')}</span></Link>
    <NavigationIndicator />
    <button type="button" className="menu-toggle" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
      <Image src="/icons/menu.svg" width={32} height={32} alt="" />
    </button>
    {menuOpen && <MenuComponent onClose={() => setMenuOpen(false)} />}
  </header>;
}
