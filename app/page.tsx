'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight, ArrowLeft, ArrowUpRight, Compass, BookOpen, Grid2X2, Maximize2, ScanLine, MapPin, Plus, Minus, RotateCcw, X, ChevronRight, Feather, MoveHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookNavigation } from '@/components/book-navigation';
import artworks from './artworks.json';
import { chapters, stops, plateLabels, worldPins } from './journey';

const artById = Object.fromEntries(artworks.map(a => [a.id, a]));
const src = (id: string, thumb = false) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/art/${id === '28' ? '28-unwritten' : id}${thumb ? '-thumb' : ''}.webp`;
const plateName = (id: string) => artById[id].title.split(' · ').slice(1).join(' · ') || artById[id].title;
const number = (n: number) => String(n).padStart(2, '0');

function ArtImage({ id, className = '', priority = false }: { id: string; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth) setReady(true); }, [id]);
  return <>
    <img ref={ref} className={`atlas-image art-reveal ${ready ? 'is-loaded' : ''} ${className}`} src={`${src(id)}${retry ? `?retry=${retry}` : ''}`} alt={`${artById[id].title}. ${artById[id].kind} in ${artById[id].style.toLowerCase()}.`} width={1536} height={1024} draggable={false} fetchPriority={priority ? 'high' : 'auto'} onLoad={() => { setReady(true); setError(false); }} onError={() => setError(true)} />
    {error && <div className="art-error"><p>This artwork couldn’t load.</p><Button variant="outline" onClick={() => { setRetry(n => n + 1); setError(false); }}>Try again</Button></div>}
  </>;
}

function CloseArtbookDialog() {
  return <DialogClose render={<Button variant="ghost" size="icon" className="book-close" aria-label="Close view" />}><X size={21}/></DialogClose>;
}

export default function Home() {
  const [stopIndex, setStopIndex] = useState(0);
  const [plateId, setPlateId] = useState('01');
  const [direction, setDirection] = useState(1);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [split, setSplit] = useState(50);
  const [pins, setPins] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const drag = useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const comparisonDrag = useRef(false);
  const stop = stops[stopIndex];
  const chapter = chapters[stop.chapter];
  const art = artById[plateId];
  const dialogOpen = contentsOpen || collectionOpen || notesOpen || viewerOpen || compareOpen;

  const go = useCallback((index: number, selectedPlate?: string) => {
    if (index < 0 || index >= stops.length) return;
    setDirection(index >= stopIndex ? 1 : -1);
    setStopIndex(index);
    const id = selectedPlate || stops[index].plates[0];
    setPlateId(id);
    setZoom(1); setPan({x:0,y:0});
    setContentsOpen(false); setCollectionOpen(false); setCompareOpen(false); setViewerOpen(false);
    window.history.replaceState(null, '', `#plate-${id}`);
  }, [stopIndex]);
  const choosePlate = (id: string) => {
    setPlateId(id);
    window.history.replaceState(null, '', `#plate-${id}`);
  };
  const goPlate = (id: string) => {
    const found = stops.findIndex(s => s.plates.includes(id));
    if (found >= 0) go(found, id);
  };
  const goChapter = (index: number) => go(stops.findIndex(s => s.chapter === index));
  useEffect(() => {
    const id = window.location.hash.match(/^#plate-(\d{2})$/)?.[1];
    if (id) {
      const index = stops.findIndex(s => s.plates.includes(id));
      if (index >= 0) { setStopIndex(index); setPlateId(id); }
    }
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialogOpen || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[role="tablist"],[role="slider"],[contenteditable]')) return;
      if (e.key === 'ArrowRight' && stopIndex < stops.length - 1) { e.preventDefault(); go(stopIndex + 1); }
      if (e.key === 'ArrowLeft' && stopIndex > 0) { e.preventDefault(); go(stopIndex - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogOpen, go, stopIndex]);
  useEffect(() => {
    const ids = [...stop.plates, ...(stops[stopIndex+1]?.plates.slice(0,1) || [])];
    ids.forEach(id => { const image = new window.Image(); image.src = src(id); });
  }, [stop, stopIndex]);
  const updateZoom = (value: number) => {
    const next = Math.max(1, Math.min(4, Math.round(value * 100) / 100));
    setZoom(next);
    if (next === 1) setPan({x:0,y:0});
  };
  const pointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {x:e.clientX,y:e.clientY,ox:pan.x,oy:pan.y};
  };
  const pointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || !viewerRef.current) return;
    const bounds = viewerRef.current.getBoundingClientRect();
    const maxX = bounds.width * (zoom - 1) / 2;
    const maxY = bounds.height * (zoom - 1) / 2;
    setPan({x:Math.max(-maxX,Math.min(maxX,drag.current.ox+e.clientX-drag.current.x)),y:Math.max(-maxY,Math.min(maxY,drag.current.oy+e.clientY-drag.current.y))});
  };
  const resetView = () => {setZoom(1);setPan({x:0,y:0});};
  const frameStyle = {'--page-direction': direction} as CSSProperties;

  return <main className={`atlas-shell chapter-${chapter.id}`}>
    <a className="skip-link" href="#story">Skip to the current chapter</a>
    <div className="ambient-wash" aria-hidden="true"/>
    <header className="masthead">
      <button className="wordmark" onClick={() => go(0)} aria-label="Valisar, return to the beginning"><Compass size={26}/><span>VALISAR</span></button>
      <BookNavigation current="atlas" />
      <nav aria-label="Artbook views">
        <Button variant="ghost" onClick={() => setContentsOpen(true)} aria-label="Open chapters"><BookOpen size={16}/><span>Chapters</span></Button>
        <Button variant="ghost" onClick={() => setCollectionOpen(true)} aria-label="Browse all 28 artworks"><Grid2X2 size={16}/><span>The collection</span></Button>
      </nav>
    </header>

    <section className="book-spread" style={frameStyle}>
      <article className="story-column page-turn" key={stop.id} id="story" tabIndex={-1}>
        <div className="eyebrow"><span className="gold-rule"/> CHAPTER {chapter.roman} <span className="eyebrow-dot">·</span> {stop.kicker}</div>
        <h1>{stop.title}<br/><em>{stop.emphasis}</em></h1>
        <p className="story-lede">{stop.paragraphs[0]}</p>
        <p className="story-body">{stop.paragraphs[1]}</p>
        {stopIndex === 0 ? <div className="byline">THE WORLD OF <strong>CODY WYMORE</strong></div> : <p className="field-note"><Feather size={15}/><span>{stop.detail}</span></p>}
        <Button variant="outline" className="journey-next" onClick={() => go(stopIndex === stops.length-1 ? 0 : stopIndex+1)}>{stop.next}<ArrowRight size={18}/></Button>
        <div className="reading-progress"><Button variant="ghost" size="icon" className="previous-page" disabled={stopIndex===0} aria-label="Previous passage" onClick={() => go(stopIndex-1)}><ArrowLeft size={16}/></Button><span className="folio">{number(stopIndex+1)} <span className="folio-divider">/</span> {number(stops.length)} <span className="folio-caption">PASSAGES</span></span><div className="passage-progress" aria-hidden="true"><span style={{width:`${((stopIndex+1)/stops.length)*100}%`}}/></div></div>
      </article>

      <Tabs value={plateId} onValueChange={value => choosePlate(String(value))} className="art-column">
        <div className="plate-overline"><span>PLATE {plateId} <span className="overline-divider">/</span> {art.region.toUpperCase()}</span><span>{art.style.toUpperCase()}</span></div>
        <TabsContent key={plateId} value={plateId} className="art-panel" aria-label={art.title}>
        <div className="figure-wrap">
          <figure className="map-figure" key={plateId}>
            <button className="image-open" onClick={() => {resetView();setViewerOpen(true);}} aria-label={`Enlarge ${art.title}`}><ArtImage id={plateId} priority={stopIndex===0}/></button>
            {plateId === '01' && pins && <div className="map-destinations">{worldPins.map(pin => <button key={pin.stop} className={`map-pin pin-${pin.stop}`} style={{left:`${pin.x}%`,top:`${pin.y}%`}} onClick={() => go(stops.findIndex(s => s.id===pin.stop))} aria-label={`Travel to ${pin.label}`}><span className="pin-dot"/><span className="pin-label">{pin.label}<ArrowUpRight size={12}/></span></button>)}</div>}
            <span className="map-corner top-left"/><span className="map-corner bottom-right"/>
          </figure>
          <div className="map-tools">
            {plateId==='01' && <Button variant="ghost" size="icon" aria-label={pins?'Hide destinations':'Show destinations'} aria-pressed={pins} onClick={() => setPins(!pins)}><MapPin size={16}/></Button>}
            <Button variant="ghost" size="icon" aria-label="Open full-screen artwork" onClick={() => {resetView();setViewerOpen(true);}}><Maximize2 size={16}/></Button>
          </div>
        </div>
        <div className="plate-caption"><span><i>{plateName(plateId)}</i><small>{art.kind} <span>·</span> {art.style}</small></span><button className="text-button" onClick={() => setNotesOpen(true)}>Field notes <ArrowUpRight size={16}/></button></div>
        </TabsContent>
        <div className="plate-bottom">
          {stop.plates.length > 1 ? <div className="style-tabs"><TabsList className="variant-row" aria-label="Art styles">{stop.plates.map(id => <TabsTrigger value={id} key={id} className="variant-card"><img src={src(id,true)} alt="" width={59} height={39}/><span>{plateLabels[id]}</span></TabsTrigger>)}</TabsList></div> : <div className="single-plate-note"><span className="small-diamond"/>{plateLabels[plateId]}</div>}
          {stop.plates.length>1 && <button className="compare-button" onClick={() => {setSplit(50);setCompareOpen(true);}}><ScanLine size={16}/><span>Compare</span></button>}
        </div>
      </Tabs>
    </section>

    <footer className="journey-footer"><span>VALISAR · A LIVING ATLAS</span><nav className="chapter-rail" aria-label="Journey chapters">{chapters.map((c,i) => <button key={c.id} className={i===stop.chapter?'current':''} onClick={() => goChapter(i)} aria-current={i===stop.chapter?'step':undefined} aria-label={`Chapter ${c.roman}: ${c.title}`}><b>{number(i+1)}</b><span>{c.label}</span></button>)}</nav><span>28 PLATES</span></footer>
    <div className="sr-only" role="status" aria-live="polite">Chapter {chapter.roman}: {chapter.title}. {stop.title} {stop.emphasis} Passage {stopIndex+1} of {stops.length}.</div>

    <Dialog open={contentsOpen} onOpenChange={setContentsOpen}>
      <DialogContent className="book-modal contents-modal" showCloseButton={false}>
        <CloseArtbookDialog/>
        <header className="modal-heading"><span className="eyebrow">VALISAR · A LIVING ATLAS</span><DialogTitle className="modal-title">The journey</DialogTitle><DialogDescription className="modal-description">Eight chapters. Follow the road, or open the book wherever it calls to you.</DialogDescription></header>
        <div className="contents-grid">{chapters.map((c,i) => <section className={`chapter-entry ${i===stop.chapter?'active-chapter':''}`} key={c.id}><button className="chapter-entry-main" onClick={() => goChapter(i)}><div className="chapter-thumb"><img src={src(c.cover,true)} alt="" loading="lazy"/><b>{c.roman}</b></div><div><span className="eyebrow">CHAPTER {c.roman}</span><h2>{c.title}</h2><p>{c.description}</p></div><ArrowUpRight size={18}/></button><div className="chapter-passages">{stops.map((s,j) => s.chapter===i ? <button key={s.id} className={j===stopIndex?'current-passage':''} onClick={() => go(j)}><span>{s.kicker.toLowerCase()}</span><ChevronRight size={13}/></button> : null)}</div></section>)}</div>
      </DialogContent>
    </Dialog>

    <Dialog open={collectionOpen} onOpenChange={setCollectionOpen}>
      <DialogContent className="book-modal collection-modal" showCloseButton={false}>
        <CloseArtbookDialog/>
        <header className="modal-heading"><span className="eyebrow">THE COMPLETE ARTBOOK</span><DialogTitle className="modal-title">Twenty-eight windows<br/><em>into Valisar.</em></DialogTitle><DialogDescription className="modal-description">Maps, places, and remembered moments from the world of Cody Wymore.</DialogDescription></header>
        <div className="collection-grid">{artworks.map(a => <button key={a.id} className={`collection-plate ${a.id===plateId?'selected-plate':''}`} onClick={() => goPlate(a.id)}><div className="collection-image"><img src={src(a.id,true)} alt={a.title} loading="lazy" width={420} height={280}/><span>{a.id}</span><span className="collection-open"><ArrowUpRight size={22}/></span></div><h2>{a.title.split(' · ')[0]}</h2><p>{plateName(a.id)}</p><small>{plateLabels[a.id]}</small></button>)}</div>
        <p className="collection-colophon">World & lore by Cody Wymore. Artwork generated with OpenAI ImageGen.<br/>The field notes distinguish recorded lore from artistic interpretation.</p>
      </DialogContent>
    </Dialog>

    <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
      <SheetContent className="field-sheet">
        <div className="notes-header"><span className="eyebrow">PLATE {plateId} · FIELD NOTES</span><SheetTitle className="notes-title">{art.title.split(' · ')[0]}</SheetTitle><SheetDescription className="notes-subtitle">{plateName(plateId)}</SheetDescription></div>
        <img className="notes-image" src={src(plateId,true)} alt="" width={420} height={280}/>
        <section className="notes-section"><h3>From the lore</h3><p>{art.lore}</p></section>
        <section className="notes-section"><h3>Where the artist fills the gaps</h3><p>{art.interpretation}</p></section>
        <section className="notes-section sources-section"><h3>In Cody’s documents</h3><ul>{art.sources.map(s => <li key={s}>{s}</li>)}</ul></section>
        <p className="notes-colophon">Illustrated with OpenAI ImageGen, using the worldbuilding master document, campaign notes, and their embedded artwork. Continental maps follow Cody’s preferred early outline. This artbook includes DM lore.</p>
      </SheetContent>
    </Sheet>

    <Dialog open={viewerOpen} onOpenChange={value => {setViewerOpen(value);if(!value)resetView();}}>
      <DialogContent className="book-modal viewer-modal" showCloseButton={false}>
        <CloseArtbookDialog/>
        <header className="viewer-header"><div><span className="eyebrow">PLATE {plateId}</span><DialogTitle className="viewer-title">{art.title}</DialogTitle><DialogDescription className="sr-only">Use the zoom buttons to inspect details. When zoomed in, drag the image to move around.</DialogDescription></div><div className="zoom-controls"><Button variant="ghost" size="icon" disabled={zoom<=1} onClick={() => updateZoom(zoom-.5)} aria-label="Zoom out"><Minus size={18}/></Button><span aria-live="polite">{Math.round(zoom*100)}%</span><Button variant="ghost" size="icon" disabled={zoom>=4} onClick={() => updateZoom(zoom+.5)} aria-label="Zoom in"><Plus size={18}/></Button><Button variant="ghost" size="icon" onClick={resetView} aria-label="Reset zoom and position"><RotateCcw size={16}/></Button></div></header>
        <div className={`zoom-stage ${zoom>1?'is-zoomed':''}`} ref={viewerRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}} onDoubleClick={() => zoom===1?updateZoom(2):resetView()}>
          <div className="zoom-transform" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}><ArtImage key={`viewer-${plateId}`} id={plateId}/></div>
        </div>
        <footer className="viewer-footer"><span>{art.style} <span>·</span> {art.kind}</span><span>{zoom>1?'Drag to explore the details':'Double-click the artwork to zoom'}</span></footer>
      </DialogContent>
    </Dialog>

    <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
      <DialogContent className="book-modal compare-modal" showCloseButton={false}>
        <CloseArtbookDialog/>
        <header className="modal-heading"><span className="eyebrow">ONE PLACE · TWO VISIONS</span><DialogTitle className="viewer-title">{art.region}</DialogTitle><DialogDescription className="modal-description">Move the slider to travel between styles.</DialogDescription></header>
        {stop.plates.length>1 && <><div className="comparison-frame" onPointerDown={e => { if (e.pointerType==='mouse' && e.button!==0) return; comparisonDrag.current=true; e.currentTarget.setPointerCapture(e.pointerId); const rect=e.currentTarget.getBoundingClientRect(); setSplit(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100))); }} onPointerMove={e => { if (!comparisonDrag.current) return; const rect=e.currentTarget.getBoundingClientRect(); setSplit(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100))); }} onPointerUp={() => {comparisonDrag.current=false;}} onPointerCancel={() => {comparisonDrag.current=false;}}><img draggable={false} src={src(stop.plates[1])} alt={`${art.region}, ${plateLabels[stop.plates[1]]}`} width={1536} height={1024}/><div className="comparison-overlay" style={{clipPath:`inset(0 ${100-split}% 0 0)`}}><img draggable={false} src={src(stop.plates[0])} alt={`${art.region}, ${plateLabels[stop.plates[0]]}`} width={1536} height={1024}/></div><div className="comparison-divider" aria-hidden="true" style={{left:`${split}%`}}><MoveHorizontal size={21}/></div><div className="comparison-label left">{plateLabels[stop.plates[0]]}</div><div className="comparison-label right">{plateLabels[stop.plates[1]]}</div></div><div className="comparison-slider"><Slider value={[split]} min={0} max={100} onValueChange={value => setSplit(Array.isArray(value)?value[0]:value)} aria-label="Reveal the first map style"/><span>Use the slider or its arrow keys to compare</span></div></>}
      </DialogContent>
    </Dialog>
  </main>;
}
