# A Melody of Thought

A digital archive preserving the poetry of **J. Leland Hall** written between 1942 and 1995.

## About

This website honors the memory of J. Leland Hall by digitizing his collection of hand-typed poetry booklets. The poems were originally photocopied and shared with family and friends over five decades.

The collection spans themes of faith, family, service, and the quiet moments of reflection that mark a life well-lived.

## Features

- **197 poems** digitized from original manuscripts
- **124 manuscript pages** viewable in the gallery
- **32 topic tags** for browsing by theme
- Full-text search
- Responsive design with a vintage mimeograph aesthetic
- Interactive book cover landing page

## Building

```bash
npm run build    # Generate the static site
npm run serve    # Serve locally on port 8080
```

## Structure

- `build.js` - Static site generator
- `public/` - Generated website output
- `../digitizer/poems.json` - Poem data extracted via OCR
- `../images/` - Scanned manuscript pages
- `../Graphics/` - Decorative flourishes from the original books

## Created With

- Poems digitized using Claude Vision API
- Static site built with Node.js
- No external dependencies

---

*"Over the years I have felt the urge in moments of reflection, to 'poemize'. Everyone must feel this way occasionally."*

— J. Leland Hall, 1957
