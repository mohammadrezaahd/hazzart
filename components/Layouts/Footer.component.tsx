'use client';
import { useRef, useState } from 'react';
import { footerItems } from '@/consts/navigation';
import type { Medium, TableOrder } from '@/interfaces/Portfolio';
import { MediumPicker } from './MediumPicker';

interface Props {
  order: TableOrder;
  mediumId: string | null;
  mediums: Medium[];
  onOrderChange: (order: TableOrder) => void;
  onMediumChange: (id: string | null) => void;
}
export function FooterComponent({ order, mediumId, mediums, onOrderChange, onMediumChange }: Props) {
  const [open, setOpen] = useState(false);
  const mediumButton = useRef<HTMLButtonElement>(null);
  const activeIndex = footerItems.findIndex(item => item.id === (open || mediumId ? 'medium' : order));
  return <footer className="site-footer">
    <div className="footer-options" style={{ '--item-count': footerItems.length } as React.CSSProperties} aria-label="Arrange artwork">
      <span className="footer-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {footerItems.map((item, index) => <button key={item.id} type="button" ref={item.id === 'medium' ? mediumButton : undefined} aria-pressed={index === activeIndex} aria-haspopup={item.id === 'medium' ? 'dialog' : undefined} aria-expanded={item.id === 'medium' ? open : undefined} onClick={() => item.id === 'medium' ? setOpen(true) : onOrderChange(item.id)}>{item.label}</button>)}
    </div>
    <div className="footer-rule" />
    {open && <MediumPicker mediums={mediums} value={mediumId} onSelect={onMediumChange} onClose={() => { setOpen(false); mediumButton.current?.focus(); }} />}
  </footer>;
}
