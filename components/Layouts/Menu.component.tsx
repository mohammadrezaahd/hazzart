'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { navigationItems } from '@/consts/navigation';
import { useAnimatedDialog } from '@/hooks/useAnimatedDialog';
import { useRef } from 'react';

export function MenuComponent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const destination = useRef<string | null>(null);
  const { ref, close } = useAnimatedDialog(() => { onClose(); if (destination.current) router.push(destination.current); });
  return <dialog ref={ref} className="mobile-menu" aria-label="Main navigation" onCancel={event => { event.preventDefault(); close(); }}>
    <button type="button" className="close-button" aria-label="Close menu" onClick={close}><Image src="/icons/close.svg" width={32} height={32} alt="" /></button>
    <nav aria-label="Mobile navigation">
      {navigationItems.map((item, index) => {
        const isActive = item.href !== '/' && pathname === item.href;
        return <Link
          key={item.id}
          href={item.href}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
          style={{ animationDelay: `${index * 40}ms` }}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); destination.current = item.href; close();
          }}
        >{item.icon ? <Image src={item.icon} width={82} height={56} alt="" /> : item.label}</Link>;
      })}
    </nav>
  </dialog>;
}
