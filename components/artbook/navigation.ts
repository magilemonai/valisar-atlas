import type { Artbook } from './types';

// Prefer a plate’s own passage when it also appears as another passage’s variant.
export function positionForPlate(book: Artbook, id: string) {
  const primary = book.spreads.findIndex((spread) => spread.primary === id);
  return primary >= 0
    ? primary
    : book.spreads.findIndex((spread) => spread.plates.includes(id));
}

export function positionForHash(book: Artbook, hash: string) {
  const plate = book.plates.find((item) => `#${item.hash}` === hash);
  if (!plate) return null;
  const index = positionForPlate(book, plate.id);
  return index < 0 ? null : { index, plateId: plate.id };
}

export function boundPan(
  width: number,
  height: number,
  zoom: number,
  x: number,
  y: number,
) {
  const imageWidth = Math.min(width, height * 1.5);
  const imageHeight = imageWidth / 1.5;
  const limitX = Math.max(0, (imageWidth * zoom - width) / 2);
  const limitY = Math.max(0, (imageHeight * zoom - height) / 2);
  return {
    x: Math.max(-limitX, Math.min(limitX, x)),
    y: Math.max(-limitY, Math.min(limitY, y)),
  };
}
