// Browser boot: a canvas, the keyboard, sound and a frame loop. Everything else is headless.

import { GLOWING, PALETTE } from './engine/palette';
import { Renderer, SH, SW } from './engine/render';
import { Shell } from './engine/shell';
import { behaviours } from './game/behaviours';
import { content } from './game/content';
import { Music, measure } from './music';
import { playSound, unlockSound } from './sound';
import { isTouchDevice, setupBar, setupPointer, setupTouch } from './touch';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
canvas.width = SW;
canvas.height = SH;
const ctx = canvas.getContext('2d')!;
const image = ctx.createImageData(SW, SH);
const rgba = new Uint32Array(image.data.buffer);
const pal32 = new Uint32Array(256);
PALETTE.forEach((c, i) => (pal32[i] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]));
// The same palette at eight depths of night: darker and bluer, except for things that glow.
const NIGHTS = 8;
const nightPal = Array.from({ length: NIGHTS + 1 }, (_, k) => {
  const n = k / NIGHTS;
  const pal = new Uint32Array(256);
  PALETTE.forEach((c, i) => {
    const lit = GLOWING.has(i);
    const r = Math.round(c[0] * (lit ? 1 : 1 - 0.6 * n));
    const g = Math.round(c[1] * (lit ? 1 : 1 - 0.48 * n));
    const b = Math.round(c[2] * (lit ? 1 : 1 - 0.2 * n));
    pal[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  });
  return pal;
});
const PIC_TOP = 8;
const PIC_BOTTOM = 176;

const store = {
  get: (k: string): string | null => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string): void => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // Storage may be full or disabled; the game still runs, it just cannot save.
    }
  },
};

const shell = new Shell(content, store, import.meta.env.DEV, behaviours);
shell.showTitle();
const renderer = new Renderer();
const music = new Music(content.music);
/** Sound may only start after a key or tap; this is called from both. */
const wake = (): void => music.attach(unlockSound());

const touch = isTouchDevice();
const bar = document.getElementById('bar')!;
/**
 * The buttons that offer what can be done, where there is a keyboard: how tall one is, the gap
 * between rows of them, the gap between them and the picture, and how wide they are as a column.
 * The first three are the stylesheet's own figures.
 */
const BAR = { row: 28, gap: 6, clear: 10, side: 184 };

/**
 * Largest whole-pixel scale that fits the window, leaving room for the touch controls if shown,
 * or else for the buttons that offer what can be done.
 */
function fit(): void {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  // On phones the visible height shrinks when the on-screen keyboard opens.
  const vh = window.visualViewport?.height ?? window.innerHeight;
  let w = vw;
  let h = vh;
  if (touch) {
    document.body.style.height = `${vh}px`;
    const landscape = vw > vh;
    // Sideways, the pad and buttons sit either side of the picture; upright, they sit below it.
    if (landscape) w -= 2 * 156;
    h -= (document.getElementById('ui')?.offsetHeight ?? 0) + 24;
    // Upright, the pad is pinned to the foot of the screen and takes no room in the column above it.
    const pads = document.getElementById('pads');
    if (!landscape && pads && getComputedStyle(pads).position === 'fixed') h -= pads.offsetHeight + 30;
    // And it leaves the panel that shows the words between picture and controls room to be read.
    if (!landscape && !document.documentElement.classList.contains('typing')) h -= 120;
  }
  // With a keyboard, snap to whole device pixels for even lettering. On a phone, size matters more:
  // fill the width.
  const snap = (exact: number): number => Math.max(1, Math.floor(exact * dpr)) / dpr;
  let scale = Math.max(0.5, Math.min(w / SW, h / SH));
  if (!touch) {
    // The offers go in a row under the picture. A window too short to hold both without the
    // picture dropping a size, but with width to spare, has them in a column beside it instead.
    const under = snap(Math.min(w / SW, (h - BAR.clear - BAR.row) / SH));
    const beside = snap(Math.min((w - BAR.clear - BAR.side) / SW, h / SH));
    const side = beside > under;
    scale = side ? beside : under;
    // Its size is fixed here, so that nothing moves as the buttons come and go: the picture's
    // width and one row of buttons, or two where there is room for a second.
    const two = 2 * BAR.row + BAR.gap;
    document.documentElement.classList.toggle('beside', side);
    bar.style.width = `${side ? BAR.side : SW * scale}px`;
    bar.style.height = `${side ? SH * scale : h - SH * scale - BAR.clear >= two ? two : BAR.row}px`;
  }
  canvas.style.width = `${SW * scale}px`;
  canvas.style.height = `${SH * scale}px`;
}
if (touch) setupTouch(shell, renderer, canvas, fit);
else setupBar(shell);
setupPointer(shell, renderer, canvas);
window.addEventListener('resize', fit);
fit();

window.addEventListener('keydown', (e) => {
  wake();
  // Typing in the touch command field is handled by the field itself.
  if (e.target instanceof HTMLInputElement && e.target.id !== 'ime') return;
  // A Korean (or other) input method is composing: the hidden field below takes it, not the game keys.
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) return;
  if (e.metaKey || e.altKey || (e.ctrlKey && e.key !== 'Control')) return;
  // A held arrow key repeats; only the first press counts, so walking can be halted at a door.
  if (e.repeat && (e.key.startsWith('Arrow') || e.key === 'Control' || e.key === 'Shift')) return void e.preventDefault();
  if (shell.keyDown(e.key)) e.preventDefault();
});
// Desktop typing through an input method (Hangul): a hidden field holds focus so the browser can compose
// syllables; the composing text is shown on the typing line and the finished text is added to it.
if (!touch) {
  const ime = document.createElement('input');
  ime.id = 'ime';
  ime.type = 'text';
  ime.autocomplete = 'off';
  ime.setAttribute('aria-hidden', 'true');
  ime.tabIndex = -1;
  ime.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;pointer-events:none;';
  document.body.appendChild(ime);
  let base = '';
  const show = (text: string): void => void (shell.input = (base + text).slice(0, 37));
  ime.addEventListener('compositionstart', () => (base = shell.input));
  ime.addEventListener('compositionupdate', (e) => show(e.data));
  ime.addEventListener('compositionend', (e) => {
    show(e.data);
    ime.value = '';
  });
  ime.addEventListener('input', (e) => {
    if ((e as InputEvent).isComposing) return;
    // Text that arrived without composing (a paste, a one-shot insert) goes on the line as it is.
    if (ime.value) shell.input = (shell.input + ime.value).slice(0, 37);
    ime.value = '';
  });
  const focus = (): void => {
    if (!document.activeElement || document.activeElement === document.body || document.activeElement instanceof HTMLButtonElement) ime.focus({ preventScroll: true });
  };
  window.addEventListener('pointerup', () => setTimeout(focus, 0));
  window.addEventListener('focus', focus);
  focus();
}
window.addEventListener('keyup', (e) => shell.keyUp(e.key));
// Looking away pauses the game: the world is real-time, and wolves do not wait.
window.addEventListener('blur', () => shell.pause());
document.addEventListener('visibilitychange', () => document.hidden && shell.pause());
window.addEventListener('pointerdown', wake);

let last = performance.now();
function frame(now: number): void {
  shell.advance(now - last);
  last = now;
  for (const id of shell.sounds.splice(0)) playSound(id);
  music.setEnabled(shell.settings.music);
  music.cue(shell.musicCue());
  const fb = renderer.draw(shell);
  // The picture takes on the hour; the status line, typing line and any message box do not.
  const dusk = nightPal[Math.round(renderer.night * NIGHTS)];
  const box = renderer.overlay;
  for (let y = 0, i = 0; y < SH; y++) {
    const inPic = y >= PIC_TOP && y < PIC_BOTTOM && renderer.night > 0;
    for (let x = 0; x < SW; x++, i++) {
      const plain = !inPic || (box && x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h);
      rgba[i] = (plain ? pal32 : dusk)[fb[i]];
    }
  }
  ctx.putImageData(image, 0, 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if (import.meta.env.DEV) Object.assign(window, { game: { shell, renderer, content, music, measure } });

