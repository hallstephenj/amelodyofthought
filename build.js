const fs = require('fs');
const path = require('path');

// Read poems data
const poemsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'poems.json'), 'utf8'));

// Extract all poems into a flat array
const poems = [];

for (const [imageKey, poemList] of Object.entries(poemsData)) {
  for (const poem of poemList) {
    if (poem.content && poem.content.trim()) {
      poems.push({
        ...poem,
        sourceImage: imageKey,
        id: poems.length + 1
      });
    }
  }
}

// Get all graphics (flourishes) from public/graphics
const graphicsDir = path.join(__dirname, 'public', 'graphics');
const graphics = fs.readdirSync(graphicsDir).filter(f => f.endsWith('.jpg')).sort().map(f => `graphics/${f}`);

// Get all available images from public/images
const imagesDir = path.join(__dirname, 'public', 'images');
const allImages = [];
const bookDirs = fs.readdirSync(imagesDir).filter(d => d.startsWith('book-'));
for (const bookDir of bookDirs) {
  const bookPath = path.join(imagesDir, bookDir);
  const images = fs.readdirSync(bookPath).filter(f => f.endsWith('.jpg'));
  for (const img of images) {
    allImages.push(`${bookDir}/${img}`);
  }
}

// Topic keywords for auto-tagging (more specific, require word boundaries)
const topicKeywords = {
  'christ': ['jesus', 'christ', 'saviour', 'savior', 'calvary', 'cross', 'crucified', 'resurrection'],
  'prayer': ['prayer', 'praying', 'pray to', 'kneel', 'supplication'],
  'salvation': ['salvation', 'redeem', 'saved', 'forgiven', 'repent', 'repentance', 'born again', 'souls'],
  'heaven': ['heaven', 'heavenly', 'paradise', 'glory land', 'eternal home', 'eternal life'],
  'scripture': ['bible', 'scripture', 'gospel', 'psalm', 'the book', 'the word'],
  'church': ['church', 'congregation', 'preacher', 'sermon', 'sunday school', 'baptist'],
  'mother': ['mother', 'mama', 'mom', 'motherhood'],
  'father': ['father', 'papa', 'dad', 'daddy'],
  'marriage': ['wedding', 'bride', 'groom', 'anniversary', 'married'],
  'seasons': ['springtime', 'winter snow', 'autumn leaves', 'summer day'],
  'grief': ['grief', 'mourn', 'sorrow', 'weep', 'tears', 'loss', 'funeral', 'grave'],
  'aging': ['aging', 'old age', 'elderly', 'gray hair', 'twilight years', 'passing year'],
  'gratitude': ['thankful', 'grateful', 'thanksgiving', 'gratitude', 'appreciate'],
  'missions': ['missionary', 'missions', 'evangel', 'heathen', 'lost souls'],
  'hymn': ['hymn', 'singing', 'melody', 'song of', 'chorus'],
  // New specific tags
  'writing': ['poem', 'poet', 'verse', 'rhyme', 'write', 'written', 'words', 'poemize', 'poetize'],
  'children': ['children', 'grandchild', 'granddaughter', 'grandson', 'kids', 'child'],
  'spouse': ['wife', 'husband', 'betty', 'valentine', 'my love', 'my dear', 'sweetheart'],
  'hope': ['hope', 'hopeful', 'tomorrow', 'future', 'optimism', 'looking forward'],
  'memory': ['memory', 'memories', 'remember', 'recall', 'past', 'yesterday', 'long ago'],
  'surrender': ['yield', 'yielding', 'surrender', 'commit', 'commitment', 'consecrate'],
  'devotion': ['devotion', 'dedication', 'dedicate', 'loyal', 'faithful service'],
  'encouragement': ['lift up', 'press on', 'keep on', 'look up', 'courage', 'victory', 'conquer'],
  'wisdom': ['wisdom', 'wise', 'choose', 'decision', 'double-minded', 'discern'],
  'presence': ['presence', 'abide', 'abides', 'with me', 'beside me', 'he is here'],
  'seeking': ['quest', 'questing', 'search', 'seeking', 'find', 'goal', 'pursue'],
  'nature': ['flower', 'flowers', 'tree', 'trees', 'garden', 'fruit', 'sunset', 'sunrise', 'sky', 'mountain', 'river'],
  'ministry': ['speaker', 'preach', 'pulpit', 'ministry', 'congregation', 'serve thee', 'good news'],
  // Replacement specific tags
  'rest': ['rest', 'relax', 'relaxing', 'quiet', 'stillness', 'peaceful', 'solitude', 'retreat'],
  'eternity': ['eternity', 'eternal', 'everlasting', 'forever', 'immortal', 'hereafter'],
  'struggle': ['struggle', 'wrestling', 'battle', 'conflict', 'turmoil', 'frustrat', 'troubled', 'despair'],
  'service': ['labor', 'labors', 'laborer', 'servant', 'serving', 'toil', 'worker', 'harvest field']
};

// Auto-tag poems (require more specific matches)
function tagPoem(poem) {
  const text = (poem.title + ' ' + poem.content).toLowerCase();
  const tags = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      // Use word boundary check for short words
      if (keyword.length <= 4) {
        const regex = new RegExp('\\b' + keyword + '\\b');
        if (regex.test(text)) {
          if (!tags.includes(topic)) tags.push(topic);
          break;
        }
      } else if (text.includes(keyword)) {
        if (!tags.includes(topic)) tags.push(topic);
        break;
      }
    }
  }

  return tags;
}

// Parse year from various formats
function parseYear(yearStr) {
  if (!yearStr) return null;
  const match = yearStr.match(/(\d{4})/);
  if (match) return parseInt(match[1]);
  const shortMatch = yearStr.match(/(\d{1,2})[-\/](\d{2})$/);
  if (shortMatch) {
    const yr = parseInt(shortMatch[2]);
    return yr > 50 ? 1900 + yr : 2000 + yr;
  }
  return null;
}

// Get first line as preview
function getPreview(content, maxLen = 80) {
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.substring(0, maxLen) + '...';
}

// Process poems
const processedPoems = poems.map((poem, idx) => {
  const tags = tagPoem(poem);
  const year = parseYear(poem.year);
  return {
    ...poem,
    tags,
    parsedYear: year,
    preview: getPreview(poem.content),
    slug: `poem-${poem.id}`
  };
}).filter(p => p.content && p.content.trim());

// Sort by year
processedPoems.sort((a, b) => {
  if (!a.parsedYear && !b.parsedYear) return 0;
  if (!a.parsedYear) return 1;
  if (!b.parsedYear) return -1;
  return a.parsedYear - b.parsedYear;
});

// Get unique years and tags
const years = [...new Set(processedPoems.map(p => p.parsedYear).filter(Boolean))].sort();
const allTags = [...new Set(processedPoems.flatMap(p => p.tags))].sort();

// Assign images to poems (use their source image)
processedPoems.forEach((poem, idx) => {
  poem.decorativeImage = poem.sourceImage;
});

// Output directory (images and graphics already exist there)
const outputDir = path.join(__dirname, 'public');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Helper to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Generate the single-page app
const poemsJson = JSON.stringify(processedPoems.map(p => ({
  id: p.id,
  title: p.title || 'Untitled',
  year: p.parsedYear,
  yearRaw: p.year,
  tags: p.tags,
  content: p.content,
  preview: p.preview,
  image: p.decorativeImage
})));

const css = `
:root {
  --paper: #f5f0e6;
  --paper-light: #faf8f3;
  --ink: #1a1a1a;
  --ink-light: #5a5a5a;
  --accent: #8b4513;
  --border: #3a3a3a;
  --shadow: rgba(0,0,0,0.15);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 17px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Georgia', 'Times New Roman', serif;
  background: var(--paper);
  color: var(--ink);
  line-height: 1.6;
  min-height: 100vh;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
}

/* Typography */
.typewriter {
  font-family: 'American Typewriter', 'Courier New', monospace;
}

/* Header */
.site-header {
  text-align: center;
  padding: 2.5rem 1rem 2rem;
  border-bottom: 3px double var(--border);
  background: var(--paper-light);
}

.site-title {
  font-size: 2.2rem;
  font-weight: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.site-subtitle {
  font-style: italic;
  font-size: 1rem;
  color: var(--ink-light);
}

.author-line {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.85rem;
  margin-top: 0.75rem;
  letter-spacing: 0.05em;
}

/* Navigation */
.main-nav {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--paper-light);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.nav-btn {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--paper);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover, .nav-btn.active {
  background: var(--ink);
  color: var(--paper);
}

/* Search & Controls */
.controls {
  padding: 1.25rem;
  background: var(--paper-light);
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-box input {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--paper);
  width: 220px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent);
}

.filter-select {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border);
  background: var(--paper);
  cursor: pointer;
}

.discover-btn {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 1.25rem;
  border: 2px solid var(--accent);
  background: var(--paper);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
}

.discover-btn:hover {
  background: var(--accent);
  color: var(--paper);
}

/* Stats bar */
.stats-bar {
  text-align: center;
  padding: 0.75rem;
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.7rem;
  color: var(--ink-light);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--border);
}

/* Main content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Poem Grid */
.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.poem-card {
  background: var(--paper-light);
  border: 2px solid var(--border);
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.poem-card::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 1px solid var(--border);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.poem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow);
}

.poem-card:hover::before {
  opacity: 1;
}

.poem-card-title {
  font-size: 1rem;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.poem-card-year {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.7rem;
  color: var(--ink-light);
  margin-bottom: 0.75rem;
}

.poem-card-preview {
  font-style: italic;
  font-size: 0.9rem;
  color: var(--ink-light);
  line-height: 1.5;
}

.poem-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.mini-tag {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--ink-light);
  color: var(--ink-light);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  padding: 1rem;
}

.modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.modal {
  background: var(--paper);
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 3px solid var(--border);
  transform: translateY(20px);
  transition: transform 0.3s;
}

.modal-overlay.open .modal {
  transform: translateY(0);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-light);
  z-index: 10;
}

.modal-close:hover {
  color: var(--ink);
}

.modal-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.1);
  border-bottom: 2px solid var(--border);
}

.modal-content {
  padding: 2rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: center;
  margin-bottom: 0.5rem;
}

.modal-year {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--ink-light);
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-poem {
  white-space: pre-wrap;
  font-size: 1.05rem;
  line-height: 1.9;
  text-align: center;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.modal-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.modal-tag {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-tag:hover {
  background: var(--ink);
  color: var(--paper);
}

.modal-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.modal-nav-btn {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--paper);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-nav-btn:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.modal-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Tag cloud view */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
}

.tag-cloud-item {
  font-family: 'American Typewriter', 'Courier New', monospace;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.tag-cloud-item:hover {
  background: var(--ink);
  color: var(--paper);
}

.tag-cloud-item .count {
  display: block;
  font-size: 0.7rem;
  color: var(--ink-light);
  margin-top: 0.25rem;
}

.tag-cloud-item:hover .count {
  color: var(--paper);
}

/* Year timeline */
.year-timeline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
}

.year-item {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.year-item:hover, .year-item.active {
  background: var(--ink);
  color: var(--paper);
}

/* Gallery view */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.gallery-item {
  aspect-ratio: 4/3;
  overflow: hidden;
  border: 3px solid var(--border);
  cursor: pointer;
  position: relative;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.1);
  transition: transform 0.3s;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.gallery-item-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  color: var(--paper);
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  padding: 0.4rem;
  text-align: center;
}

/* About section */
.about-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.about-quote {
  font-style: italic;
  text-align: center;
  padding: 2rem;
  border: 2px solid var(--border);
  margin-bottom: 2rem;
  background: var(--paper-light);
}

.about-text {
  line-height: 1.8;
}

/* Footer */
.site-footer {
  text-align: center;
  padding: 2rem 1rem;
  border-top: 3px double var(--border);
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.7rem;
  color: var(--ink-light);
  letter-spacing: 0.05em;
  margin-top: 2rem;
}

.footer-ornament {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  letter-spacing: 0.4rem;
}

/* Responsive */
@media (max-width: 600px) {
  html { font-size: 15px; }
  .site-title { font-size: 1.6rem; letter-spacing: 0.08em; }
  .poem-grid { grid-template-columns: 1fr; }
  .controls { flex-direction: column; }
  .search-box input { width: 100%; }
}

/* Hidden */
.hidden { display: none !important; }

/* No results */
.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--ink-light);
  font-style: italic;
}

/* Flourish graphics */
.flourish-img {
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.85;
  max-height: 200px;
  width: auto;
}

.flourish-img.small {
  max-height: 150px;
}

.flourish-img.medium {
  max-height: 200px;
}

.flourish-img.large {
  max-height: 300px;
}

.flourish-img.tiny {
  max-height: 100px;
}

/* Background watermark */
.watermark {
  position: fixed;
  pointer-events: none;
  filter: grayscale(100%) contrast(1.1);
  opacity: 0.04;
  z-index: 0;
}

.watermark.top-left {
  top: 15%;
  left: 3%;
  max-width: 180px;
  transform: rotate(-8deg);
}

.watermark.bottom-right {
  bottom: 10%;
  right: 3%;
  max-width: 200px;
  transform: rotate(5deg);
}

/* Corner ornaments */
.corner-ornament {
  position: absolute;
  pointer-events: none;
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.2;
  max-width: 100px;
}

.corner-ornament.top-right {
  top: -15px;
  right: -15px;
}

.corner-ornament.bottom-left {
  bottom: -15px;
  left: -15px;
}

/* Scattered grid flourishes */
.grid-flourish {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  opacity: 0.7;
}

.grid-flourish img {
  filter: grayscale(100%) contrast(1.3);
  max-height: 100px;
  transition: opacity 0.3s, transform 0.3s;
}

.grid-flourish:hover img {
  opacity: 0.95;
  transform: scale(1.08);
}

/* Modal decorations */
.modal-flourish {
  text-align: center;
  padding: 1rem;
  opacity: 0.6;
}

.modal-flourish img {
  filter: grayscale(100%) contrast(1.2);
  max-height: 70px;
}

/* Section accents */
.section-accent {
  display: inline-block;
  vertical-align: middle;
  margin: 0 1rem;
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.7;
  max-height: 55px;
}

/* Tag cloud decorations */
.tag-cloud-wrapper {
  position: relative;
}

.tag-cloud-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 500px;
  opacity: 0.12;
  filter: grayscale(100%) contrast(1.2);
  pointer-events: none;
}

/* Year timeline decorations */
.timeline-wrapper {
  position: relative;
  padding: 2rem 0;
}

.timeline-ornament {
  position: absolute;
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.35;
  max-width: 220px;
  pointer-events: none;
}

.timeline-ornament.left {
  left: 2%;
  top: 50%;
  transform: translateY(-50%) rotate(-5deg);
}

.timeline-ornament.right {
  right: 2%;
  top: 50%;
  transform: translateY(-50%) rotate(5deg);
}

/* Gallery decorations */
.gallery-wrapper {
  position: relative;
  overflow: visible;
}

.gallery-corner {
  position: absolute;
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.25;
  max-width: 300px;
  pointer-events: none;
  z-index: 1;
}

.gallery-corner.top-left {
  top: -30px;
  left: -30px;
}

.gallery-corner.bottom-right {
  bottom: -30px;
  right: -30px;
  transform: rotate(180deg);
}

/* About page flourishes */
.about-wrapper {
  position: relative;
  overflow: visible;
}

.about-side-flourish {
  position: absolute;
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.3;
  max-width: 250px;
  pointer-events: none;
}

.about-side-flourish.left {
  left: -180px;
  top: 20%;
}

.about-side-flourish.right {
  right: -180px;
  bottom: 20%;
}

@media (max-width: 800px) {
  .about-side-flourish,
  .timeline-ornament,
  .gallery-corner,
  .watermark {
    display: none;
  }
}

/* Inline flourish */
.inline-flourish {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.inline-flourish img {
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.7;
  max-height: 25px;
}

/* Footer ornament */
.footer-ornament {
  margin-bottom: 0.75rem;
}

.footer-ornament img {
  filter: grayscale(100%) contrast(1.2);
  opacity: 0.5;
}

/* Book cover landing */
.book-landing {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  z-index: 2000;
  perspective: 2500px;
  transition: opacity 1.2s ease-in-out, visibility 1.2s ease-in-out;
}

.book-landing.opening {
  opacity: 0;
}

.book-landing.hidden {
  visibility: hidden;
  pointer-events: none;
}

.book-container {
  position: relative;
  transform-style: preserve-3d;
}

.book {
  position: relative;
  transform-style: preserve-3d;
  box-shadow:
    0 25px 80px rgba(0,0,0,0.8),
    0 10px 30px rgba(0,0,0,0.6);
}

.book-cover {
  position: relative;
  transform-style: preserve-3d;
  transform-origin: left center;
  transition: transform 1.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.book-landing.opening .book-cover {
  transform: rotateY(-160deg);
}

.book-cover-image {
  display: block;
  max-width: 85vw;
  max-height: 70vh;
  width: auto;
  height: auto;
  filter: grayscale(100%) contrast(1.1);
}

/* Back of the cover (visible when opening) */
.book-cover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, #d4c8b8 0%, #e8e0d4 10%, #f5f0e6 100%);
  transform: rotateY(180deg);
  backface-visibility: hidden;
}

.book-cover-image {
  backface-visibility: hidden;
}

/* Pages underneath */
.book-pages {
  position: absolute;
  top: 2px;
  left: 4px;
  right: 2px;
  bottom: 2px;
  background: linear-gradient(90deg,
    #e8e0d4 0%,
    #f5f0e6 5%,
    #f5f0e6 100%
  );
  z-index: -1;
  box-shadow: inset 5px 0 15px rgba(0,0,0,0.1);
}

.book-pages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 20px;
  background: repeating-linear-gradient(
    to bottom,
    #f5f0e6 0px,
    #f5f0e6 2px,
    #e0d8cc 2px,
    #e0d8cc 3px
  );
}

.book-read-btn {
  font-family: 'American Typewriter', 'Courier New', monospace;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  padding: 1rem 2.5rem;
  border: 1px solid rgba(255,255,255,0.4);
  background: transparent;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  transition: all 0.3s;
}

.book-read-btn:hover {
  border-color: rgba(255,255,255,0.9);
  color: rgba(255,255,255,1);
}

.book-landing.opening .book-read-btn {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 600px) {
  .book-cover-image {
    max-width: 90vw;
    max-height: 60vh;
  }

  .book-read-btn {
    font-size: 0.75rem;
    padding: 0.8rem 2rem;
  }
}

/* Image modal */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  padding: 2rem;
}

.image-modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.image-modal-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  filter: grayscale(100%) contrast(1.2);
}

.image-modal-overlay .modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  color: var(--paper);
  background: none;
  border: none;
  cursor: pointer;
}

/* Clickable grid flourishes */
.grid-flourish {
  cursor: pointer;
}

/* Large flourish for about page */
.flourish-img.xlarge {
  max-height: 300px;
  max-width: 100%;
}

@media (max-width: 600px) {
  .flourish-img.xlarge {
    max-height: 200px;
    max-width: 90%;
  }

  .about-content {
    padding: 1rem;
  }

  .about-quote {
    padding: 1.5rem 1rem;
  }

  .about-quote img {
    max-width: 80%;
    height: auto;
  }
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Melody of Thought — Poetry by J. Leland Hall</title>
  <style>${css}</style>
</head>
<body>
  <!-- Book Cover Landing -->
  <div class="book-landing" id="bookLanding">
    <div class="book-container">
      <div class="book">
        <div class="book-pages"></div>
        <div class="book-cover">
          <img src="${graphics[1]}" alt="A Melody of Thought" class="book-cover-image">
        </div>
      </div>
    </div>
    <button class="book-read-btn" id="openBookBtn">Read</button>
  </div>

  <!-- Background watermarks -->
  <img src="${graphics[3]}" alt="" class="watermark top-left">
  <img src="${graphics[4]}" alt="" class="watermark bottom-right">

  <header class="site-header">
    <h1 class="site-title">A Melody of Thought</h1>
    <p class="author-line">J. Leland Hall · 1942–1995</p>
  </header>

  <nav class="main-nav">
    <button class="nav-btn active" data-view="poems">Poems</button>
    <button class="nav-btn" data-view="about">About</button>
  </nav>

  <div class="controls" id="controls">
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Search poems...">
    </div>
    <select class="filter-select" id="tagFilter">
      <option value="">All Themes</option>
      ${allTags.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
    </select>
    <select class="filter-select" id="yearFilter">
      <option value="">All Years</option>
      ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
    </select>
    <button class="discover-btn" id="discoverBtn">✦ Discover a Poem</button>
  </div>

  <div class="stats-bar" id="statsBar">
    Showing <span id="visibleCount">${processedPoems.length}</span> of ${processedPoems.length} poems
  </div>

  <main class="main-content" id="mainContent">
    <!-- Content loaded by JS -->
  </main>

  <!-- Poem Modal -->
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal">
      <button class="modal-close" id="modalClose">×</button>
      <img class="modal-image" id="modalImage" src="" alt="">
      <div class="modal-content">
        <h2 class="modal-title" id="modalTitle"></h2>
        <p class="modal-year" id="modalYear"></p>
        <div class="modal-poem" id="modalPoem"></div>
        <div class="modal-flourish">
          <img src="${graphics[10]}" alt="">
        </div>
        <div class="modal-tags" id="modalTags"></div>
        <div class="modal-nav">
          <button class="modal-nav-btn" id="prevPoem">← Previous</button>
          <button class="modal-nav-btn" id="nextPoem">Next →</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Modal -->
  <div class="image-modal-overlay" id="imageModalOverlay">
    <button class="modal-close" id="imageModalClose">×</button>
    <img class="image-modal-img" id="imageModalImg" src="" alt="">
  </div>

  <footer class="site-footer">
    <div class="footer-ornament">
      <img src="${graphics[6]}" alt="" class="flourish-img tiny">
    </div>
    <p>The poetry of J. Leland Hall</p>
    <p>${processedPoems.length} poems preserved for future generations</p>
  </footer>

  <script>
    const poems = ${poemsJson};
    const allImages = ${JSON.stringify(allImages)};
    const graphics = ${JSON.stringify(graphics)};

    let currentView = 'poems';
    let filteredPoems = [...poems];
    let currentPoemIndex = -1;

    // DOM elements
    const mainContent = document.getElementById('mainContent');
    const modalOverlay = document.getElementById('modalOverlay');
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const yearFilter = document.getElementById('yearFilter');
    const statsBar = document.getElementById('statsBar');
    const controls = document.getElementById('controls');

    // Initialize
    function init() {
      renderPoemGrid();
      setupEventListeners();
      setupBookLanding();
    }

    // Book landing
    function setupBookLanding() {
      const bookLanding = document.getElementById('bookLanding');
      const openBookBtn = document.getElementById('openBookBtn');

      openBookBtn.addEventListener('click', () => {
        bookLanding.classList.add('opening');
        setTimeout(() => {
          bookLanding.classList.add('hidden');
        }, 1400);
      });
    }

    // Event listeners
    function setupEventListeners() {
      // Navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentView = btn.dataset.view;
          renderView();
        });
      });

      // Search
      searchInput.addEventListener('input', debounce(filterPoems, 200));
      tagFilter.addEventListener('change', filterPoems);
      yearFilter.addEventListener('change', filterPoems);

      // Discover
      document.getElementById('discoverBtn').addEventListener('click', discoverRandomPoem);

      // Modal
      document.getElementById('modalClose').addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
      document.getElementById('prevPoem').addEventListener('click', () => navigatePoem(-1));
      document.getElementById('nextPoem').addEventListener('click', () => navigatePoem(1));

      // Keyboard
      document.addEventListener('keydown', (e) => {
        if (modalOverlay.classList.contains('open')) {
          if (e.key === 'Escape') closeModal();
          if (e.key === 'ArrowLeft') navigatePoem(-1);
          if (e.key === 'ArrowRight') navigatePoem(1);
        }
      });
    }

    // Render views
    function renderView() {
      controls.classList.toggle('hidden', currentView === 'about' || currentView === 'gallery');
      statsBar.classList.toggle('hidden', currentView !== 'poems');

      switch (currentView) {
        case 'poems': renderPoemGrid(); break;
        case 'themes': renderThemes(); break;
        case 'years': renderYears(); break;
        case 'gallery': renderGallery(); break;
        case 'about': renderAbout(); break;
      }
    }

    function renderPoemGrid() {
      if (filteredPoems.length === 0) {
        mainContent.innerHTML = '<div class="no-results">No poems found matching your search.</div>';
        return;
      }

      // Scatter flourishes throughout the grid
      const flourishPositions = [7, 18, 31, 45, 62, 80, 99, 120, 145, 170];
      const flourishGraphics = [graphics[2], graphics[6], graphics[7], graphics[8], graphics[10], graphics[11]];

      let html = '<div class="poem-grid">';
      filteredPoems.forEach((poem, idx) => {
        // Insert a flourish at certain positions
        const flourishIdx = flourishPositions.indexOf(idx);
        if (flourishIdx !== -1 && flourishIdx < flourishGraphics.length) {
          html += \`<div class="grid-flourish" onclick="openImageModal('\${flourishGraphics[flourishIdx]}')"><img src="\${flourishGraphics[flourishIdx]}" alt=""></div>\`;
        }

        html += \`
          <div class="poem-card" onclick="openPoem(\${poem.id})">
            <h3 class="poem-card-title">\${escapeHtml(poem.title)}</h3>
            \${poem.year ? \`<div class="poem-card-year">\${poem.year}</div>\` : ''}
            <p class="poem-card-preview">\${escapeHtml(poem.preview)}</p>
            <div class="poem-card-tags">
              \${poem.tags.map(t => \`<span class="mini-tag">\${t}</span>\`).join('')}
            </div>
          </div>
        \`;
      });
      html += '</div>';

      mainContent.innerHTML = html;
      document.getElementById('visibleCount').textContent = filteredPoems.length;
    }

    function renderThemes() {
      const tagCounts = {};
      poems.forEach(p => p.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));

      mainContent.innerHTML = \`
        <div class="tag-cloud-wrapper">
          <img src="\${graphics[3]}" alt="" class="tag-cloud-bg">
          <div class="tag-cloud">
            \${Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => \`
                <div class="tag-cloud-item" onclick="filterByTag('\${tag}')" style="font-size: \${0.8 + (count / 50)}rem">
                  \${tag.charAt(0).toUpperCase() + tag.slice(1)}
                  <span class="count">\${count} poems</span>
                </div>
              \`).join('')}
          </div>
        </div>
      \`;
    }

    function renderYears() {
      const yearCounts = {};
      poems.forEach(p => {
        if (p.year) yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
      });

      const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);

      mainContent.innerHTML = \`
        <div class="timeline-wrapper">
          <img src="\${graphics[2]}" alt="" class="timeline-ornament left">
          <img src="\${graphics[6]}" alt="" class="timeline-ornament right">
          <div class="year-timeline">
            \${sortedYears.map(year => \`
              <div class="year-item" onclick="filterByYear(\${year})">
                \${year} <small>(\${yearCounts[year]})</small>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    }

    function renderGallery() {
      mainContent.innerHTML = \`
        <div class="gallery-wrapper">
          <img src="\${graphics[7]}" alt="" class="gallery-corner top-left">
          <img src="\${graphics[10]}" alt="" class="gallery-corner bottom-right">
          <div class="gallery-grid">
            \${allImages.map((img, idx) => \`
              <div class="gallery-item" onclick="openGalleryImage(\${idx})">
                <img src="images/\${img}" alt="Manuscript page" loading="lazy">
                <div class="gallery-item-label">\${img.replace('book-', 'Book ').replace('/', ' · ').replace('.jpg', '').replace('page-', 'Page ')}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    }

    function renderAbout() {
      mainContent.innerHTML = \`
        <div class="about-wrapper">
          <img src="\${graphics[8]}" alt="" class="about-side-flourish left">
          <img src="\${graphics[11]}" alt="" class="about-side-flourish right">
          <div class="about-content">
            <div class="about-quote">
              <img src="\${graphics[2]}" alt="" class="flourish-img xlarge" style="margin-bottom: 1.5rem; opacity: 0.7;">
              <p>"Over the years I have felt the urge in moments of reflection, to 'poemize'.
              Everyone must feel this way occasionally.</p>
              <p>This compilation has collected in my files, and represents a variety of subjects and moods.</p>
              <p>As your thoughts shall share moments with my thoughts, may your life be strengthened."</p>
              <p style="margin-top: 1rem;"><em>— J. Leland Hall, Clarksville, Arkansas, 1957</em></p>
            </div>
            <div class="about-text">
              <p>This digital archive preserves the poetry of <strong>J. Leland Hall</strong>, written between 1942 and 1995.</p>
              <br>
              <p>The poems were originally collected in hand-typed booklets, photocopied and shared with family and friends. The collection spans over five decades of verse, touching on themes of faith, family, service, and the quiet moments of reflection that mark a life well-lived.</p>
              <br>
              <p>This website was created to honor his memory and ensure these words continue to be shared with future generations.</p>
              <br>
              <p style="text-align: center; margin-top: 2rem;">
                <img src="\${graphics[9]}" alt="" class="flourish-img tiny" style="opacity: 0.4; margin-bottom: 0.5rem;"><br>
                <strong>\${poems.length} poems</strong> from <strong>\${allImages.length} original pages</strong>
              </p>
            </div>
          </div>
        </div>
      \`;
    }

    // Filtering
    function filterPoems() {
      const search = searchInput.value.toLowerCase();
      const tag = tagFilter.value;
      const year = yearFilter.value;

      filteredPoems = poems.filter(p => {
        const matchesSearch = !search ||
          p.title.toLowerCase().includes(search) ||
          p.content.toLowerCase().includes(search);
        const matchesTag = !tag || p.tags.includes(tag);
        const matchesYear = !year || p.year == year;
        return matchesSearch && matchesTag && matchesYear;
      });

      if (currentView === 'poems') renderPoemGrid();
    }

    function filterByTag(tag) {
      tagFilter.value = tag;
      yearFilter.value = '';
      searchInput.value = '';
      filterPoems();
      document.querySelector('[data-view="poems"]').click();
    }

    function filterByYear(year) {
      yearFilter.value = year;
      tagFilter.value = '';
      searchInput.value = '';
      filterPoems();
      document.querySelector('[data-view="poems"]').click();
    }

    // Modal
    function openPoem(id) {
      const poem = poems.find(p => p.id === id);
      if (!poem) return;

      currentPoemIndex = filteredPoems.findIndex(p => p.id === id);

      document.getElementById('modalImage').src = 'images/' + poem.image;
      document.getElementById('modalTitle').textContent = poem.title;
      document.getElementById('modalYear').textContent = poem.year || '';
      document.getElementById('modalPoem').textContent = poem.content;
      document.getElementById('modalTags').innerHTML = poem.tags.map(t =>
        \`<span class="modal-tag" onclick="filterByTag('\${t}'); closeModal();">\${t}</span>\`
      ).join('');

      updateNavButtons();
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function navigatePoem(dir) {
      const newIndex = currentPoemIndex + dir;
      if (newIndex >= 0 && newIndex < filteredPoems.length) {
        openPoem(filteredPoems[newIndex].id);
      }
    }

    function updateNavButtons() {
      document.getElementById('prevPoem').disabled = currentPoemIndex <= 0;
      document.getElementById('nextPoem').disabled = currentPoemIndex >= filteredPoems.length - 1;
    }

    function discoverRandomPoem() {
      const randomPoem = poems[Math.floor(Math.random() * poems.length)];
      filteredPoems = poems;
      openPoem(randomPoem.id);
    }

    function openGalleryImage(idx) {
      // Find poems from this image
      const img = allImages[idx];
      const poemsFromImage = poems.filter(p => p.image === img);
      if (poemsFromImage.length > 0) {
        filteredPoems = poemsFromImage;
        openPoem(poemsFromImage[0].id);
      }
    }

    // Image modal
    const imageModalOverlay = document.getElementById('imageModalOverlay');

    function openImageModal(src) {
      document.getElementById('imageModalImg').src = src;
      imageModalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
      imageModalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.getElementById('imageModalClose').addEventListener('click', closeImageModal);
    imageModalOverlay.addEventListener('click', (e) => {
      if (e.target === imageModalOverlay) closeImageModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageModalOverlay.classList.contains('open')) {
        closeImageModal();
      }
    });

    // Utilities
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    }

    init();
  </script>
</body>
</html>`;

// Write single page app
fs.writeFileSync(path.join(outputDir, 'index.html'), html);

console.log('Building website...');
console.log(`Found ${processedPoems.length} poems`);
console.log(`Found ${allImages.length} images`);
console.log(`Tags: ${allTags.join(', ')}`);
console.log(`Years: ${years[0]} - ${years[years.length - 1]}`);
console.log('\nWebsite built successfully!');
console.log(`Output: ${outputDir}`);
