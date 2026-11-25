// Draws one frame into a 320x200 indexed framebuffer from the simulation and interface state.
// Pure with respect to the game: it reads state and keeps only caches.

import { charSprite, type Facing, type Sprite } from './doll';
import { drawText, wrap } from './font';
import { chart, depthOf, edgeOf, parseWild } from './frontier';
import { ICONS } from './icons';
import { bayer4, clamp, hash2, mix, vnoise } from './noise';
import { R, UI, blendThreshold, sceneColour, spriteColour } from './palette';
import { all } from './rules';
import { PH, PW, flameAt, type Scene } from './scene';
import type { Shell } from './shell';
import { DAY_LENGTH } from './sim';
import type { Act, CharSpec, Dir } from './types';

export const SW = 320;
export const SH = 200;
const PIC_Y = 8;

const facingOf = (d: Dir): Facing => (d === 'left' || d === 'right' ? 'side' : d);
const beast = (spec: CharSpec): boolean => !!spec.body && spec.body !== 'human';

/** Map symbols, seven cells square. */
const MARKS: Record<string, { rows: string[]; ramp: number; tone: number }> = {
  wood: { rows: ['...X...', '..XXX..', '..XXX..', '.XXXXX.', '.XXXXX.', 'XXXXXXX', '...X...'], ramp: R.pine, tone: 2 },
  open: { rows: ['.......', '.......', '.X.....', '.....X.', '.......', '..X....', '.......'], ramp: R.rock, tone: 2 },
  mere: { rows: ['.......', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '.......'], ramp: R.water, tone: 3 },
  water: { rows: ['.......', '.X...X.', 'X.X.X.X', '...X...', '.X...X.', 'X.X.X.X', '...X...'], ramp: R.water, tone: 3 },
  village: { rows: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '.XX.XX.', '.XX.XX.'], ramp: R.red, tone: 2 },
  farm: { rows: ['.......', '..XXX..', '.XXXXX.', '.XXXXX.', 'XXXXXXX', 'XXXXXXX', '.......'], ramp: R.thatch, tone: 1 },
  camp: { rows: ['...X...', '...X...', '..XXX..', '..X.X..', '.XX.XX.', '.X...X.', 'XX...XX'], ramp: R.leather, tone: 2 },
  tower: { rows: ['.X.X.X.', '.XXXXX.', '..XXX..', '..XXX..', '..XXX..', '..X.X..', '.XX.XX.'], ramp: R.rock, tone: 1 },
  stone: { rows: ['..XX...', '.XXXX..', '.XXXX..', '.XXXX..', '.XXXX..', '.XXXX..', 'XXXXXX.'], ramp: R.rock, tone: 1 },
  crag: { rows: ['.......', '..X....', '.XXX.X.', '.XXXXXX', 'XXXXXXX', 'XXXXXXX', '.......'], ramp: R.rock, tone: 1 },
  dead: { rows: ['X..X..X', '.X.X.X.', '..XXX..', '...X...', '.X.X...', '..XX...', '...X...'], ramp: R.wood, tone: 1 },
  shrine: { rows: ['.......', '.X.X.X.', '.X.X.X.', '.......', 'X.....X', 'X.XXX.X', '.......'], ramp: R.glow, tone: 1 },
  steading: { rows: ['.....X.', '..XX.X.', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '.XX.XX.', '.......'], ramp: R.wood, tone: 2 },
  gate: { rows: ['XXXXXXX', 'XXXXXXX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX'], ramp: R.ice, tone: 0 },
  barrow: { rows: ['.......', '..XXX..', '.XXXXX.', 'XXXXXXX', 'XXX.XXX', 'XXX.XXX', '.......'], ramp: R.glow, tone: 1 },
};

/** The map's tiles: their size, and how many are in view. */
const MAP = { cw: 26, ch: 16, cols: 11, rows: 7 };

/** The ground each kind of place is coloured on the map, as a material and a brightness. */
const GROUND: Record<string, [number, number]> = {
  open: [R.snow, 0.82],
  village: [R.snow, 0.82],
  farm: [R.snow, 0.82],
  camp: [R.snow, 0.78],
  steading: [R.snow, 0.82],
  tower: [R.snow, 0.74],
  barrow: [R.snow, 0.74],
  shrine: [R.snow, 0.86],
  gate: [R.ice, 0.85],
  wood: [R.pine, 0.86],
  dead: [R.earth, 0.86],
  mere: [R.ice, 0.62],
  water: [R.water, 0.82],
  crag: [R.rock, 0.74],
  stone: [R.rock, 0.8],
};

/** Marks whose own colour would vanish into their ground are inked darker on the map. */
const INK: Record<string, [number, number]> = {
  wood: [R.pine, 0],
  mere: [R.water, 1],
  water: [R.ice, 3],
  crag: [R.rock, 0],
  stone: [R.rock, 0],
  dead: [R.wood, 0],
  gate: [R.water, 1],
};

export class Renderer {
  readonly fb = new Uint8Array(SW * SH);
  private pics = new Map<string, Uint8Array>();
  private sprites = new Map<string, Sprite>();
  /** How dark the picture should be shown, 0 (day) to 1 (night). Indoors it is always 0. */
  night = 0;
  /** The message box on screen, if any: it is not dimmed by night. */
  overlay: { x: number; y: number; w: number; h: number } | null = null;
  /** Where the rows of the list on screen are, so a tap can pick one. */
  private listRows: { x: number; y: number; w: number; n: number; pitch: number; first: number } | null = null;

  /** Where the map's grid is on screen, so a tap can pick a cell. */
  private mapAt: { x: number; y: number; cw: number; ch: number; cols: number; rows: number; x0: number; y0: number } | null = null;

  /** Which cell of the open map a framebuffer point is in, as an offset from the middle; or null. */
  hitMap(x: number, y: number): [number, number] | null {
    const m = this.mapAt;
    if (!m || x < m.x || y < m.y || x >= m.x + m.cols * m.cw || y >= m.y + m.rows * m.ch) return null;
    return [Math.floor((x - m.x) / m.cw) + m.x0, Math.floor((y - m.y) / m.ch) + m.y0];
  }

  /** Which row of the open list contains a framebuffer point, or -1. */
  hitList(x: number, y: number): number {
    const r = this.listRows;
    if (!r || x < r.x || x >= r.x + r.w || y < r.y - 6 || y >= r.y + r.n * r.pitch + 6) return -1;
    // A finger is not a pointer: take the nearest row.
    return r.first + Math.max(0, Math.min(r.n - 1, Math.floor((y - r.y) / r.pitch)));
  }

  private pic(id: string, sc: Scene): Uint8Array {
    let pic = this.pics.get(id);
    if (!pic) {
      pic = new Uint8Array(PW * PH);
      for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) pic[y * PW + x] = this.ground(sc, y * PW + x, x, y, 1);
      this.pics.set(id, pic);
    }
    return pic;
  }

  private ground(sc: Scene, i: number, x: number, y: number, dim: number): number {
    if (sc.mix[i] > blendThreshold(x, y)) return sceneColour(sc.ramp2[i], sc.shade2[i] * dim, x, y);
    return sceneColour(sc.ramp[i], sc.shade[i] * dim, x, y);
  }

  private sprite(key: string, spec: CharSpec, dir: Dir, act: Act, frame: number): Sprite {
    const facing = facingOf(dir);
    const f = act === 'walk' || act === 'swing' ? frame : act === 'block' ? 1 : 0;
    const k = `${key}|${facing}|${act}|${f}`;
    let sp = this.sprites.get(k);
    if (!sp) this.sprites.set(k, (sp = charSprite(spec, facing, act, f)));
    return sp;
  }

  private fill(x0: number, y0: number, w: number, h: number, c: number): void {
    for (let y = Math.max(0, y0); y < Math.min(SH, y0 + h); y++) this.fb.fill(c, y * SW + Math.max(0, x0), y * SW + Math.min(SW, x0 + w));
  }

  /** Sprite with its foot point at (ax, ay) in picture coordinates, hidden behind nearer props. */
  private drawSprite(sc: Scene, sp: Sprite, ax: number, ay: number, flip: boolean, dark: number, glowOnly: boolean): void {
    const fx = Math.round(ax);
    const fy = Math.round(ay);
    const bx = fx - (flip ? sp.w - 1 - sp.ox : sp.ox);
    const by = fy - sp.oy;
    for (let j = 0; j < sp.h; j++) {
      const y = by + j;
      if (y < 0 || y >= PH) continue;
      for (let i = 0; i < sp.w; i++) {
        const c = sp.cells[j * sp.w + (flip ? sp.w - 1 - i : i)];
        if (!c) continue;
        const x = bx + i;
        if (x < 0 || x >= PW || sc.pri[y * PW + x] > fy) continue;
        const ramp = (c - 1) >> 2;
        if (glowOnly && ramp !== R.glow) continue;
        const tone = ((c - 1) & 3) - (ramp === R.glow ? 0 : dark);
        this.fb[(y + PIC_Y) * SW + x] = spriteColour(ramp, tone < 0 ? 0 : tone);
      }
    }
  }

  private groundShadow(sc: Scene, ax: number, ay: number, rx: number): void {
    const fx = Math.round(ax);
    const fy = Math.round(ay);
    for (let dy = -2; dy <= 1; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx / rx) ** 2 + ((dy + 0.5) / 2.2) ** 2 > 1) continue;
        const x = fx + dx;
        const y = fy + dy;
        if (x < 0 || x >= PW || y < 0 || y >= PH) continue;
        const i = y * PW + x;
        if (sc.pri[i] === 0) this.fb[(y + PIC_Y) * SW + x] = this.ground(sc, i, x, y, 0.66);
      }
  }

  private drawFlame(sc: Scene, f: { x: number; y: number; up: number; size: number }, tick: number, seed: number): void {
    for (let up = 0; up <= 15 * f.size; up++)
      for (let dx = Math.floor(-8 * f.size); dx <= 8 * f.size; dx++) {
        const s = flameAt(dx / f.size, up / f.size, tick, seed);
        if (s <= 0) continue;
        const x = f.x + dx;
        const y = f.y - f.up - up;
        if (x < 0 || x >= PW || y < 0 || y >= PH || sc.pri[y * PW + x] > f.y) continue;
        this.fb[(y + PIC_Y) * SW + x] = sceneColour(R.fire, s, x, y);
      }
  }

  private drawIcon(sc: Scene, icon: { w: number; h: number; px: ([number, number] | null)[] }, ax: number, ay: number, lift: number): void {
    const bx = Math.round(ax) - (icon.w >> 1);
    const by = Math.round(ay) - icon.h - lift;
    for (let j = 0; j < icon.h; j++)
      for (let i = 0; i < icon.w; i++) {
        const c = icon.px[j * icon.w + i];
        const x = bx + i;
        const y = by + j;
        if (!c || x < 0 || x >= PW || y < 0 || y >= PH || sc.pri[y * PW + x] > ay) continue;
        this.fb[(y + PIC_Y) * SW + x] = spriteColour(c[0], c[1]);
      }
  }

  /** Arrows are a dark streak; bolts are a flickering knot of fire or frost. */
  private drawShot(sc: Scene, s: { x: number; y: number; dx: number; dy: number; kind: string }, tick: number): void {
    const cx = Math.round(s.x);
    const cy = Math.round(s.y) - 15;
    const put = (x: number, y: number, c: number): void => {
      if (x >= 0 && x < PW && y >= 0 && y < PH && sc.pri[y * PW + x] <= s.y) this.fb[(y + PIC_Y) * SW + x] = c;
    };
    if (s.kind === 'arrow') {
      const sx = Math.sign(s.dx);
      const sy = Math.sign(s.dy);
      for (let k = 0; k < 7; k++) put(cx - sx * k, cy - sy * k, spriteColour(k === 0 ? R.metal : R.wood, k === 0 ? 3 : 1));
      return;
    }
    const ramp = s.kind === 'frost' ? R.ice : R.fire;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.hypot(dx, dy * 1.2) + ((dx * 7 + dy * 13 + tick * 5) & 3) * 0.5;
        if (d < 4.2) put(cx + dx, cy + dy, sceneColour(ramp, 1 - d / 5.5, cx + dx, cy + dy));
      }
  }

  private bar(x: number, label: string, v: number, max: number, colour: number): void {
    drawText(this.fb, SW, x, 0, label, UI.black);
    this.fill(x + 9, 1, 26, 6, UI.black);
    this.fill(x + 10, 2, 24, 4, UI.grey);
    this.fill(x + 10, 2, Math.round((24 * Math.max(0, Math.min(max, v))) / max), 4, colour);
  }

  /**
   * The line across the top. From the left: a sun or a moon for the hour, the score, the silver
   * in the purse (a silver coin, the amount and the word), then health, mana and stamina. Each has
   * a place of its own, wide enough for four figures, so nothing runs into anything else.
   */
  private statusLine(shell: Shell): void {
    const { fb } = this;
    const sim = shell.sim;
    const p = sim.p;
    this.fill(0, 0, SW, 8, UI.white);
    // A small sun or moon, so the hour can be told at a glance: night matters out in the wild.
    const moon = sim.daylight() < 0.5;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const d = dx * dx + dy * dy;
        if (d > 10 || (moon && (dx + 2) * (dx + 2) + (dy + 1) * (dy + 1) < 8)) continue;
        fb[(4 + dy) * SW + 5 + dx] = moon ? spriteColour(R.blue, 1) : d > 5 ? UI.gold : spriteColour(R.fire, 3);
      }
    // No ceiling is shown: the world is meant to keep growing, and the score with it.
    drawText(fb, SW, 14, 0, `점수: ${sim.state.score}`, UI.black);
    // Silver in the purse: a silver coin with a dark rim, then how many.
    const cx = 109;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const d = dx * dx + dy * dy;
        if (d > 10) continue;
        fb[(4 + dy) * SW + cx + dx] = d > 5 ? spriteColour(R.metal, 1) : (dx + dy < -1 ? spriteColour(R.metal, 3) : spriteColour(R.metal, 2));
      }
    drawText(fb, SW, cx + 6, 0, `은화 ${p.gold}닢`, UI.black);
    // Badly hurt, the health bar flashes: it is easy to miss in the middle of a fight.
    this.bar(206, 'H', p.hp, p.maxHp, p.hp < p.maxHp * 0.3 && !p.dead && (shell.uiTick >> 2) & 1 ? UI.white : UI.health);
    this.bar(244, 'M', p.mp, p.maxMp, UI.mana);
    this.bar(282, 'S', p.sp, p.maxSp, UI.stamina);
  }

  private box(cols: number, rows: number): { x: number; y: number } {
    const w = cols * 8 + 20;
    const h = rows * 9 + 17;
    const x = (SW - w) >> 1;
    const y = PIC_Y + Math.max(0, (PH - h) >> 1);
    this.overlay = { x, y, w, h };
    this.fill(x, y, w, h, UI.white);
    this.fill(x, y, w, 1, UI.black);
    this.fill(x, y + h - 1, w, 1, UI.black);
    this.fill(x, y, 1, h, UI.black);
    this.fill(x + w - 1, y, 1, h, UI.black);
    this.fill(x + 3, y + 3, w - 6, 2, UI.red);
    this.fill(x + 3, y + h - 5, w - 6, 2, UI.red);
    this.fill(x + 3, y + 3, 2, h - 6, UI.red);
    this.fill(x + w - 5, y + 3, 2, h - 6, UI.red);
    return { x: x + 10, y: y + 9 };
  }

  private drawModal(shell: Shell): void {
    const m = shell.modal;
    this.listRows = null;
    this.mapAt = null;
    this.overlay = null;
    if (!m) return;
    const { fb } = this;
    if (m.k === 'msg') {
      // Speech carries the speaker's name above it.
      const head = m.who ? [m.who, ''] : [];
      const lines = [...head, ...wrap(m.text, 32)];
      const cols = Math.max(...lines.map((l) => l.length), m.more ? 32 : 0);
      const o = this.box(cols, lines.length + (m.more ? 1 : 0));
      lines.forEach((l, i) => drawText(fb, SW, o.x, o.y + i * 9, l, m.who && i === 0 ? UI.red : UI.black));
      if (m.who) this.fill(o.x, o.y + 10, m.who.length * 8, 1, UI.red);
      // A long message continues in the next box.
      if (m.more) drawText(fb, SW, o.x + (cols - 6) * 8, o.y + lines.length * 9, '(계속)', UI.red);
    } else if (m.k === 'map') {
      this.drawMap(shell, m);
    } else if (m.k === 'page') {
      const body = m.lines.flatMap((l, n) => (l ? wrap(l, 34) : ['']).map((text) => ({ text, head: !!m.heads?.includes(n) })));
      const lines = [{ text: m.title, head: true }, { text: '', head: false }, ...body].slice(0, 15);
      // A last row: "(more)" if the page goes on, or else how to leave it.
      const o = this.box(34, lines.length + 1);
      lines.forEach((l, i) => drawText(fb, SW, o.x, o.y + i * 9, l.text, l.head ? UI.red : UI.black));
      const foot = lines.length * 9;
      if (m.more) drawText(fb, SW, o.x + 28 * 8, o.y + foot, '(계속)', UI.red);
      else this.hint(o.x + 34 * 8, o.y + foot, this.leave(shell));
    } else {
      if (m.banner) {
        // The game's name, large, with a drop shadow.
        const bx = (SW - m.banner.length * 16) >> 1;
        drawText(fb, SW, bx + 2, 26, m.banner, UI.black, -1, 2);
        drawText(fb, SW, bx, 24, m.banner, UI.gold, -1, 2);
      }
      const title = wrap(m.title, 32);
      const cols = Math.min(37, Math.max(...title.map((l) => l.length), ...m.items.map((l) => l.length + 2)));
      // As many rows as the box can hold; a longer list scrolls with the cursor.
      const room = 16 - title.length - 1;
      // On touch screens the rows are spaced out, as far as the box allows.
      const pitch = shell.roomy ? Math.max(9, Math.min(14, Math.floor((150 - (title.length + 1) * 9) / Math.min(m.items.length, room)))) : 9;
      const n = Math.min(m.items.length, Math.max(1, Math.floor((room * 9) / pitch)));
      let first = Math.max(0, Math.min(m.items.length - n, m.top ?? 0));
      if (m.sel < first) first = m.sel;
      if (m.sel >= first + n) first = m.sel - n + 1;
      if (n < m.items.length || m.top !== undefined) m.top = first;
      const o = this.box(cols, title.length + 1 + Math.ceil((n * pitch) / 9));
      title.forEach((l, i) => drawText(fb, SW, o.x, o.y + i * 9, l, m.lead && i === 0 ? UI.red : UI.black));
      if (m.lead) this.fill(o.x, o.y + 8, title[0].length * 8, 1, UI.red);
      const top = o.y + (title.length + 1) * 9 + ((pitch - 9) >> 1);
      this.listRows = { x: o.x - 2, y: top - 1 - ((pitch - 9) >> 1), w: cols * 8 + 4, n, pitch, first };
      m.items.slice(first, first + n).forEach((it, k) => {
        const i = first + k;
        const y = top + k * pitch;
        const on = i === m.sel;
        if (on) this.fill(o.x - 2, y - 1 - ((pitch - 9) >> 1), cols * 8 + 4, pitch, UI.black);
        drawText(fb, SW, o.x, y, (on ? '> ' : '  ') + it.slice(0, 35), on ? UI.white : UI.black);
      });
      // Small arrows at the right-hand edge say there are more rows above or below.
      const ax = o.x + cols * 8 + 1;
      const arrow = (y: number, down: boolean): void => {
        for (let r = 0; r < 3; r++) this.fill(ax - r, y + (down ? r : 2 - r), 1 + 2 * r, 1, UI.red);
      };
      if (first > 0) arrow(top, false);
      if (first + n < m.items.length) arrow(top + (n - 1) * pitch + 4, true);
    }
  }

  /** How to leave what is open, in a word or two: back to the menu, or out to the game. */
  private leave(shell: Shell): string {
    if (shell.roomy) return shell.backToMenu ? '탭: 돌아가기' : '탭: 닫기';
    return shell.backToMenu ? 'Esc: 돌아가기' : 'Esc: 닫기';
  }

  /** A quiet note, right-aligned to end at x. */
  private hint(x: number, y: number, text: string): void {
    drawText(this.fb, SW, x - text.length * 8, y, text, UI.dim);
  }

  /** A rectangle's outline, `t` pixels thick. */
  private frame(x: number, y: number, w: number, h: number, c: number, t = 1): void {
    this.fill(x, y, w, t, c);
    this.fill(x, y + h - t, w, t, c);
    this.fill(x, y, t, h, c);
    this.fill(x + w - t, y, t, h, c);
  }

  /** The country under the map's marks, kept between frames: it only changes with what is known, or with scrolling. */
  private mapSheet: { key: string; px: Uint8Array } | null = null;

  /**
   * The map: one sheet of country, a tile for every place walked so far, each tile coloured for
   * its ground and carrying its mark. Neighbouring ground runs together with a ragged edge, and
   * what is known of but not yet walked shows as a haze at the edge of the known. The view follows
   * the cursor when there is more country than fits.
   */
  private drawMap(shell: Shell, m: Extract<NonNullable<Shell['modal']>, { k: 'map' }>): void {
    const { fb } = this;
    const sim = shell.sim;
    const cells = chart(sim.content, sim.state.flags, sim.state.room);
    const here = cells.find((c) => c.here);
    const { cw: CW, ch: CH, cols: COLS, rows: ROWS } = MAP;
    const hx = COLS >> 1;
    const hy = ROWS >> 1;
    const cx = here?.x ?? 0;
    const cy = here?.y ?? 0;
    // Where the view is: the whole of the known country when it fits, else following the cursor.
    const xs = cells.map((c) => c.x - cx);
    const ys = cells.map((c) => c.y - cy);
    const follow = (v: number | undefined, cur: number, lo: number, hi: number, half: number): number => {
      if (v === undefined) v = hi - lo <= 2 * half ? Math.round((lo + hi) / 2) : Math.max(lo + half, Math.min(hi - half, 0));
      if (cur < v - half + 1) v = cur + half - 1;
      if (cur > v + half - 1) v = cur - half + 1;
      return v;
    };
    m.vx = follow(m.vx, m.dx, Math.min(0, ...xs), Math.max(0, ...xs), hx);
    m.vy = follow(m.vy, m.dy, Math.min(0, ...ys), Math.max(0, ...ys), hy);
    // The first cell in view, on the map's own grid.
    const x0 = cx + m.vx - hx;
    const y0 = cy + m.vy - hy;

    const o = this.box(36, 16);
    drawText(fb, SW, o.x, o.y, '지금까지의 땅', UI.red);
    drawText(fb, SW, o.x + 36 * 8 - 8, o.y, 'N', UI.black);
    const left = o.x + 1;
    const top = o.y + 11;
    const W = COLS * CW;
    const H = ROWS * CH;
    this.frame(left - 1, top - 1, W + 2, H + 2, UI.black);
    const at = new Map(cells.map((c) => [`${c.x},${c.y}`, c]));

    // The ground, drawn once for what is known and where the view is.
    const key = `${x0},${y0}|${cells.map((c) => `${c.x},${c.y},${c.mark}`).join(';')}`;
    if (this.mapSheet?.key !== key) {
      const px = new Uint8Array(W * H);
      const dark = spriteColour(R.stone, 1);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          // A point on the map's own grid, so the texture and the edges stay put as the view moves.
          const gx = x0 * CW + x;
          const gy = y0 * CH + y;
          // Borders between one kind of ground and the next wander a little, as country does.
          const wx = (gx + (vnoise(gx * 0.11, gy * 0.11, 31) - 0.5) * CW * 0.55) / CW;
          const wy = (gy + (vnoise(gx * 0.11, gy * 0.11, 37) - 0.5) * CH * 0.7) / CH;
          const c = at.get(`${Math.floor(wx)},${Math.floor(wy)}`);
          let colour = dark;
          if (c && !c.mark) {
            // Known of, not walked: a haze, thinning away from the known.
            if (vnoise(gx * 0.3, gy * 0.3, 41) * 0.4 + 0.08 > bayer4(gx, gy)) colour = spriteColour(R.stone, 2);
          } else if (c) {
            const [ramp, shade] = GROUND[c.mark] ?? GROUND.open;
            colour = sceneColour(ramp, shade + (vnoise(gx * 0.2, gy * 0.2, 43) - 0.5) * 0.18, gx, gy);
          }
          px[y * W + x] = colour;
        }
      this.mapSheet = { key, px };
    }
    const sheet = this.mapSheet.px;
    for (let y = 0; y < H; y++) fb.set(sheet.subarray(y * W, (y + 1) * W), (top + y) * SW + left);

    // The walls of the marches, along any side of a place walked, with the gap where a pass goes through.
    for (const c of cells) {
      const col = c.x - x0;
      const row = c.y - y0;
      if (!c.mark || col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
      const x = left + col * CW;
      const y = top + row * CH;
      for (const side of ['n', 's', 'e', 'w'] as const) {
        const e = edgeOf(sim.content, c.x, c.y, side);
        if (e === 'open') continue;
        const across = side === 'n' || side === 's';
        const len = across ? CW : CH;
        for (let i = -1; i <= len; i++) {
          // A pass leaves a gap at the middle; the rest of the wall is a rough line of pale rock,
          // edged dark, so it shows against known country and unknown alike.
          if (e === 'pass' && Math.abs(i - len / 2) < len * 0.22) continue;
          const t = 3 + (hash2(c.x * 31 + i, c.y * 17 + side.charCodeAt(0)) > 0.6 ? 1 : 0);
          const [px, py] = across ? [x + i, side === 'n' ? y - 2 : y + CH - t + 2] : [side === 'w' ? x - 2 : x + CW - t + 2, y + i];
          this.fill(px, py, across ? 1 : t, across ? t : 1, spriteColour(R.ink, 0));
          if (across) this.fill(px, py + 1, 1, t - 2, spriteColour(R.rock, 4));
          else this.fill(px + 1, py, t - 2, 1, spriteColour(R.rock, 4));
        }
      }
    }

    // The marks, and what stands out: places with names, where you have been sent, where you are.
    for (const c of cells) {
      const col = c.x - x0;
      const row = c.y - y0;
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
      const x = left + col * CW;
      const y = top + row * CH;
      if (c.mark) {
        const g = MARKS[c.mark] ?? MARKS.open;
        const [ramp, tone] = INK[c.mark] ?? [g.ramp, g.tone];
        // A place with a name of its own is drawn twice the size, with a dark edge, so it stands out from the country round it.
        const s = c.named ? 2 : 1;
        const mx = x + ((CW - 7 * s) >> 1);
        const my = y + ((CH - 7 * s) >> 1);
        const on = (i: number, j: number): boolean => i >= 0 && i < 7 && j >= 0 && j < 7 && g.rows[j][i] === 'X';
        if (c.named)
          for (let j = -1; j <= 7; j++)
            for (let i = -1; i <= 7; i++)
              if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) this.fill(mx + i * s, my + j * s, s, s, spriteColour(R.ink, 0));
        for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (on(i, j)) this.fill(mx + i * s, my + j * s, s, s, spriteColour(ramp, tone));
      }
      if (c.goal) {
        // Somewhere you have been sent: a gold pennant on a pole, at the tile's corner.
        const fx = x + CW - 8;
        this.fill(fx - 1, y + 1, 3, 13, UI.black);
        this.fill(fx, y + 2, 1, 11, spriteColour(R.wood, 3));
        for (let r = 0; r < 5; r++) {
          const len = 6 - Math.abs(r - 2) * 2;
          this.fill(fx + 1, y + 2 + r, len + 1, 1, UI.black);
          this.fill(fx + 1, y + 2 + r, len, 1, UI.gold);
        }
      }
      // Where you are: a red frame, its inside lit and dark by turns.
      if (c.here) {
        this.frame(x - 2, y - 2, CW + 4, CH + 4, (shell.uiTick >> 3) & 1 ? UI.white : UI.red);
        this.frame(x - 1, y - 1, CW + 2, CH + 2, UI.red, 2);
      }
    }
    // The cursor: white outside and black inside, so it shows against any ground.
    if (m.dx || m.dy) {
      const kx = left + (m.dx + cx - x0) * CW;
      const ky = top + (m.dy + cy - y0) * CH;
      this.frame(kx - 1, ky - 1, CW + 2, CH + 2, UI.white);
      this.frame(kx, ky, CW, CH, UI.black);
    }
    // The frame is drawn again over anything that strayed onto it.
    this.frame(left - 1, top - 1, W + 2, H + 2, UI.black);
    this.mapAt = { x: left, y: top, cw: CW, ch: CH, cols: COLS, rows: ROWS, x0: x0 - cx, y0: y0 - cy };

    const under = at.get(`${cx + m.dx},${cy + m.dy}`);
    const away = [m.dy < 0 ? `북쪽 ${-m.dy}` : m.dy > 0 ? `남쪽 ${m.dy}` : '', m.dx < 0 ? `서쪽 ${-m.dx}` : m.dx > 0 ? `동쪽 ${m.dx}` : ''].filter(Boolean).join(', ');
    const name = !(m.dx || m.dy) ? (here ? here.name : sim.room.name) : under?.mark ? under.name : under ? (under.goal ? '보내진 곳' : '아직 걷지 않은 곳') : '알 수 없는 땅';
    // Too long to say in full, the way there is shortened to compass letters.
    const brief = [m.dy ? `${Math.abs(m.dy)}${m.dy < 0 ? '북' : '남'}` : '', m.dx ? `${Math.abs(m.dx)}${m.dx < 0 ? '서' : '동'}` : ''].filter(Boolean).join(' ');
    const said = !away ? name : `${name} (${away})`.length <= 36 ? `${name} (${away})` : `${name.slice(0, 36 - brief.length - 3)} (${brief})`;
    drawText(fb, SW, o.x, top + H + 4, said.slice(0, 36), UI.black);
    const how = shell.roomy ? `장소를 탭하면 이름을 말해 준다. ${this.leave(shell)}` : `화살표 키로 둘러본다. ${this.leave(shell)}`;
    this.hint(o.x + 36 * 8, top + H + 13, how);
  }

  /** On some nights the sky itself is lit: slow green curtains, high up. */
  private aurora(sc: Scene, day: number, tick: number, depth: number): void {
    if (mix(day, 77) / 4294967296 > 0.45) return;
    const t = tick * 0.02;
    for (let x = 0; x < PW; x++) {
      const strength = clamp((vnoise(x * 0.012, t * 0.2 + day, 8) - 0.18) * 2.6) * depth;
      if (strength <= 0) continue;
      const top = 1 + 6 * Math.sin(x * 0.021 + t * 0.6) + 7 * vnoise(x * 0.03, t * 0.3, 5);
      const len = 20 + 20 * vnoise(x * 0.06 + 40, t * 0.5, 6);
      const ray = 0.4 + 0.6 * vnoise(x * 0.45, t * 1.2, 7);
      for (let k = 0; k < len; k++) {
        const y = Math.round(top + k);
        if (y < 0 || y >= PH) continue;
        const i = y * PW + x;
        if (sc.ramp[i] !== R.sky || sc.pri[i] !== 0) continue;
        const s = strength * ray * (1 - k / len) ** 0.8;
        if (s < 0.04 + 0.62 * bayer4(x, y)) continue;
        this.fb[(y + PIC_Y) * SW + x] = sceneColour(R.glow, 0.45 + 0.55 * s, x, y);
      }
    }
  }

  /** Stars and a moon, when it is dark enough to see them and nothing is in the way. */
  private nightSky(sc: Scene, tick: number, day: number): void {
    const depth = (this.night - 0.35) / 0.65;
    if (depth <= 0) return;
    this.aurora(sc, day, tick, depth);
    const sky = (x: number, y: number): boolean => sc.ramp[y * PW + x] === R.sky && sc.pri[y * PW + x] === 0;
    for (let k = 0; k < 70; k++) {
      // The faintest come out last.
      if (hash2(k, 5, 19) > depth) continue;
      const x = Math.floor(hash2(k, 1, 19) * PW);
      const y = Math.floor(hash2(k, 2, 19) ** 1.4 * 78);
      if (!sky(x, y)) continue;
      const twinkle = ((tick >> 3) + k * 7) % 23 === 0;
      this.fb[(y + PIC_Y) * SW + x] = spriteColour(R.star, twinkle ? 0 : hash2(k, 3, 19) < 0.3 ? 3 : 0);
    }
    // A gibbous moon, low in the east.
    for (let dy = -5; dy <= 5; dy++)
      for (let dx = -5; dx <= 5; dx++) {
        const x = 262 + dx;
        const y = 20 + dy;
        if (dx * dx + dy * dy > 27 || (dx + 3) ** 2 + (dy + 1) ** 2 < 14 * (1 - depth) || !sky(x, y)) continue;
        this.fb[(y + PIC_Y) * SW + x] = spriteColour(R.star, (dx - 1) ** 2 + (dy - 2) ** 2 < 5 || (dx + 2) ** 2 + (dy + 2) ** 2 < 3 ? 0 : 3);
      }
  }

  draw(shell: Shell): Uint8Array {
    const { fb } = this;
    const sim = shell.sim;
    const st = sim.state;
    const p = st.player;
    const sc = sim.scene();
    const dark = sim.isDark();

    if (dark) fb.fill(UI.black, PIC_Y * SW, (PIC_Y + PH) * SW);
    // The picture jolts for a moment when the hero is struck.
    else fb.set(this.pic(sim.sceneKey(), sc), PIC_Y * SW + (p.hurtT > 6 ? (p.hurtT & 1 ? 2 : -2) : 0));

    const outdoors = sim.room.scene.kind === 'outdoor';
    this.night = outdoors ? 1 - sim.daylight() : 0;
    if (outdoors && !dark) this.nightSky(sc, shell.uiTick, Math.floor((st.tick + DAY_LENGTH * 0.12) / DAY_LENGTH));

    // Everything standing on the ground, back to front.
    const items: { y: number; draw: () => void }[] = [];
    const lightAt = (x: number, y: number): number => {
      if (!sc.light) return 0;
      const l = sc.light[Math.max(0, Math.min(PH - 1, Math.round(y))) * PW + Math.max(0, Math.min(PW - 1, Math.round(x)))];
      return l < 0.3 ? 2 : l < 0.7 ? 1 : 0;
    };
    const person = (key: string, spec: CharSpec, a: { x: number; y: number; dir: Dir; act: Act; frame: number }, flash: boolean): void => {
      items.push({
        // The hero stands in front of whatever shares his patch of ground, so big things do not hide him.
        y: key === 'hero' ? a.y + 0.5 : a.y,
        draw: () => {
          if (!dark) this.groundShadow(sc, a.x, a.y, Math.round((beast(spec) ? 12 : 7) * (spec.size ?? 1)));
          // A struck figure flashes a tone brighter.
          const tone = flash ? -1 : lightAt(a.x, a.y);
          this.drawSprite(sc, this.sprite(key, spec, a.dir, a.act, a.frame), a.x, a.y, a.dir === 'left', tone, dark);
        },
      });
    };
    for (const a of sim.rs.actors) {
      const spec = a.kind === 'npc' ? sim.content.chars[a.ref]?.spec : sim.content.enemies[a.ref]?.spec;
      // Whatever is still on its way in after the player has not come into view yet.
      if (!spec || (a.ai.lag ?? 0) > 0) continue;
      person(a.ref, spec, a, a.ai.flash > 0);
      // A wounded enemy shows how much fight it has left.
      const full = a.kind === 'enemy' ? a.ai.max ?? sim.content.enemies[a.ref].hp : 0;
      // A foe about to strike says so: this is the moment to guard or step aside.
      if (!dark && a.ai.wind > 0 && a.act !== 'dead') {
        const wx = Math.round(a.x) - 3;
        const wy = Math.round(a.y) - Math.round((beast(spec) ? 22 : 38) * (spec.size ?? 1)) - 10 + PIC_Y;
        items.push({ y: 998, draw: () => (this.fill(wx - 1, wy - 1, 9, 10, UI.black), drawText(fb, SW, wx, wy, '!', UI.gold)) });
      }
      if (!dark && a.act !== 'dead' && a.hp < full) {
        const top = Math.round(a.y) - Math.round((beast(spec) ? 22 : 38) * (spec.size ?? 1));
        const left = Math.round(a.x) - 8;
        items.push({
          y: 999,
          draw: () => {
            this.fill(left, top + PIC_Y, 16, 3, UI.black);
            this.fill(left + 1, top + PIC_Y + 1, Math.max(1, Math.round((14 * Math.max(0, a.hp)) / full)), 1, UI.health);
          },
        });
      }
    }
    // In the dark you can still just make out yourself.
    if (dark) items.push({ y: p.y, draw: () => this.drawSprite(sc, this.sprite('hero', sim.content.hero, p.dir, p.act, p.frame), p.x, p.y, p.dir === 'left', 3, false) });
    if (!dark) {
      for (const t of sim.things()) {
        const icon = t.icon && ICONS[t.icon];
        if (icon) items.push({ y: t.y, draw: () => this.drawIcon(sc, icon, t.x, t.y, t.lift ?? 0) });
      }
      // Where a pointed-at walk is bound: a small mark on the ground, under everything.
      const to = shell.heading;
      if (to && (shell.uiTick >> 2) & 1)
        items.push({
          y: -1,
          draw: () => {
            // Gold over a dark edge: it has to show on snow and on a dark floor alike.
            const arms = [[0, 0], [-2, -1], [2, -1], [-2, 1], [2, 1]];
            for (const [dx, dy] of arms) this.fill(to.x + dx - 1, to.y + dy + PIC_Y, 4, 2, UI.black);
            for (const [dx, dy] of arms) this.fill(to.x + dx, to.y + dy + PIC_Y, 2, 1, UI.gold);
          },
        });
      // Just after a blow the hero flickers, which is also when he cannot be hit again.
      if (!(p.hurtT > 0 && shell.uiTick & 1)) person('hero', sim.content.hero, p, false);
      sc.flames.forEach((f, k) => items.push({ y: f.y, draw: () => this.drawFlame(sc, f, shell.uiTick, k) }));
      for (const s of sim.rs.shots) items.push({ y: s.y, draw: () => this.drawShot(sc, s, shell.uiTick) });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    // Snow on the air, out of doors: near flakes fall faster and brighter than far ones. Far from
    // the valley it comes thicker, and sideways.
    if (outdoors) {
      const t = shell.uiTick;
      const at = parseWild(st.room);
      const far = at ? Math.max(0, depthOf(sim.content, at[0], at[1]) - 1) : 0;
      // Once the weather has broken, the wind is gone, and at home there is hardly a flake.
      const still = !!sim.content.calm && all(sim, sim.content.calm);
      const wind = still ? 0 : Math.min(2.4, far * 0.4);
      // In some places the snow does not fall at all: it hangs where it was, until the weather breaks.
      const hung = !still ? sim.room.hung : undefined;
      for (let i = 0, n = hung ?? (still ? (at ? 40 + Math.min(60, far * 8) : 7) : 54 + Math.min(120, far * 20)); i < n; i++) {
        const near = i % 3 === 0;
        const speed = hung ? 0 : (near ? 1.5 : 0.8) + hash2(i, 3, 7) * 0.5;
        const x = hung ? Math.floor(hash2(i, 1, 7) * PW) : Math.floor(hash2(i, 1, 7) * PW + Math.sin((t + i * 37) * 0.04) * 5 + t * ((hash2(i, 4, 7) - 0.5) * 0.4 - wind * (near ? 1 : 0.6)));
        const y = Math.floor(hash2(i, 2, 7) * PH + t * speed);
        // Hanging flakes are a little blue, so that they show against the snow behind them.
        fb[(PIC_Y + (((y % PH) + PH) % PH)) * SW + (((x % PW) + PW) % PW)] = spriteColour(hung && i % 2 ? R.ice : R.snow, near ? 3 : 2);
      }
    }

    this.statusLine(shell);

    // Typing line
    this.fill(0, PIC_Y + PH, SW, SH - PIC_Y - PH, UI.black);
    const cursor = !shell.modal && (shell.uiTick >> 3) & 1 ? '_' : ' ';
    drawText(fb, SW, 0, PIC_Y + PH + 8, '>' + shell.input + cursor, UI.grey);
    if (shell.uiTick < shell.noteUntil) {
      // A long hint takes a second line, borrowed from the foot of the picture.
      const note = wrap(shell.noteText, 40).slice(0, 2);
      if (note.length > 1) this.fill(0, PIC_Y + PH - 9, SW, 9, UI.black);
      note.forEach((l, i) => drawText(fb, SW, 0, PIC_Y + PH - (note.length - 1 - i) * 8, l, UI.gold));
    }
    // Runewords the player knows, and how long until each can be spoken again.
    const words = p.words.map((id) => {
      const left = p.cd[id] ?? 0;
      return `${id.replace('word:', '').toUpperCase()}${left > 0 ? ' ' + Math.ceil(left / 20) : ''}`;
    });
    const held = [p.weapon, p.shield].filter(Boolean).map((id) => sim.content.items[id!]?.name ?? id);
    const hands = held.length ? `[${held.join(' + ')}]` : '';
    // Whatever is lending its help just now, at the right-hand end: a ward, borrowed strength, a carried light.
    const until = (k: string): boolean => Number(st.flags[k] ?? 0) > st.tick;
    const boons = [until('ward') ? 'Ward' : '', until('might') ? 'Might' : '', until('light') && sim.room.dark ? 'Light' : ''].filter(Boolean).join(' ');
    if (boons) drawText(fb, SW, SW - boons.length * 8, PIC_Y + PH + 16, boons, UI.gold);
    // The words are what can be typed, so they are never crowded off the line: what is in the
    // hands is shortened to the weapon alone, or left out, before a word is.
    const room = 40 - (boons ? boons.length + 1 : 0);
    const weapon = p.weapon ? `[${sim.content.items[p.weapon]?.name ?? p.weapon}]` : '';
    const line = [hands, weapon, ''].map((h) => [h, ...words].filter(Boolean).join('  ')).find((l) => l.length <= room) ?? words.join(' ');
    drawText(fb, SW, 0, PIC_Y + PH + 16, line.slice(0, room), UI.dim);

    // Something that takes a whole fight to bring down gets its name and its health across the top.
    const boss = dark ? undefined : sim.rs.actors.find((a) => a.kind === 'enemy' && a.act !== 'dead' && sim.content.enemies[a.ref]?.ai === 'boss');
    if (boss) {
      const name = sim.content.enemies[boss.ref].name;
      const w = 160;
      const x0 = (SW - w) >> 1;
      const full = boss.ai.max ?? sim.content.enemies[boss.ref].hp;
      this.fill(x0 - 1, PIC_Y + 3, w + 2, 7, UI.black);
      this.fill(x0, PIC_Y + 4, w, 5, UI.dim);
      this.fill(x0, PIC_Y + 4, Math.max(1, Math.round((w * Math.max(0, boss.hp)) / full)), 5, UI.health);
      const label = name[0].toUpperCase() + name.slice(1);
      const lx = (SW - label.length * 8) >> 1;
      this.fill(lx - 2, PIC_Y + 11, label.length * 8 + 4, 9, UI.black);
      drawText(fb, SW, lx, PIC_Y + 12, label, UI.white);
    }

    this.drawModal(shell);
    return fb;
  }
}

