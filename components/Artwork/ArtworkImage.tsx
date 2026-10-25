import Image from 'next/image';
import type { Artwork } from '@/interfaces/Portfolio';

export function ArtworkImage({ artwork, priority = false, sizes, onLoad }: { artwork: Artwork; priority?: boolean; sizes: string; onLoad?: (width: number, height: number) => void }) {
  const { image } = artwork;
  return <span className={`artwork-image ${image.rotate ? 'artwork-image-rotated' : ''}`} style={{ transform: image.flipX ? 'scaleX(-1)' : undefined }}>
    <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} draggable={false} onLoad={event => onLoad?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} />
  </span>;
}
