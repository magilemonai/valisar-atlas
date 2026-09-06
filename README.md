# Valisar · A Living Atlas

Two guided interactive artbooks from Cody Wymore’s original homebrew world, hosted together on [Valisar’s GitHub Pages site](https://magilemonai.github.io/valisar-atlas/).

- **Living Atlas** at `/`: the original 28 maps and paintings, with regional map pins, chapter navigation and source notes.
- **Ash & Thunder** at `/ash-and-thunder/`: 24 illustrations of wars, cinematic battles, cataclysms and imagined overseas conflicts, arranged into six chapters.

A collection switch in both headers connects the books. Each retains its own visual style, plate links, zoomable viewer and comparisons between alternate treatments.

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

Atlas passages live in `app/journey.ts`; atlas titles, captions and notes are in `app/artworks.json`. Its original images remain in `public/art`.

The history section lives in `app/ash-and-thunder/`. Its `plates.json` and `acts.json` contain captions, alt text, record classifications, source references and chapter introductions. Its 24 display images and 24 thumbnails live in `public/art/conflicts`.

Chronicle styles are scoped to `.chronicle-theme`, including dialog portals, and use `conflict-` class names. Shared navigation is in `components/book-navigation.tsx`. Public links use `lib/site-path.ts` to respect the GitHub Pages repository prefix.

The packaging step supplies directory indexes for direct route access and validates asset and navigation links in every exported HTML page. Vinext exports without its trailing-slash redirect so both routes can prerender successfully.

Plates 27 and 28 use deliberately cryptic text. Plate 28’s distant lands are unnamed in its display artwork. Ash & Thunder also preserves the late-campaign veil, distinguishes artistic reconstructions from recorded events, and labels its two overseas wars as imagined. Its final omen remains unresolved. The original campaign research, generation prompts and unabridged artwork remain outside this site project.

When first publishing this site to a new public repository, use a fresh copy of the current files without the local Git history. Earlier local revisions contain the unabridged versions of plates 27 and 28.
