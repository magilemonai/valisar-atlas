'use client';

/* oxlint-disable next/no-img-element -- GitHub Pages serves the pre-optimized WebP artwork directly. */

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
  BookOpen,
  Check,
  Expand,
  Grid2X2,
  Link2,
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
import { BookNavigation } from '@/components/book-navigation';
import { sitePath } from '@/lib/site-path';
import plates from './plates.json';
import acts from './acts.json';

// Keep the chronicle’s visual language isolated from the atlas.
const bookClass = (names: string) =>
  names
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => (name === 'sr-only' ? name : `conflict-${name}`))
    .join(' ');

type Plate = (typeof plates)[number];
const image = (id: string, thumb = false) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/art/conflicts/${id}${thumb ? '-thumb' : ''}.webp`;
const folio = (index: number) => String(index + 1).padStart(2, '0');

function ArtImage({
  plate,
  thumb = false,
  priority = false,
}: {
  plate: Plate;
  thumb?: boolean;
  priority?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <div className={bookClass(`image-shell ${ready ? 'is-ready' : ''}`)}>
      {!failed && (
        <img
          key={attempt}
          src={`${image(plate.image, thumb)}${attempt ? `?retry=${attempt}` : ''}`}
          alt={plate.alt}
          width={thumb ? 420 : 1536}
          height={thumb ? 280 : 1024}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          draggable={false}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <output className={bookClass('image-error')}>
          <span>This illustration couldn’t load.</span>
          <button
            onClick={() => {
              setFailed(false);
              setReady(false);
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </button>
        </output>
      )}
    </div>
  );
}

export default function Home() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const [contents, setContents] = useState(false);
  const [about, setAbout] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [compare, setCompare] = useState(false);
  const [filter, setFilter] = useState(-1);
  const [split, setSplit] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const plate = plates[index];
  const act = acts[plate.act];
  const alternate = plates.find((p) => p.id === plate.variants[0]);
  const dialogOpen = notes || contents || about || viewer || compare;

  const go = useCallback((next: number, focus = false) => {
    if (next < 0 || next >= plates.length) return;
    setIndex(next);
    setCopied(false);
    setLinkError(false);
    if (window.location.hash !== `#${plates[next].id}`)
      window.history.pushState(null, '', `#${plates[next].id}`);
    if (focus)
      requestAnimationFrame(() => {
        heading.current?.focus({ preventScroll: true });
      });
    if (window.matchMedia('(max-width: 760px)').matches)
      window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const sync = () => {
      const found = plates.findIndex(
        (p) => `#${p.id}` === window.location.hash,
      );
      setIndex(found >= 0 ? found : 0);
      setCopied(false);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  useEffect(() => {
    document.title = `${plate.title} | Valisar: Ash & Thunder`;
    const handle = (event: KeyboardEvent) => {
      if (
        dialogOpen ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          (event.target.closest('input, textarea, select') ||
            event.target.isContentEditable))
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(index + 1, true);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(index - 1, true);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        go(0, true);
      }
      if (event.key === 'End') {
        event.preventDefault();
        go(plates.length - 1, true);
      }
    };
    document.addEventListener('keydown', handle);
    const preload = plates[index + 1];
    if (preload) {
      const img = new Image();
      img.src = image(preload.image);
    }
    return () => document.removeEventListener('keydown', handle);
  }, [index, plate.title, dialogOpen, go]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    drag.current = null;
  }
  function changeZoom(value: number) {
    setZoom(Math.max(1, Math.min(4, value)));
    setPan({ x: 0, y: 0 });
  }
  function clampPan(x: number, y: number) {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    const fittedWidth = Math.min(box.width, box.height * 1.5);
    const fittedHeight = fittedWidth / 1.5;
    const maxX = Math.max(0, (fittedWidth * zoom - box.width) / 2);
    const maxY = Math.max(0, (fittedHeight * zoom - box.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }
  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      zoom <= 1 ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      drag.current
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
    if (!current || current.id !== event.pointerId) return;
    setPan(
      clampPan(
        current.startX + event.clientX - current.x,
        current.startY + event.clientY - current.y,
      ),
    );
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.href.split('#')[0]}#${plate.id}`,
      );
      setCopied(true);
      setLinkError(false);
    } catch {
      setLinkError(true);
    }
  }

  return (
    <main className={bookClass('chronicle')}>
      <a className={bookClass('skip-link')} href="#plate-story">
        Skip to the chronicle
      </a>
      <header className={bookClass('masthead')}>
        <button
          className={bookClass('wordmark')}
          onClick={() => setAbout(true)}
          aria-label="About Valisar: Ash and Thunder"
        >
          <span className={bookClass('world-name')}>VALISAR</span>
          <span className={bookClass('book-name')}>
            ASH <i>&</i> THUNDER
          </span>
        </button>
        <BookNavigation current="chronicle" />
        <div className={bookClass('header-actions')}>
          <Button
            variant="ghost"
            aria-label="About this book"
            onClick={() => setAbout(true)}
          >
            <BookOpen size={17} />
            <span>The book</span>
          </Button>
          <Button
            variant="outline"
            aria-label="Browse all 24 plates"
            onClick={() => {
              setFilter(-1);
              setContents(true);
            }}
          >
            <Grid2X2 size={16} />
            <span>All plates</span>
          </Button>
        </div>
      </header>

      <nav className={bookClass('chapter-rail')} aria-label="Chapters">
        {acts.map((chapter, n) => (
          <button
            key={chapter.roman}
            className={bookClass(plate.act === n ? 'active' : '')}
            aria-current={plate.act === n ? 'step' : undefined}
            onClick={() =>
              go(
                plates.findIndex((p) => p.act === n),
                true,
              )
            }
          >
            <span>{chapter.roman}</span>
            {chapter.short}
            <i aria-hidden="true" />
          </button>
        ))}
      </nav>
      <div className={bookClass('chapter-heading')}>
        <span>{act.roman}</span>
        <p>{act.title}</p>
        <i>{act.line}</i>
      </div>

      <section
        className={bookClass('spread')}
        key={plate.id}
        aria-label={`Plate ${index + 1}: ${plate.title}`}
      >
        <div className={bookClass('art-column')}>
          <div className={bookClass('plate-topline')}>
            <span>PLATE {folio(index)}</span>
            <span>{plate.style}</span>
          </div>
          <div className={bookClass('art-window')}>
            <ArtImage plate={plate} priority />
            <button
              className={bookClass('art-open')}
              aria-label={`Enlarge ${plate.title}`}
              onClick={() => {
                resetView();
                setViewer(true);
              }}
            >
              <span className={bookClass('expand-art')}>
                <Expand size={18} /> View full plate
              </span>
            </button>
          </div>
          <div className={bookClass('art-caption')}>
            <span>{plate.place}</span>
            <i>{plate.look}</i>
          </div>
        </div>
        <article className={bookClass('story')} id="plate-story">
          <span
            className={bookClass(
              `record-tag ${plate.record === 'Imagined conflict' || plate.record === 'Omen' ? 'speculative' : ''}`,
            )}
          >
            {plate.record}
          </span>
          <p className={bookClass('era')}>{plate.date}</p>
          <h1 ref={heading} tabIndex={-1}>
            {plate.title}
          </h1>
          <p className={bookClass('lede')}>{plate.line}</p>
          <p className={bookClass('body-copy')}>{plate.text}</p>
          <button
            className={bookClass('source-link')}
            onClick={() => setNotes(true)}
          >
            Read the chronicle notes <ArrowRight size={16} />
          </button>
          {alternate && (
            <button
              className={bookClass('variant-link')}
              onClick={() => {
                setSplit(50);
                setCompare(true);
              }}
            >
              <ScanLine size={16} />
              <span>One event, two interpretations</span>
            </button>
          )}
        </article>
      </section>

      <footer className={bookClass('folio-nav')}>
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => go(index - 1, true)}
        >
          <ArrowLeft size={18} />
          <span>Previous</span>
        </Button>
        <button
          className={bookClass('folio-count')}
          aria-label={`Plate ${index + 1} of ${plates.length}. Open all plates.`}
          onClick={() => {
            setFilter(-1);
            setContents(true);
          }}
        >
          {folio(index)} <i>/</i> {plates.length}
        </button>
        {index < plates.length - 1 ? (
          <Button variant="ghost" onClick={() => go(index + 1, true)}>
            <span>
              {plates[index + 1].act !== plate.act
                ? 'Next chapter'
                : 'Next plate'}
            </span>
            <ArrowRight size={18} />
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => go(0, true)}>
            <span>Begin again</span>
            <RotateCcw size={16} />
          </Button>
        )}
      </footer>
      <div className={bookClass('book-progress')} aria-hidden="true">
        <span style={{ width: `${((index + 1) / plates.length) * 100}%` }} />
      </div>
      <div className={bookClass('colophon')}>
        <span>A world by Cody Wymore</span>
        <span className={bookClass('keyboard-hint')}>← → Turn the pages</span>
        <a href={sitePath()}>
          Explore the Living Atlas <ArrowRight size={13} />
        </a>
      </div>
      <output className={bookClass('sr-only')} aria-live="polite">
        Plate {index + 1} of {plates.length}: {plate.title}
      </output>

      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent
          portalClassName="chronicle-theme"
          className={bookClass('about-dialog')}
        >
          <span className={bookClass('eyebrow')}>
            THE VALISAR COMPANION CHRONICLES
          </span>
          <DialogTitle>
            Ash <i>&</i> Thunder
          </DialogTitle>
          <DialogDescription>
            Wars, impossible battles, and the days the world gave way.
          </DialogDescription>
          <p>
            Enter Valisar’s history through twenty-four illustrations:
            catastrophe paintings, copperplate engravings, woven campaigns,
            pixel-art battles and visions of wars that may never come.
          </p>
          <p>
            Each spread follows Cody Wymore’s worldbuilding and campaign notes.
            Open the chronicle notes to see what the source records and where
            the illustration fills in a gap. The final chapter ventures into
            imagined conflicts and an unresolved omen.
          </p>
          <div className={bookClass('about-credit')}>
            <span>WORLD & CAMPAIGN</span>
            <strong>Cody Wymore</strong>
            <span>ILLUSTRATIONS & BOOK</span>
            <strong>Created with OpenAI image generation and Codex</strong>
          </div>
          <p className={bookClass('fine-print')}>
            Character appearances, costumes and staging are artistic
            interpretations. Late-campaign explanations remain veiled. This
            chronicle forms the history section of the Living Atlas.
          </p>
          <Button
            className={bookClass('begin-button')}
            onClick={() => {
              setAbout(false);
              go(0);
            }}
          >
            Open the chronicle <ArrowRight size={17} />
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={notes} onOpenChange={setNotes}>
        <DialogContent
          portalClassName="chronicle-theme"
          className={bookClass('notes-dialog')}
        >
          <span className={bookClass('eyebrow')}>
            FROM THE RECORD · PLATE {folio(index)}
          </span>
          <DialogTitle>{plate.title}</DialogTitle>
          <DialogDescription>
            {plate.record} · {plate.date}
          </DialogDescription>
          <p>{plate.detail}</p>
          <div className={bookClass('source-block')}>
            <h3>Source trail</h3>
            <ul>
              {plate.sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </div>
          <div className={bookClass('notes-bottom')}>
            <span>{plate.style}</span>
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Link2 size={15} />}{' '}
              {copied ? 'Link copied' : 'Copy plate link'}
            </Button>
          </div>
          {linkError && (
            <output className={bookClass('copy-error')}>
              Copy this plate’s link from your browser’s address bar.
            </output>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={contents} onOpenChange={setContents}>
        <DialogContent
          portalClassName="chronicle-theme"
          className={bookClass('contents-dialog')}
          showCloseButton={false}
        >
          <div className={bookClass('modal-heading')}>
            <div>
              <span className={bookClass('eyebrow')}>
                THE COMPLETE COLLECTION
              </span>
              <DialogTitle>Pages of fire. Pages of wonder.</DialogTitle>
              <DialogDescription>
                Six chapters. Twenty-four ways to remember.
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close collection"
                />
              }
            >
              <X size={20} />
            </DialogClose>
          </div>
          <div
            className={bookClass('collection-filters')}
            aria-label="Filter collection"
          >
            <button
              className={bookClass(filter === -1 ? 'active' : '')}
              aria-pressed={filter === -1}
              onClick={() => setFilter(-1)}
            >
              All 24
            </button>
            {acts.map((chapter, n) => (
              <button
                key={chapter.roman}
                className={bookClass(filter === n ? 'active' : '')}
                aria-pressed={filter === n}
                onClick={() => setFilter(n)}
              >
                {chapter.roman} · {chapter.short}
              </button>
            ))}
          </div>
          <div className={bookClass('collection-scroll')}>
            {acts.map(
              (chapter, actIndex) =>
                (filter === -1 || filter === actIndex) && (
                  <section
                    className={bookClass('collection-chapter')}
                    key={chapter.roman}
                  >
                    <div className={bookClass('collection-chapter-heading')}>
                      <h3>
                        <span>{chapter.roman}</span> {chapter.title}
                      </h3>
                      <p>{chapter.intro}</p>
                    </div>
                    <div className={bookClass('plate-grid')}>
                      {plates.map(
                        (item, i) =>
                          item.act === actIndex && (
                            <div
                              className={bookClass(
                                `plate-card ${index === i ? 'selected' : ''}`,
                              )}
                              key={item.id}
                            >
                              <ArtImage plate={item} thumb />
                              <button
                                className={bookClass('card-open')}
                                aria-label={`Open plate ${i + 1}: ${item.title}`}
                                onClick={() => {
                                  setContents(false);
                                  go(i);
                                }}
                              />
                              <div className={bookClass('card-copy')}>
                                <span>
                                  {folio(i)} / {item.record}
                                </span>
                                <h4>{item.title}</h4>
                                <p>{item.style}</p>
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  </section>
                ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewer}
        onOpenChange={(value) => {
          setViewer(value);
          if (!value) resetView();
        }}
      >
        <DialogContent
          portalClassName="chronicle-theme"
          className={bookClass('viewer-dialog')}
          showCloseButton={false}
        >
          <div className={bookClass('viewer-heading')}>
            <div>
              <span className={bookClass('eyebrow')}>PLATE {folio(index)}</span>
              <DialogTitle>{plate.title}</DialogTitle>
              <DialogDescription className={bookClass('sr-only')}>
                Use the zoom controls, then drag or use arrow keys on the image
                to explore. Escape closes the illustration.
              </DialogDescription>
            </div>
            <div className={bookClass('viewer-controls')}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                disabled={zoom === 1}
                onClick={() => changeZoom(zoom - 0.5)}
              >
                <ZoomOut size={18} />
              </Button>
              <span>{Math.round(zoom * 100)}%</span>
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
                aria-label="Reset view"
                onClick={resetView}
              >
                <RotateCcw size={17} />
              </Button>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close full plate"
                  />
                }
              >
                <X size={20} />
              </DialogClose>
            </div>
          </div>
          {/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- This bounded application region supports keyboard panning and pointer zoom; focus is required for its arrow-key controls. */}
          <div
            className={bookClass(`viewer-stage ${zoom > 1 ? 'zoomed' : ''}`)}
            ref={stage}
            role="application"
            aria-roledescription="zoomable illustration"
            tabIndex={0}
            aria-label="Illustration. Double-click to zoom; drag or use arrow keys when zoomed."
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
              if (zoom <= 1) return;
              const movement: Record<string, [number, number]> = {
                ArrowLeft: [80, 0],
                ArrowRight: [-80, 0],
                ArrowUp: [0, 80],
                ArrowDown: [0, -80],
              };
              const delta = movement[event.key];
              if (delta) {
                event.preventDefault();
                setPan(clampPan(pan.x + delta[0], pan.y + delta[1]));
              }
            }}
          >
            <div
              className={bookClass('zoom-transform')}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <ArtImage key={plate.id} plate={plate} priority />
            </div>
          </div>
          {/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          <div className={bookClass('viewer-footer')}>
            <span>{plate.style}</span>
            <span>
              {zoom > 1
                ? 'Drag to explore · Arrow keys to pan'
                : 'Double-click to zoom · Esc to close'}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent
          portalClassName="chronicle-theme"
          className={bookClass('compare-dialog')}
          showCloseButton={false}
        >
          <div className={bookClass('modal-heading')}>
            <div>
              <span className={bookClass('eyebrow')}>
                ONE EVENT, TWO INTERPRETATIONS
              </span>
              <DialogTitle>Across the styles</DialogTitle>
              <DialogDescription>
                Slide between two visual interpretations of the same event.
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close comparison"
                />
              }
            >
              <X size={20} />
            </DialogClose>
          </div>
          {alternate && (
            <>
              <div className={bookClass('compare-stage')}>
                <div className={bookClass('compare-base')}>
                  <ArtImage
                    key={`compare-${alternate.id}`}
                    plate={alternate}
                    priority
                  />
                </div>
                <div
                  className={bookClass('compare-over')}
                  style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                >
                  <ArtImage
                    key={`compare-${plate.id}`}
                    plate={plate}
                    priority
                  />
                </div>
                <span
                  className={bookClass('compare-line')}
                  style={{ left: `${split}%` }}
                  aria-hidden="true"
                >
                  <ScanLine size={21} />
                </span>
                <input
                  className={bookClass('compare-surface')}
                  type="range"
                  min={0}
                  max={100}
                  value={split}
                  aria-label={`Reveal ${plate.title} over ${alternate.title}`}
                  aria-valuetext={`${split}% ${plate.style}, ${100 - split}% ${alternate.style}`}
                  onChange={(event) => setSplit(Number(event.target.value))}
                />
              </div>
              <div className={bookClass('compare-labels')}>
                <span>{plate.style}</span>
                <span>{alternate.style}</span>
              </div>
              <div className={bookClass('compare-bottom')}>
                <p>
                  Drag across the image, or focus it and use the arrow keys.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompare(false);
                    go(plates.findIndex((p) => p.id === alternate.id));
                  }}
                >
                  Read the other plate <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
