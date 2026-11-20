// Vice Cover Studio — editor wiring.
//
// State lives in one object; every control edits it and calls redraw().
// Photos never leave the machine: uploads use object URLs, samples are
// local files, export renders an offscreen canvas and downloads a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
// Shortcuts: Ctrl/Cmd+E exports the current cover; D duplicates the
// selected panel (max 4 panels).

import { drawCover, GRADES, SIZES, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

export const SAMPLES = [
  { id: 'neon-street', label: 'Neon Street', src: 'samples/neon-street.jpg' },
  { id: 'sunset-convertible', label: 'Sunset Convertible', src: 'samples/sunset-convertible.jpg' },
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
];

const DEFAULT_PANELS = [
  { src: 'samples/neon-street.jpg', zoom: 1, ox: 0, oy: 0, grade: null },
  { src: 'samples/sunset-convertible.jpg', zoom: 1, ox: 0, oy: 0, grade: null },
  { src: 'samples/boulevard.jpg', zoom: 1, ox: 0, oy: 0, grade: null },
  { src: 'samples/pier.jpg', zoom: 1, ox: 0, oy: 0, grade: null },
];

export const state = {
  size: '1080x1080',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'NEON BOULEVARD',
  titleSize: 1,
  titlePos: 'bottom',
  banner: true,
  palms: true,
  panels: DEFAULT_PANELS.slice(0, 4).map((p) => ({ ...p })),
  selected: 0,
};

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const imageCache = new Map();

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imageCache.set(url, img); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

async function panelImages() {
  return Promise.all(state.panels.map((p) => (p.src ? loadImage(p.src).catch(() => null) : null)));
}

export async function redraw() {
  const images = await panelImages();
  drawCover(canvas, state, images);
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/** Applies a full preset (used by shots and the one-click sample export). */
export async function applyPreset(preset) {
  if (preset.size && SIZES[preset.size]) state.size = preset.size;
  if (preset.grade && GRADES[preset.grade]) state.grade = preset.grade;
  if (preset.title !== undefined) state.title = preset.title;
  if (preset.subtitle !== undefined) state.subtitle = preset.subtitle;
  if (preset.titlePos) state.titlePos = preset.titlePos;
  if (preset.banner !== undefined) state.banner = preset.banner;
  if (preset.palms !== undefined) state.palms = preset.palms;
  if (preset.panels) {
    state.panels = preset.panels.map((p) => (typeof p === 'string'
      ? { src: p, zoom: 1, ox: 0, oy: 0, grade: null }
      : { src: p.src, zoom: p.zoom ?? 1, ox: p.ox ?? 0, oy: p.oy ?? 0, grade: p.grade ?? null }));
    state.selected = 0;
  }
  syncControls();
  applySize();
  await redraw();
}

/** Renders the current state at an exact export size and downloads the PNG. */
export async function exportCover(sizeKey) {
  const size = SIZES[sizeKey] || SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const images = await panelImages();
  drawCover(off, { ...state }, images);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      setStatus(`Saved vice-cover-${size.w}x${size.h}.png`);
      resolve(a.download);
    }, 'image/png');
  });
}

/** Copies the selected panel (photo, crop and grade) as a new panel. */
export function duplicatePanel() {
  if (state.panels.length >= 4) return false;
  const copy = { ...state.panels[state.selected] };
  state.panels.splice(state.selected + 1, 0, copy);
  state.selected = state.selected + 1;
  buildPanelTabs();
  syncPanelControls();
  redraw();
  return true;
}

function applySize() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
}

// ---- controls ----

function buildGradeButtons() {
  const box = document.getElementById('grades');
  box.innerHTML = '';
  Object.entries(GRADES).forEach(([key, g]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade' + (state.grade === key ? ' active' : '');
    b.dataset.grade = key;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${g.top.replace(/[\d.]+\)$/, '0.9)')},${g.bottom.replace(/[\d.]+\)$/, '0.9)')})"></span>${g.label}`;
    b.addEventListener('click', () => {
      state.grade = key;
      buildGradeButtons();
      redraw();
    });
    box.appendChild(b);
  });
}

function buildSampleThumbs() {
  const box = document.getElementById('samples');
  box.innerHTML = '';
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = s.label;
    b.innerHTML = `<img src="${s.src}" alt="${s.label}">`;
    b.addEventListener('click', () => {
      state.panels[state.selected].src = s.src;
      syncPanelControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function buildPanelTabs() {
  const box = document.getElementById('panel-tabs');
  box.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (state.selected === i ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => {
      state.selected = i;
      buildPanelTabs();
      syncPanelControls();
    });
    box.appendChild(b);
  });
  document.getElementById('add-panel').disabled = state.panels.length >= 4;
  document.getElementById('remove-panel').disabled = state.panels.length <= 1;
  document.getElementById('duplicate-panel').disabled = state.panels.length >= 4;
}

function syncPanelControls() {
  const p = state.panels[state.selected];
  const photoSel = document.getElementById('panel-photo');
  photoSel.innerHTML = '';
  SAMPLES.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.src;
    o.textContent = s.label;
    photoSel.appendChild(o);
  });
  if (p.src && !SAMPLES.some((s) => s.src === p.src)) {
    const o = document.createElement('option');
    o.value = p.src;
    o.textContent = 'Uploaded photo';
    photoSel.appendChild(o);
  }
  photoSel.value = p.src || '';
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('zoom-val').textContent = `${Math.round(p.zoom * 100)}%`;
  document.getElementById('pan-x').value = p.ox;
  document.getElementById('pan-y').value = p.oy;
  const gradeSel = document.getElementById('panel-grade');
  gradeSel.value = p.grade || '';
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('title-size').value = state.titleSize;
  document.getElementById('title-size-val').textContent = `${Math.round(state.titleSize * 100)}%`;
  document.getElementById('title-pos').value = state.titlePos;
  document.getElementById('banner').checked = state.banner;
  document.getElementById('palms').checked = state.palms;
  buildGradeButtons();
  buildPanelTabs();
  syncPanelControls();
}

function bindControls() {
  document.getElementById('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const file of files) {
      const url = URL.createObjectURL(file);
      await loadImage(url);
      if (state.panels.length < 4 && state.panels[state.selected].src) {
        state.panels.push({ src: url, zoom: 1, ox: 0, oy: 0, grade: null });
        state.selected = state.panels.length - 1;
      } else {
        state.panels[state.selected].src = url;
      }
    }
    buildPanelTabs();
    syncPanelControls();
    redraw();
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — drag on the preview to reposition.`);
  });

  document.getElementById('panel-photo').addEventListener('change', (e) => {
    state.panels[state.selected].src = e.target.value;
    redraw();
  });
  document.getElementById('panel-grade').addEventListener('change', (e) => {
    state.panels[state.selected].grade = e.target.value || null;
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    document.getElementById('zoom-val').textContent = `${Math.round(state.panels[state.selected].zoom * 100)}%`;
    redraw();
  });
  document.getElementById('pan-x').addEventListener('input', (e) => {
    state.panels[state.selected].ox = Number(e.target.value);
    redraw();
  });
  document.getElementById('pan-y').addEventListener('input', (e) => {
    state.panels[state.selected].oy = Number(e.target.value);
    redraw();
  });
  document.getElementById('fit-panel').addEventListener('click', () => {
    const p = state.panels[state.selected];
    p.zoom = 1; p.ox = 0; p.oy = 0;
    syncPanelControls();
    redraw();
  });
  document.getElementById('add-panel').addEventListener('click', () => {
    if (state.panels.length >= 4) return;
    state.panels.push({ ...DEFAULT_PANELS[state.panels.length] });
    state.selected = state.panels.length - 1;
    buildPanelTabs();
    syncPanelControls();
    redraw();
  });
  document.getElementById('remove-panel').addEventListener('click', () => {
    if (state.panels.length <= 1) return;
    state.panels.splice(state.selected, 1);
    state.selected = Math.max(0, state.selected - 1);
    buildPanelTabs();
    syncPanelControls();
    redraw();
  });
  document.getElementById('duplicate-panel').addEventListener('click', () => {
    if (duplicatePanel()) setStatus(`Panel ${state.selected + 1} duplicated.`);
  });

  document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  document.getElementById('title-size').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    document.getElementById('title-size-val').textContent = `${Math.round(state.titleSize * 100)}%`;
    redraw();
  });
  document.getElementById('title-pos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
  document.getElementById('banner').addEventListener('change', (e) => { state.banner = e.target.checked; redraw(); });
  document.getElementById('palms').addEventListener('change', (e) => { state.palms = e.target.checked; redraw(); });

  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      applySize();
      redraw();
    });
  });
  document.getElementById('export').addEventListener('click', () => exportCover(state.size));
  document.getElementById('quick-export').addEventListener('click', async () => {
    await applyPreset({
      size: '1080x1080', grade: 'sunset', title: 'SUNSET HEIST', subtitle: 'NEON BOULEVARD',
      titlePos: 'bottom', banner: true, palms: true,
      panels: SAMPLES.map((s) => s.src),
    });
    await exportCover('1080x1080');
  });

  // Keyboard shortcuts: Ctrl/Cmd+E exports, D duplicates the selected panel.
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
    if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      exportCover(state.size);
    } else if (!typing && (e.key === 'd' || e.key === 'D')) {
      if (duplicatePanel()) setStatus(`Panel ${state.selected + 1} duplicated.`);
    }
  });

  // Drag to pan the selected panel, wheel to zoom it.
  let dragging = null;
  const panelAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * canvas.width;
    const py = (e.clientY - r.top) / r.height * canvas.height;
    const rects = layoutPanels(canvas.width, canvas.height, state.panels.length);
    const i = rects.findIndex(([x, y, w, h]) => px >= x && px < x + w && py >= y && py < y + h);
    return i < 0 ? 0 : i;
  };
  canvas.addEventListener('pointerdown', (e) => {
    state.selected = panelAt(e);
    buildPanelTabs();
    syncPanelControls();
    dragging = { x: e.clientX, y: e.clientY, ox: state.panels[state.selected].ox, oy: state.panels[state.selected].oy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = state.panels[state.selected];
    const r = canvas.getBoundingClientRect();
    p.ox = Math.max(-1, Math.min(1, dragging.ox + (e.clientX - dragging.x) / r.width * 2));
    p.oy = Math.max(-1, Math.min(1, dragging.oy + (e.clientY - dragging.y) / r.height * 2));
    syncPanelControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    p.zoom = Math.max(1, Math.min(2.5, p.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    syncPanelControls();
    redraw();
  }, { passive: false });
}

buildSampleThumbs();
bindControls();
syncControls();
applySize();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), applyPreset);
} else {
  redraw();
}
