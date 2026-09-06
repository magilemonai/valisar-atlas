'use client';
/* oxlint-disable next/no-img-element -- Both sizes are pre-optimized WebPs served directly by GitHub Pages. */
import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { ArtbookPlate } from './types';

export function PlateImage({
  plate,
  thumbnail = false,
  priority = false,
  allowRetry = true,
}: {
  plate: ArtbookPlate;
  thumbnail?: boolean;
  priority?: boolean;
  allowRetry?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const source = thumbnail ? plate.thumbnail : plate.image;
  useEffect(() => {
    // A preloaded or cached image can finish before React attaches its load handler.
    if (ref.current?.complete && ref.current.naturalWidth) setReady(true);
  }, [source, retry]);
  return (
    <div className={`reader-image ${ready ? 'loaded' : ''}`}>
      {!failed && (
        <img
          ref={ref}
          key={`${source}-${retry}`}
          src={`${source}${retry ? `?retry=${retry}` : ''}`}
          alt={plate.alt}
          width={thumbnail ? 420 : 1536}
          height={thumbnail ? 280 : 1024}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          draggable={false}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {failed && !allowRetry && (
        <span className="reader-thumbnail-missing" aria-hidden="true">
          <ImageOff size={18} />
        </span>
      )}
      {failed && allowRetry && (
        <output className="reader-image-error">
          <span>This artwork couldn’t load.</span>
          <button
            onClick={() => {
              setFailed(false);
              setReady(false);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </button>
        </output>
      )}
    </div>
  );
}
