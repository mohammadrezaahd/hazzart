'use client';
import { useAnimatedDialog } from '@/hooks/useAnimatedDialog';
import type { Medium } from '@/interfaces/Portfolio';
export function MediumPicker({ mediums, value, onSelect, onClose }: { mediums: Medium[]; value: string | null; onSelect: (value: string | null) => void; onClose: () => void }) {
  const { ref, close } = useAnimatedDialog(onClose);
  return <dialog ref={ref} className="medium-picker" aria-label="Filter by medium" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === ref.current) { const rect = ref.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
    <div className="medium-options">
      {[{ id: '', label: 'All' }, ...mediums].map(medium => <button type="button" key={medium.id} aria-pressed={(value ?? '') === medium.id} onClick={() => { onSelect(medium.id || null); close(); }}>{medium.label}</button>)}
    </div>
  </dialog>;
}
