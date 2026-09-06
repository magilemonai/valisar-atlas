'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Expand,
  Grid2X2,
  Info,
  Link2,
  MapPin,
  MoveHorizontal,
  RotateCcw,
  ScanLine,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { BookNavigation } from '@/components/book-navigation';
import { PlateImage } from './image';
import { boundPan, positionForHash, positionForPlate } from './navigation';
import type { Artbook, ArtbookPlate } from './types';

type OpenPanel =
  | 'chapters'
  | 'gallery'
  | 'notes'
  | 'viewer'
  | 'compare'
  | 'about'
  | null;
const number = (value: number) => String(value).padStart(2, '0');

function CloseDialog() {
  return (
    <DialogClose
      render={
        <Button
          className="reader-close"
          variant="ghost"
          size="icon"
          aria-label="Close view"
        />
      }
    >
      <X size={20} />
    </DialogClose>
  );
}

function FullPlate({ plate }: { plate: ArtbookPlate }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  function changeZoom(value: number) {
    setZoom(Math.max(1, Math.min(4, value)));
    setPan({ x: 0, y: 0 });
    drag.current = null;
  }
  function move(x: number, y: number) {
    const box = stage.current?.getBoundingClientRect();
    if (box) setPan(boundPan(box.width, box.height, zoom, x, y));
  }
  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      zoom === 1 ||
      drag.current ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: pan.x,
      startY: pan.y,
    };
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (current?.id === event.pointerId)
      move(
        current.startX + event.clientX - current.x,
        current.startY + event.clientY - current.y,
      );
  }
  return (
    <>
      <header className="reader-viewer-header">
        <div>
          <span className="reader-eyebrow">PLATE {plate.number}</span>
          <DialogTitle>{plate.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Use the zoom controls, then drag or focus the artwork and use arrow
            keys to pan. Escape closes the artwork.
          </DialogDescription>
        </div>
        <div className="reader-zoom-controls">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={zoom === 1}
            onClick={() => changeZoom(zoom - 0.5)}
          >
            <ZoomOut size={18} />
          </Button>
          <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            disabled={zoom === 4}
            onClick={() => changeZoom(zoom + 0.5)}
          >
            <ZoomIn size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset zoom and position"
            onClick={() => changeZoom(1)}
          >
            <RotateCcw size={17} />
          </Button>
          <CloseDialog />
        </div>
      </header>
      {/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- This bounded image application requires focus for its keyboard pan controls. */}
      <div
        className={`reader-zoom-stage ${zoom > 1 ? 'zoomed' : ''}`}
        ref={stage}
        role="application"
        aria-roledescription="zoomable artwork"
        aria-label="Artwork. Double-click to zoom; use arrow keys to pan when zoomed."
        tabIndex={0}
        onDoubleClick={() => changeZoom(zoom > 1 ? 1 : 2)}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          const offsets: Record<string, [number, number]> = {
            ArrowLeft: [80, 0],
            ArrowRight: [-80, 0],
            ArrowUp: [0, 80],
            ArrowDown: [0, -80],
          };
          const offset = offsets[event.key];
          if (zoom > 1 && offset) {
            event.preventDefault();
            move(pan.x + offset[0], pan.y + offset[1]);
          }
        }}
      >
        <div
          className="reader-zoom-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <PlateImage plate={plate} priority />
        </div>
      </div>
      {/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <footer className="reader-viewer-footer">
        <span>{plate.style}</span>
        <span>
          {zoom > 1
            ? 'Drag or use arrow keys to explore'
            : 'Double-click to zoom'}{' '}
          <i>·</i> Esc to close
        </span>
      </footer>
    </>
  );
}

function ComparePlates({
  first,
  second,
}: {
  first: ArtbookPlate;
  second: ArtbookPlate;
}) {
  const [split, setSplit] = useState(50);
  return (
    <>
      <header className="reader-modal-header">
        <div>
          <span className="reader-eyebrow">TWO INTERPRETATIONS</span>
          <DialogTitle>Compare styles</DialogTitle>
          <DialogDescription>
            Drag across the artwork, or use the arrow keys with the slider
            selected.
          </DialogDescription>
        </div>
        <CloseDialog />
      </header>
      <div className="reader-comparison">
        <div className="reader-compare-base">
          <PlateImage plate={second} priority allowRetry={false} />
        </div>
        <div
          className="reader-compare-overlay"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <PlateImage plate={first} priority allowRetry={false} />
        </div>
        <div
          className="reader-compare-line"
          style={{ left: `${split}%` }}
          aria-hidden="true"
        >
          <MoveHorizontal size={21} />
        </div>
        <input
          type="range"
          className="reader-compare-input"
          min={0}
          max={100}
          value={split}
          aria-label={`Reveal ${first.variantLabel} over ${second.variantLabel}`}
          aria-valuetext={`${split}% ${first.variantLabel}, ${100 - split}% ${second.variantLabel}`}
          onChange={(event) => setSplit(Number(event.target.value))}
        />
      </div>
      <div className="reader-compare-labels">
        <span>{first.variantLabel}</span>
        <span>{second.variantLabel}</span>
      </div>
    </>
  );
}

export function ArtbookReader({ book }: { book: Artbook }) {
  const [position, setPosition] = useState({
    index: 0,
    plateId: book.spreads[0].primary,
  });
  const [panel, setPanel] = useState<OpenPanel>(null);
  const [filter, setFilter] = useState(-1);
  const [pinsVisible, setPinsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const chapterRail = useRef<HTMLElement>(null);
  const { index, plateId } = position;
  const spread = book.spreads[index];
  const plate = book.plates.find((item) => item.id === plateId)!;
  const chapter = book.chapters[spread.chapter];
  const variants = [
    plate,
    ...plate.variants.map((id) => book.plates.find((item) => item.id === id)!),
  ];
  const orderedVariants = book.plates.filter((item) =>
    variants.some((variant) => variant.id === item.id),
  );
  const activePins = book.pins?.filter((pin) => pin.art === plate.id) || [];

  const go = useCallback(
    (next: number, id?: string, focus = true) => {
      if (next < 0 || next >= book.spreads.length) return;
      const nextPlate = book.plates.find(
        (item) => item.id === (id || book.spreads[next].primary),
      );
      if (!nextPlate) return;
      setPosition({ index: next, plateId: nextPlate.id });
      setPanel(null);
      setCopied(false);
      setCopyError(false);
      if (window.location.hash !== `#${nextPlate.hash}`)
        window.history.pushState(null, '', `#${nextPlate.hash}`);
      if (focus)
        requestAnimationFrame(() =>
          heading.current?.focus({ preventScroll: true }),
        );
      if (window.matchMedia('(max-width: 800px)').matches)
        window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [book],
  );
  const goPlate = (id: string) => go(positionForPlate(book, id), id);
  const goChapter = (chapterIndex: number) =>
    go(book.spreads.findIndex((item) => item.chapter === chapterIndex));
  const openGallery = () => {
    setFilter(-1);
    setPanel('gallery');
  };

  useEffect(() => {
    const sync = () => {
      setPosition(
        positionForHash(book, window.location.hash) || {
          index: 0,
          plateId: book.spreads[0].primary,
        },
      );
      setPanel(null);
      setCopied(false);
      setCopyError(false);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, [book]);

  useEffect(() => {
    document.title = `${plate.title} | Valisar: ${book.title}`;
    const next = book.spreads[index + 1];
    if (next) {
      const image = new Image();
      image.src = book.plates.find((item) => item.id === next.primary)!.image;
    }
    const keyboard = (event: KeyboardEvent) => {
      if (
        panel ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest(
          'input,textarea,select,[role="slider"],[role="tablist"]',
        ) ||
          event.target.isContentEditable)
      )
        return;
      const nextIndex =
        event.key === 'ArrowRight'
          ? index + 1
          : event.key === 'ArrowLeft'
            ? index - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? book.spreads.length - 1
                : null;
      if (nextIndex !== null) {
        event.preventDefault();
        go(nextIndex);
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [book, go, index, panel, plate.title]);

  useEffect(() => {
    const rail = chapterRail.current;
    const current = rail?.querySelector<HTMLButtonElement>(
      '[aria-current="step"]',
    );
    if (rail && current)
      rail.scrollTo({
        left:
          current.offsetLeft -
          rail.offsetLeft -
          (rail.clientWidth - current.offsetWidth) / 2,
        behavior: 'instant',
      });
  }, [spread.chapter]);
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  async function copyPlateLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.href.split('#')[0]}#${plate.hash}`,
      );
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <main className={`reader reader-${book.id}`}>
      <a
        className="reader-skip"
        href="#reader-story"
        onClick={(event) => {
          event.preventDefault();
          heading.current?.focus({ preventScroll: true });
          heading.current?.scrollIntoView({
            block: 'start',
            behavior: 'instant',
          });
        }}
      >
        Skip to the current passage
      </a>
      <header className="reader-header">
        <button
          className="reader-wordmark"
          onClick={() => go(0)}
          aria-label={`Valisar, return to the beginning of ${book.title}`}
        >
          <Compass size={25} />
          <span>VALISAR</span>
        </button>
        <BookNavigation current={book.id} />
        <div className="reader-header-actions">
          <Button variant="ghost" onClick={() => setPanel('chapters')}>
            <BookOpen size={17} />
            <span>Chapters</span>
          </Button>
          <Button variant="ghost" onClick={openGallery}>
            <Grid2X2 size={17} />
            <span>All plates</span>
          </Button>
        </div>
      </header>
      <nav
        className="reader-chapters"
        ref={chapterRail}
        aria-label={`${book.title} chapters`}
      >
        {book.chapters.map((item, chapterIndex) => (
          <button
            key={item.id}
            aria-current={chapterIndex === spread.chapter ? 'step' : undefined}
            onClick={() => goChapter(chapterIndex)}
          >
            <span>{item.roman}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="reader-chapter-heading">
        <span>CHAPTER {chapter.roman}</span>
        <p>{chapter.title}</p>
        <button onClick={() => setPanel('chapters')}>
          {book.chapters.length} chapters <ArrowUpRight size={14} />
        </button>
      </div>

      <section
        className="reader-spread"
        aria-label={`${book.title}, passage ${index + 1}`}
      >
        <div className="reader-art-column">
          <div className="reader-overline">
            <span>
              PLATE {plate.number} <i>/</i> {plate.place}
            </span>
            <span>{plate.style}</span>
          </div>
          <div className="reader-art-stage" key={plate.id}>
            <PlateImage plate={plate} priority />
            <button
              className="reader-open-art"
              onClick={() => setPanel('viewer')}
              aria-label={`Enlarge ${plate.title}`}
            >
              <span>
                <Expand size={16} />
                View full plate
              </span>
            </button>
            {pinsVisible && activePins.length > 0 && (
              <div className="reader-map-pins">
                {activePins.map((pin) => (
                  <button
                    key={pin.spread}
                    className="reader-pin"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    aria-label={`Travel to ${pin.label}`}
                    onClick={() =>
                      go(
                        book.spreads.findIndex(
                          (item) => item.id === pin.spread,
                        ),
                      )
                    }
                  >
                    <span className="reader-pin-dot" />
                    <span className="reader-pin-label">
                      {pin.label}
                      <ArrowUpRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="reader-caption">
            <span>{plate.subtitle || plate.title}</span>
            <small>{plate.kind}</small>
          </div>
          <div className="reader-art-actions">
            <Button variant="ghost" onClick={() => setPanel('notes')}>
              <BookOpen size={16} />
              Field notes
            </Button>
            <Button variant="ghost" onClick={() => setPanel('viewer')}>
              <Expand size={16} />
              Enlarge
            </Button>
            {variants.length > 1 && (
              <Button variant="ghost" onClick={() => setPanel('compare')}>
                <ScanLine size={16} />
                Compare styles
              </Button>
            )}
            {activePins.length > 0 && (
              <Button
                className="reader-pin-toggle"
                variant="ghost"
                aria-pressed={pinsVisible}
                aria-label={
                  pinsVisible ? 'Hide destinations' : 'Show destinations'
                }
                onClick={() => setPinsVisible((value) => !value)}
              >
                <MapPin size={16} />
                <span>Destinations</span>
              </Button>
            )}
          </div>
          {variants.length > 1 && (
            <div
              className="reader-variants"
              aria-label="Alternate artwork styles"
            >
              {orderedVariants.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={item.id === plate.id}
                  onClick={() => goPlate(item.id)}
                >
                  <PlateImage plate={item} thumbnail allowRetry={false} />
                  <span>{item.variantLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <article className="reader-story" id="reader-story" key={spread.id}>
          <span className="reader-eyebrow">{spread.kicker}</span>
          {spread.record && (
            <div
              className={`reader-record ${spread.speculative ? 'speculative' : ''}`}
            >
              {spread.record}
            </div>
          )}
          <h1 ref={heading} tabIndex={-1}>
            {spread.title}
            {spread.emphasis && <em>{spread.emphasis}</em>}
          </h1>
          {spread.date && <p className="reader-date">{spread.date}</p>}
          <p className="reader-lede">{spread.paragraphs[0]}</p>
          {spread.paragraphs.slice(1).map((paragraph) => (
            <p className="reader-copy" key={paragraph}>
              {paragraph}
            </p>
          ))}
          {spread.detail && (
            <p className="reader-look">
              <span>LOOK CLOSER</span>
              {spread.detail}
            </p>
          )}
          {spread.next && (
            <button
              className="reader-follow"
              onClick={() =>
                go(index === book.spreads.length - 1 ? 0 : index + 1)
              }
            >
              {spread.next}
              <ArrowRight size={16} />
            </button>
          )}
        </article>
      </section>

      <footer className="reader-pagination">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          <ArrowLeft size={18} />
          <span>Previous</span>
        </Button>
        <button
          className="reader-page-count"
          onClick={() => setPanel('chapters')}
          aria-label={`Passage ${index + 1} of ${book.spreads.length}. Open chapters.`}
        >
          {number(index + 1)}
          <i>/</i>
          {number(book.spreads.length)}
          <span>PASSAGES</span>
        </button>
        <Button
          variant="ghost"
          onClick={() => go(index === book.spreads.length - 1 ? 0 : index + 1)}
        >
          <span>
            {index === book.spreads.length - 1
              ? 'Begin again'
              : book.spreads[index + 1].chapter !== spread.chapter
                ? 'Next chapter'
                : 'Next'}
          </span>
          {index === book.spreads.length - 1 ? (
            <RotateCcw size={17} />
          ) : (
            <ArrowRight size={18} />
          )}
        </Button>
        <span className="reader-progress" aria-hidden="true">
          <i
            style={{ width: `${((index + 1) / book.spreads.length) * 100}%` }}
          />
        </span>
      </footer>
      <div className="reader-colophon">
        <span>A world by Cody Wymore</span>
        <span className="reader-keyboard-hint">← → Turn the pages</span>
        <button onClick={() => setPanel('about')}>
          <Info size={14} />
          About this book
        </button>
      </div>
      <output className="sr-only" aria-live="polite">
        {book.title}. Chapter {chapter.roman}. Passage {index + 1} of{' '}
        {book.spreads.length}. Plate {plate.number}: {plate.title}.
      </output>

      <Dialog
        open={panel === 'chapters'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="reader-dialog reader-chapters-dialog"
          showCloseButton={false}
        >
          <header className="reader-modal-header">
            <div>
              <span className="reader-eyebrow">{book.title}</span>
              <DialogTitle>Chapters</DialogTitle>
              <DialogDescription>{book.description}</DialogDescription>
            </div>
            <CloseDialog />
          </header>
          <div className="reader-chapter-grid">
            {book.chapters.map((item, chapterIndex) => (
              <section
                key={item.id}
                className={chapterIndex === spread.chapter ? 'current' : ''}
              >
                <button
                  className="reader-chapter-card"
                  onClick={() => goChapter(chapterIndex)}
                >
                  <div className="reader-chapter-image">
                    <PlateImage
                      plate={book.plates.find((art) => art.id === item.cover)!}
                      thumbnail
                      allowRetry={false}
                    />
                    <span>{item.roman}</span>
                  </div>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
                <div className="reader-chapter-passages">
                  {book.spreads.map(
                    (itemSpread, spreadIndex) =>
                      itemSpread.chapter === chapterIndex && (
                        <button
                          key={itemSpread.id}
                          aria-current={
                            spreadIndex === index ? 'location' : undefined
                          }
                          onClick={() => go(spreadIndex)}
                        >
                          <span>
                            {itemSpread.title} {itemSpread.emphasis}
                          </span>
                          <ArrowRight size={14} />
                        </button>
                      ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={panel === 'gallery'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="reader-dialog reader-gallery-dialog"
          showCloseButton={false}
        >
          <header className="reader-modal-header">
            <div>
              <span className="reader-eyebrow">{book.title}</span>
              <DialogTitle>All plates</DialogTitle>
              <DialogDescription>
                {book.plates.length} artworks · {book.chapters.length} chapters
              </DialogDescription>
            </div>
            <CloseDialog />
          </header>
          <div
            className="reader-gallery-filters"
            aria-label="Filter by chapter"
          >
            <button aria-pressed={filter === -1} onClick={() => setFilter(-1)}>
              All {book.plates.length}
            </button>
            {book.chapters.map((item, chapterIndex) => (
              <button
                key={item.id}
                aria-pressed={filter === chapterIndex}
                onClick={() => setFilter(chapterIndex)}
              >
                {item.roman} · {item.label}
              </button>
            ))}
          </div>
          <div className="reader-gallery-scroll">
            {book.chapters.map(
              (item, chapterIndex) =>
                (filter === -1 || filter === chapterIndex) && (
                  <section key={item.id}>
                    <h2>
                      <span>{item.roman}</span>
                      {item.title}
                    </h2>
                    <div className="reader-gallery-grid">
                      {book.plates
                        .filter((art) => art.chapter === chapterIndex)
                        .map((art) => (
                          <div
                            className={`reader-gallery-card ${art.id === plateId ? 'selected' : ''}`}
                            key={art.id}
                          >
                            <div className="reader-gallery-image">
                              <PlateImage plate={art} thumbnail />
                              <span>{art.number}</span>
                            </div>
                            <button
                              className="reader-gallery-open"
                              aria-label={`Open plate ${art.number}: ${art.title}`}
                              onClick={() => goPlate(art.id)}
                            />
                            <div className="reader-gallery-caption">
                              <h3>{art.title}</h3>
                              {art.subtitle && <p>{art.subtitle}</p>}
                              <small>{art.variantLabel}</small>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet
        open={panel === 'notes'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent className="reader-notes">
          <span className="reader-eyebrow">
            PLATE {plate.number} · FIELD NOTES
          </span>
          <SheetTitle>{plate.title}</SheetTitle>
          <SheetDescription>{plate.subtitle || plate.kind}</SheetDescription>
          <div className="reader-notes-image">
            <PlateImage key={plate.id} plate={plate} thumbnail />
          </div>
          {plate.notes.map((note) => (
            <section key={note.heading}>
              <h2>{note.heading}</h2>
              <p>{note.text}</p>
            </section>
          ))}
          <section className="reader-source-trail">
            <h2>Source trail</h2>
            <ul>
              {plate.sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </section>
          <Button variant="outline" onClick={copyPlateLink}>
            {copied ? <Check size={16} /> : <Link2 size={16} />}{' '}
            {copied ? 'Link copied' : 'Copy plate link'}
          </Button>
          {copyError && (
            <output className="reader-copy-error">
              Copy this plate’s link from your browser’s address bar.
            </output>
          )}
          <p className="reader-notes-credit">
            World and lore by Cody Wymore. Artwork created with OpenAI image
            generation.
          </p>
        </SheetContent>
      </Sheet>

      <Dialog
        open={panel === 'viewer'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="reader-dialog reader-viewer"
          showCloseButton={false}
        >
          <FullPlate key={plate.id} plate={plate} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel === 'compare'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="reader-dialog reader-compare-dialog"
          showCloseButton={false}
        >
          {variants.length > 1 && (
            <ComparePlates key={plate.id} first={plate} second={variants[1]} />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel === 'about'}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="reader-dialog reader-about"
          showCloseButton={false}
        >
          <header className="reader-modal-header">
            <div>
              <span className="reader-eyebrow">THE WORLD OF VALISAR</span>
              <DialogTitle>{book.title}</DialogTitle>
              <DialogDescription>{book.description}</DialogDescription>
            </div>
            <CloseDialog />
          </header>
          <div className="reader-about-copy">
            {book.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="reader-credits">
              <span>WORLD & CAMPAIGN</span>
              <strong>Cody Wymore</strong>
              <span>ARTWORK & BOOK</span>
              <strong>Created with OpenAI image generation and Codex</strong>
            </div>
            <p className="reader-fine-print">
              Appearances and staging are artistic interpretations.
              Late-campaign explanations remain veiled.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
