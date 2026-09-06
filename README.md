# Valisar · A Living Atlas

A guided interactive artbook of 28 maps and paintings from Cody Wymore’s original homebrew world. Includes chapter navigation, regional map pins, an artwork collection, source notes, a zoomable viewer, and comparisons between map styles.

## Local development

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and publishes the static artbook when `main` changes. Enable **GitHub Actions** as the Pages source in the repository’s Settings → Pages. The build reads the repository’s Pages base path automatically, including when a custom domain uses the root path.

To validate a project-path build locally:

```sh
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/valisar-atlas npm run build:pages
```

The published files are in `dist/github-pages`. The packaging step flattens the export to match how Pages mounts a project site. GitHub Pages serves a public website under ordinary personal-account hosting, regardless of the source repository’s visibility. Decide on the intended audience before enabling publication.

## Content

Guided passages live in `app/journey.ts`; artwork titles, captions, and notes are in `app/artworks.json`. Display images and thumbnails are in `public/art`.

Plates 27 and 28 use deliberately cryptic text. Plate 28’s distant lands are unnamed in its display artwork. The original campaign research and unabridged artwork remain outside this site project.

When first publishing this site to a new public repository, use a fresh copy of the current files without the local Git history. Earlier local revisions contain the unabridged versions of plates 27 and 28.
