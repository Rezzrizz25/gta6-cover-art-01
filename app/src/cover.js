// Vice Cover Studio — cover renderer.
//
// Draws a GTA-poster-style multi-panel cover onto a canvas: 1-4 photo
// panels with per-panel crop (zoom + pan), a colour grade built from canvas
// filters and gradient overlays (no external assets), bold stroked poster
// lettering with an optional diagonal banner, and original vector palm
// silhouettes. Everything is drawn from the photos the user supplies plus
// code — no Rockstar logo, artwork or fonts, system font stack only.

export const GRADES = {
  sunset: {
    label: 'Vice City Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    top: 'rgba(255, 94, 120, 0.20)',
    bottom: 'rgba(255, 140, 66, 0.45)',
    glow: 'rgba(255, 190, 90, 0.30)',
    accent: '#ff5e78',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.12) brightness(0.98)',
    top: 'rgba(255, 0, 170, 0.28)',
    bottom: 'rgba(0, 229, 255, 0.34)',
    glow: 'rgba(180, 0, 255, 0.28)',
    accent: '#00e5ff',
  },
  palm: {
    label: 'Palm Dusk',
    filter: 'saturate(1.15) contrast(1.06) sepia(0.18) brightness(1.01)',
    top: 'rgba(0, 128, 128, 0.22)',
    bottom: 'rgba(255, 183, 77, 0.38)',
    glow: 'rgba(255, 214, 130, 0.26)',
    accent: '#ffb74d',
  },
  vice: {
    label: 'Vice Glow',
    filter: 'saturate(1.45) contrast(1.10) brightness(1.00) hue-rotate(-12deg)',
    top: 'rgba(124, 58, 237, 0.30)',
    bottom: 'rgba(255, 46, 136, 0.38)',
    glow: 'rgba(168, 85, 247, 0.32)',
    accent: '#c084fc',
  },
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

/** Panel rectangles for n panels on a w x h cover. GTA-poster grid. */
export function layoutPanels(w, h, n) {
  if (n <= 1) return [[0, 0, w, h]];
  if (n === 2) return [[0, 0, w / 2, h], [w / 2, 0, w / 2, h]];
  if (n === 3) {
    // Wide covers: tall panel left, two stacked right — keeps faces intact.
    // Tall covers: wide panel on top, two below.
    if (w > h) {
      return [
        [0, 0, w * 0.55, h],
        [w * 0.55, 0, w * 0.45, h / 2],
        [w * 0.55, h / 2, w * 0.45, h / 2],
      ];
    }
    return [
      [0, 0, w, h * 0.55],
      [0, h * 0.55, w / 2, h * 0.45],
      [w / 2, h * 0.55, w / 2, h * 0.45],
    ];
  }
  return [
    [0, 0, w / 2, h / 2],
    [w / 2, 0, w / 2, h / 2],
    [0, h / 2, w / 2, h / 2],
    [w / 2, h / 2, w / 2, h / 2],
  ];
}

/** Cover-fits one panel image with zoom (1..2.5) and pan offsets (-1..1). */
function drawPanelImage(ctx, img, rect, panel) {
  const [x, y, rw, rh] = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = x + (rw - pw) / 2 + (panel.ox ?? 0) * rw * 0.25;
  const dy = y + (rh - ph) / 2 + (panel.oy ?? 0) * rh * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, rw, rh);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** Applies one colour grade over a clipped panel rectangle. */
function gradePanel(ctx, rect, grade) {
  const [x, y, rw, rh] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, rw, rh);
  ctx.clip();
  const wash = ctx.createLinearGradient(x, y, x, y + rh);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, rw, rh);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, rw, rh);
  ctx.globalCompositeOperation = 'source-over';
  const glow = ctx.createRadialGradient(
    x + rw / 2, y + rh * 0.18, 0,
    x + rw / 2, y + rh * 0.18, rw * 0.7,
  );
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, rw, rh);
  const vig = ctx.createRadialGradient(
    x + rw / 2, y + rh / 2, Math.min(rw, rh) * 0.45,
    x + rw / 2, y + rh / 2, Math.max(rw, rh) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, rw, rh);
  ctx.restore();
}

/** One original palm silhouette: a curved trunk and drooping fronds. */
function drawPalm(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = 'rgba(12, 5, 20, 0.95)';
  ctx.fillStyle = 'rgba(12, 5, 20, 0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, 22, -105);
  ctx.stroke();
  // Fronds fan out over the upper half only, drooping at the tips, so the
  // silhouette reads as a palm instead of a spider.
  ctx.lineWidth = 8;
  const topX = 22;
  const topY = -105;
  for (let i = 0; i < 7; i++) {
    const a = (-175 + i * 29) * Math.PI / 180;
    const len = 58 - Math.abs(i - 3) * 7;
    const cx = topX + Math.cos(a) * len * 0.62;
    const cy = topY + Math.sin(a) * len * 0.5 - 10;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len + 30;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - 3, topY + 3, 6, 0, Math.PI * 2);
  ctx.arc(topX + 6, topY + 1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Bold stroked poster title + letterspaced subtitle, optional banner. */
function drawLettering(ctx, w, h, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (!title && !subtitle) return;
  const unit = Math.min(w, h);
  const pos = state.titlePos || 'bottom';
  const cy = pos === 'top' ? h * 0.20 : pos === 'center' ? h * 0.50 : h * 0.82;

  if (title) {
    let size = unit * 0.115 * (state.titleSize ?? 1);
    const font = (s) => `900 ${s}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`;
    ctx.font = font(size);
    while (ctx.measureText(title).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = font(size);
    }
    ctx.save();
    ctx.translate(w / 2, cy);
    if (state.banner) {
      ctx.save();
      ctx.rotate(-0.045);
      const bw = Math.min(w * 0.96, ctx.measureText(title).width + size * 1.1);
      const bh = size * 1.28;
      const band = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      band.addColorStop(0, '#ff2e88');
      band.addColorStop(0.55, '#ff7a3d');
      band.addColorStop(1, grade.accent);
      ctx.fillStyle = band;
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = size * 0.25;
      ctx.shadowOffsetY = size * 0.08;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size * 0.14);
    ctx.strokeStyle = '#14060f';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.06;
    ctx.strokeText(title, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
    if (subtitle) drawSubtitle(ctx, w, cy + size * 0.95, unit, subtitle, grade);
  } else if (subtitle) {
    drawSubtitle(ctx, w, cy, unit, subtitle, grade);
  }
}

function drawSubtitle(ctx, w, y, unit, subtitle, grade) {
  const size = Math.max(14, unit * 0.032);
  ctx.save();
  ctx.font = `800 ${size}px "Arial Black", Impact, Arial, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.42)}px`; } catch { /* older canvas */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size * 0.18);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,4,18,0.9)';
  ctx.fillStyle = '#ffffff';
  ctx.strokeText(subtitle, w / 2, y);
  ctx.fillText(subtitle, w / 2, y);
  const tw = ctx.measureText(subtitle).width;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w / 2 - tw / 2 - size * 1.6, y - size * 0.09, size * 1.1, size * 0.18);
  ctx.fillRect(w / 2 + tw / 2 + size * 0.5, y - size * 0.09, size * 1.1, size * 0.18);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  ctx.restore();
}

/**
 * Draws the whole cover.
 * @param {HTMLCanvasElement} canvas
 * @param {object} state {grade, title, subtitle, titleSize, titlePos, banner, palms, panels:[{zoom,ox,oy,grade}]}
 * @param {Array<HTMLImageElement|null>} images one per panel, same order as state.panels
 */
export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = state.panels || [];
  const rects = layoutPanels(w, h, Math.max(1, panels.length));
  const gutter = Math.max(3, Math.round(w * 0.006));

  ctx.save();
  ctx.filter = 'none';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const [x, y, rw, rh] = rect;
    const inner = [x + gutter / 2, y + gutter / 2, rw - gutter, rh - gutter];
    const img = images[i];
    if (img) {
      ctx.save();
      ctx.filter = grade.filter;
      drawPanelImage(ctx, img, inner, panels[i] || {});
      ctx.restore();
    } else {
      ctx.fillStyle = '#2b1838';
      ctx.fillRect(inner[0], inner[1], inner[2], inner[3]);
    }
    gradePanel(ctx, inner, GRADES[(panels[i] && panels[i].grade) || state.grade] || grade);
  });
  ctx.restore();

  // Thin poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);

  if (state.palms) {
    const s = Math.min(w, h) / 780;
    drawPalm(ctx, w * 0.015, h * 0.995, s * 1.15, false);
    drawPalm(ctx, w * 0.985, h * 0.995, s * 0.95, true);
  }
  drawLettering(ctx, w, h, state, grade);
}
