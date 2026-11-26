'use client';

import { useState } from 'react';
import { img, srcSet } from '@/lib/img';

export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  const cur = images[i];
  return (
    <div>
      <div className="gallery-main">
        {cur && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(cur.url, 1000, 750)} srcSet={srcSet(cur.url, [600, 1000, 1400], 4 / 3)} sizes="(max-width: 1020px) 100vw, 50vw" alt={cur.alt || name} width={1000} height={750} />
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((im, k) => (
            <button key={im.url} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Image ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(im.url, 168, 128)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
