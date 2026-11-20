// Fixed scenes for screenshots.
// ?shot=cover shows the exported cover alone; ?shot=editor shows the app
// with photos loaded. Query params: panels (comma list of sample ids),
// grade (sunset|neon|palm), caption (title), subtitle, size (1080x1080,
// 1080x1350, 1920x1080), pos (top|center|bottom), banner (0|1), palms (0|1).
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, applyPreset) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const panels = (query.get('panels') || 'neon-street,sunset-convertible,boulevard,pier')
    .split(',').map((s) => s.trim()).filter(Boolean)
    .map((id) => `samples/${id}.jpg`);
  await applyPreset({
    size: query.get('size') || '1080x1080',
    grade: query.get('grade') || 'sunset',
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Neon Boulevard',
    titlePos: query.get('pos') || 'bottom',
    banner: query.get('banner') !== '0',
    palms: query.get('palms') !== '0',
    panels,
  });
  if (shot === 'cover') fitCoverToViewport();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** In cover mode the canvas keeps its aspect inside the screenshot window. */
function fitCoverToViewport() {
  const canvas = document.getElementById('cover');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / canvas.width, vh / canvas.height);
  canvas.style.width = `${Math.round(canvas.width * scale)}px`;
  canvas.style.height = `${Math.round(canvas.height * scale)}px`;
}
