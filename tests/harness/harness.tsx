import { createRoot } from 'react-dom/client';
import { useRef } from 'react';
import { ReusableSlider } from '@/components/Slider';

const items = [
  { id: 'a', src: '/images/1.png' },
  { id: 'b', src: '/images/2.jpg' },
  { id: 'c', src: '/images/3.jpg' },
];

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<App />);
  return root;
}

function App() {
  const wheelRoot = useRef<HTMLElement | null>(null);
  return (
    <main className="projects-experience" ref={wheelRoot}>
      <ReusableSlider
        items={items}
        ariaLabel="Images"
        className="projects-slider"
        infinite={false}
        wheelRoot={wheelRoot}
        pagination={{ enabled: true, ariaLabel: 'Images', getLabel: item => item.id }}
        edgeOverflow={{ enabled: true, chargeWheelDistance: 560, releaseDelay: 1400 }}
        getItemId={item => item.id}
        getSlideAspectRatio={() => 0.75}
        getSlideA11yLabel={item => item.id}
        renderSlide={item => <span className="projects-piece" data-src={item.src} />}
      />
    </main>
  );
}
