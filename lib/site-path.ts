// GitHub Pages mounts the static site beneath the repository name.
export function sitePath(path = '') {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${base}/${path.replace(/^\/+/, '')}`;
}
