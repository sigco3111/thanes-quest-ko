// An original 8x8 bitmap font drawn for this project. Each glyph is eight rows of eight cells.
// Hangul syllables come from kofont.ts, rasterized from Galmuri7 (SIL OFL 1.1).
import { hangulGlyph, jamoGlyph } from './kofont';

const G: Record<string, string> = {
  ' ': '........|........|........|........|........|........|........|........',
  '!': '..XX....|..XX....|..XX....|..XX....|..XX....|........|..XX....|........',
  '"': '.XX.XX..|.XX.XX..|.XX.XX..|........|........|........|........|........',
  '#': '.XX.XX..|.XX.XX..|XXXXXXX.|.XX.XX..|XXXXXXX.|.XX.XX..|.XX.XX..|........',
  $: '..XX....|.XXXXX..|XX......|.XXXX...|....XX..|XXXXX...|..XX....|........',
  '%': '........|XX...XX.|XX..XX..|...XX...|..XX....|.XX..XX.|XX...XX.|........',
  '&': '..XXX...|.XX.XX..|..XXX...|.XXX.XX.|XX.XXX..|XX..XX..|.XXX.XX.|........',
  "'": '..XX....|..XX....|.XX.....|........|........|........|........|........',
  '(': '...XX...|..XX....|.XX.....|.XX.....|.XX.....|..XX....|...XX...|........',
  ')': '.XX.....|..XX....|...XX...|...XX...|...XX...|..XX....|.XX.....|........',
  '*': '........|.XX..XX.|..XXXX..|XXXXXXXX|..XXXX..|.XX..XX.|........|........',
  '+': '........|..XX....|..XX....|XXXXXX..|..XX....|..XX....|........|........',
  ',': '........|........|........|........|........|..XX....|..XX....|.XX.....',
  '-': '........|........|........|XXXXXX..|........|........|........|........',
  '—': '........|........|........|XXXXXXXX|........|........|........|........',
  '·': '........|........|........|...XX...|...XX...|........|........|........',
  '.': '........|........|........|........|........|..XX....|..XX....|........',
  '/': '.....XX.|....XX..|...XX...|..XX....|.XX.....|XX......|X.......|........',
  '0': '.XXXXX..|XX...XX.|XX..XXX.|XX.XXXX.|XXXX.XX.|XXX..XX.|.XXXXX..|........',
  '1': '..XX....|.XXX....|..XX....|..XX....|..XX....|..XX....|XXXXXX..|........',
  '2': '.XXXX...|XX..XX..|....XX..|..XXX...|.XX.....|XX......|XXXXXX..|........',
  '3': '.XXXX...|XX..XX..|....XX..|..XXX...|....XX..|XX..XX..|.XXXX...|........',
  '4': '...XXX..|..XXXX..|.XX.XX..|XX..XX..|XXXXXXX.|....XX..|....XX..|........',
  '5': 'XXXXXX..|XX......|XXXXX...|....XX..|....XX..|XX..XX..|.XXXX...|........',
  '6': '..XXX...|.XX.....|XX......|XXXXX...|XX..XX..|XX..XX..|.XXXX...|........',
  '7': 'XXXXXX..|XX..XX..|....XX..|...XX...|..XX....|..XX....|..XX....|........',
  '8': '.XXXX...|XX..XX..|XX..XX..|.XXXX...|XX..XX..|XX..XX..|.XXXX...|........',
  '9': '.XXXX...|XX..XX..|XX..XX..|.XXXXX..|....XX..|...XX...|.XXX....|........',
  ':': '........|..XX....|..XX....|........|........|..XX....|..XX....|........',
  ';': '........|..XX....|..XX....|........|........|..XX....|..XX....|.XX.....',
  '<': '...XX...|..XX....|.XX.....|XX......|.XX.....|..XX....|...XX...|........',
  '=': '........|........|XXXXXX..|........|........|XXXXXX..|........|........',
  '>': '.XX.....|..XX....|...XX...|....XX..|...XX...|..XX....|.XX.....|........',
  '?': '.XXXX...|XX..XX..|....XX..|...XX...|..XX....|........|..XX....|........',
  '@': '.XXXXX..|XX...XX.|XX.XXXX.|XX.XXXX.|XX.XXXX.|XX......|.XXXX...|........',
  A: '..XX....|.XXXX...|XX..XX..|XX..XX..|XXXXXX..|XX..XX..|XX..XX..|........',
  B: 'XXXXX...|XX..XX..|XX..XX..|XXXXX...|XX..XX..|XX..XX..|XXXXX...|........',
  C: '.XXXX...|XX..XX..|XX......|XX......|XX......|XX..XX..|.XXXX...|........',
  D: 'XXXX....|XX.XX...|XX..XX..|XX..XX..|XX..XX..|XX.XX...|XXXX....|........',
  E: 'XXXXXX..|XX......|XX......|XXXXX...|XX......|XX......|XXXXXX..|........',
  F: 'XXXXXX..|XX......|XX......|XXXXX...|XX......|XX......|XX......|........',
  G: '.XXXX...|XX..XX..|XX......|XX.XXX..|XX..XX..|XX..XX..|.XXXXX..|........',
  H: 'XX..XX..|XX..XX..|XX..XX..|XXXXXX..|XX..XX..|XX..XX..|XX..XX..|........',
  I: '.XXXX...|..XX....|..XX....|..XX....|..XX....|..XX....|.XXXX...|........',
  J: '...XXX..|....XX..|....XX..|....XX..|XX..XX..|XX..XX..|.XXXX...|........',
  K: 'XX..XX..|XX.XX...|XXXX....|XXX.....|XXXX....|XX.XX...|XX..XX..|........',
  L: 'XX......|XX......|XX......|XX......|XX......|XX......|XXXXXX..|........',
  M: 'XX...XX.|XXX.XXX.|XXXXXXX.|XX.X.XX.|XX...XX.|XX...XX.|XX...XX.|........',
  N: 'XX...XX.|XXX..XX.|XXXX.XX.|XX.XXXX.|XX..XXX.|XX...XX.|XX...XX.|........',
  O: '.XXXX...|XX..XX..|XX..XX..|XX..XX..|XX..XX..|XX..XX..|.XXXX...|........',
  P: 'XXXXX...|XX..XX..|XX..XX..|XXXXX...|XX......|XX......|XX......|........',
  Q: '.XXXX...|XX..XX..|XX..XX..|XX..XX..|XX.XXX..|XX..XX..|.XXX.XX.|........',
  R: 'XXXXX...|XX..XX..|XX..XX..|XXXXX...|XX.XX...|XX..XX..|XX..XX..|........',
  S: '.XXXX...|XX..XX..|XX......|.XXXX...|....XX..|XX..XX..|.XXXX...|........',
  T: 'XXXXXX..|..XX....|..XX....|..XX....|..XX....|..XX....|..XX....|........',
  U: 'XX..XX..|XX..XX..|XX..XX..|XX..XX..|XX..XX..|XX..XX..|.XXXX...|........',
  V: 'XX..XX..|XX..XX..|XX..XX..|XX..XX..|XX..XX..|.XXXX...|..XX....|........',
  W: 'XX...XX.|XX...XX.|XX...XX.|XX.X.XX.|XXXXXXX.|XXX.XXX.|XX...XX.|........',
  X: 'XX..XX..|XX..XX..|.XXXX...|..XX....|.XXXX...|XX..XX..|XX..XX..|........',
  Y: 'XX..XX..|XX..XX..|XX..XX..|.XXXX...|..XX....|..XX....|..XX....|........',
  Z: 'XXXXXX..|....XX..|...XX...|..XX....|.XX.....|XX......|XXXXXX..|........',
  '[': '.XXXX...|.XX.....|.XX.....|.XX.....|.XX.....|.XX.....|.XXXX...|........',
  '\\': 'XX......|.XX.....|..XX....|...XX...|....XX..|.....XX.|......X.|........',
  ']': '.XXXX...|...XX...|...XX...|...XX...|...XX...|...XX...|.XXXX...|........',
  '^': '..XX....|.XXXX...|XX..XX..|........|........|........|........|........',
  _: '........|........|........|........|........|........|........|XXXXXXX.',
  '`': '.XX.....|..XX....|...XX...|........|........|........|........|........',
  a: '........|........|.XXXX...|....XX..|.XXXXX..|XX..XX..|.XXXXX..|........',
  b: 'XX......|XX......|XXXXX...|XX..XX..|XX..XX..|XX..XX..|XXXXX...|........',
  c: '........|........|.XXXX...|XX..XX..|XX......|XX..XX..|.XXXX...|........',
  d: '....XX..|....XX..|.XXXXX..|XX..XX..|XX..XX..|XX..XX..|.XXXXX..|........',
  e: '........|........|.XXXX...|XX..XX..|XXXXXX..|XX......|.XXXX...|........',
  f: '..XXX...|.XX.....|XXXXX...|.XX.....|.XX.....|.XX.....|.XX.....|........',
  g: '........|........|.XXXXX..|XX..XX..|XX..XX..|.XXXXX..|....XX..|.XXXX...',
  h: 'XX......|XX......|XXXXX...|XX..XX..|XX..XX..|XX..XX..|XX..XX..|........',
  i: '..XX....|........|.XXX....|..XX....|..XX....|..XX....|.XXXX...|........',
  j: '....XX..|........|...XXX..|....XX..|....XX..|....XX..|XX..XX..|.XXXX...',
  k: 'XX......|XX......|XX..XX..|XX.XX...|XXXX....|XX.XX...|XX..XX..|........',
  l: '.XXX....|..XX....|..XX....|..XX....|..XX....|..XX....|.XXXX...|........',
  m: '........|........|XXX.XX..|XXXXXXX.|XX.X.XX.|XX.X.XX.|XX...XX.|........',
  n: '........|........|XXXXX...|XX..XX..|XX..XX..|XX..XX..|XX..XX..|........',
  o: '........|........|.XXXX...|XX..XX..|XX..XX..|XX..XX..|.XXXX...|........',
  p: '........|........|XXXXX...|XX..XX..|XX..XX..|XXXXX...|XX......|XX......',
  q: '........|........|.XXXXX..|XX..XX..|XX..XX..|.XXXXX..|....XX..|....XX..',
  r: '........|........|XX.XX...|XXXXXX..|XX......|XX......|XX......|........',
  s: '........|........|.XXXXX..|XX......|.XXXX...|....XX..|XXXXX...|........',
  t: '.XX.....|.XX.....|XXXXX...|.XX.....|.XX.....|.XX.XX..|..XXX...|........',
  u: '........|........|XX..XX..|XX..XX..|XX..XX..|XX..XX..|.XXXXX..|........',
  v: '........|........|XX..XX..|XX..XX..|XX..XX..|.XXXX...|..XX....|........',
  w: '........|........|XX...XX.|XX.X.XX.|XX.X.XX.|XXXXXXX.|.XX.XX..|........',
  x: '........|........|XX..XX..|.XXXX...|..XX....|.XXXX...|XX..XX..|........',
  y: '........|........|XX..XX..|XX..XX..|XX..XX..|.XXXXX..|....XX..|.XXXX...',
  z: '........|........|XXXXXX..|...XX...|..XX....|.XX.....|XXXXXX..|........',
  '{': '...XXX..|..XX....|..XX....|XXX.....|..XX....|..XX....|...XXX..|........',
  '|': '..XX....|..XX....|..XX....|........|..XX....|..XX....|..XX....|........',
  '}': 'XXX.....|..XX....|..XX....|...XXX..|..XX....|..XX....|XXX.....|........',
  '~': '.XXX.XX.|XX.XXX..|........|........|........|........|........|........',
};

const BITS = new Map<string, Uint8Array>();
for (const [ch, src] of Object.entries(G)) {
  const rows = src.split('|');
  if (rows.length !== 8 || rows.some((r) => r.length !== 8)) console.warn(`font: glyph "${ch}" is not 8x8`);
  const out = new Uint8Array(8);
  rows.forEach((row, y) => {
    let b = 0;
    for (let x = 0; x < 8; x++) if (row[x] === 'X') b |= 1 << x;
    out[y] = b;
  });
  BITS.set(ch, out);
}
const UNKNOWN = BITS.get('?')!;

/** Glyph rows for one character: the hand-drawn Latin set, or a Galmuri7 Hangul syllable. */
const glyph = (ch: string): Uint8Array | undefined => BITS.get(ch) ?? hangulGlyph(ch.codePointAt(0)!) ?? jamoGlyph(ch.codePointAt(0)!) ?? undefined;

/** Can this character be drawn? Anything that cannot shows as a question mark. */
export const hasGlyph = (ch: string): boolean => glyph(ch) !== undefined;

/** Draw text into an indexed buffer. bg < 0 leaves the background untouched. */
export function drawText(buf: Uint8Array, bufW: number, x: number, y: number, text: string, fg: number, bg = -1, scale = 1): void {
  const bufH = buf.length / bufW;
  if (scale > 1) {
    // Large text: each font pixel becomes a square block.
    for (let i = 0; i < text.length; i++) {
      const g = glyph(text[i]) ?? UNKNOWN;
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
          if (!((g[r] >> c) & 1)) continue;
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++) {
              const px = x + (i * 8 + c) * scale + dx;
              const py = y + r * scale + dy;
              if (px >= 0 && px < bufW && py >= 0 && py < bufH) buf[py * bufW + px] = fg;
            }
        }
    }
    return;
  }
  for (let i = 0; i < text.length; i++) {
    const g = glyph(text[i]) ?? UNKNOWN;
    for (let r = 0; r < 8; r++) {
      const py = y + r;
      if (py < 0 || py >= bufH) continue;
      for (let c = 0; c < 8; c++) {
        const px = x + i * 8 + c;
        if (px < 0 || px >= bufW) continue;
        if ((g[r] >> c) & 1) buf[py * bufW + px] = fg;
        else if (bg >= 0) buf[py * bufW + px] = bg;
      }
    }
  }
}

export function wrap(text: string, cols: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line && line.length + 1 + word.length > cols) {
        lines.push(line);
        line = word;
      } else line = line ? line + ' ' + word : word;
    }
    lines.push(line);
  }
  return lines;
}
