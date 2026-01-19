import { useEffect, useMemo, useRef } from "react";

/**
 * Procedural canvas art (no external images).
 *
 * This is a React wrapper around your canvas kit.
 * - Responsive: matches parent size via ResizeObserver
 * - Crisp: devicePixelRatio scaling
 * - Safe: runs after mount; no inline <script>
 */

export type ArtScene =
  | "orbitMock"
  | "mandala"
  | "devices"
  | "collage"
  | "phonePayments"
  | "phoneDeploy"
  | "torusFlow";

type Props = {
  scene?: ArtScene;
  className?: string;
  /** Optional seed to vary randomness for some scenes */
  seed?: number;
};

const TAU = Math.PI * 2;

export default function ArtCanvas({ scene = "orbitMock", className, seed = 11 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stable seed per mount (unless user passes a different seed)
  const stableSeed = useMemo(() => seed, [seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function setSizeCssAndBuffer(wCss: number, hCss: number) {
      const w = Math.max(1, Math.floor(wCss));
      const h = Math.max(1, Math.floor(hCss));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function clear(bg = "#05060a") {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    function roundRectPath(x: number, y: number, w: number, h: number, r: number) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function mulberry32(seedValue: number) {
      let a = seedValue >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function softGlow(x: number, y: number, r: number, color = "rgba(96,165,250,0.6)") {
      const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.6);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.6, 0, TAU);
      ctx.fill();
    }

    function nebulaBackground(seedValue = 1) {
      const rnd = mulberry32(seedValue);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const g = ctx.createRadialGradient(w * 0.25, h * 0.2, 10, w * 0.55, h * 0.5, Math.max(w, h) * 0.95);
      g.addColorStop(0, "rgba(90,130,255,0.22)");
      g.addColorStop(0.3, "rgba(236,72,153,0.12)");
      g.addColorStop(0.62, "rgba(56,189,248,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 260; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const rr = lerp(18, 140, Math.pow(rnd(), 2));
        const hue = lerp(200, 320, rnd());
        ctx.fillStyle = `hsla(${hue}, 70%, 65%, ${lerp(0.02, 0.08, rnd())})`;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, TAU);
        ctx.fill();
      }

      for (let i = 0; i < 600; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const s = rnd() < 0.92 ? 1 : 2;
        ctx.globalAlpha = lerp(0.05, 0.55, rnd());
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
    }

    function glassOrb(
      x: number,
      y: number,
      r: number,
      opts: { core?: string; rim?: string; body?: string; tint?: string } = {}
    ) {
      const {
        core = "rgba(255,255,255,0.9)",
        rim = "rgba(255,255,255,0.30)",
        body = "rgba(8,15,35,0.80)",
        tint = "rgba(120,160,255,0.22)",
      } = opts;

      const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.15, x, y, r);
      grad.addColorStop(0, core);
      grad.addColorStop(0.35, tint);
      grad.addColorStop(1, body);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.arc(x - r * 0.22, y - r * 0.28, r * 0.18, 0, TAU);
      ctx.fill();
    }

    // ---------------- scenes ----------------
    function drawOrbitMock() {
      clear("#05060a");
      nebulaBackground(7 + stableSeed);

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      const panelW = w * 0.64;
      const panelH = h * 0.46;
      const px = cx - panelW / 2;
      const py = cy - panelH / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 20;
      ctx.fillStyle = "rgba(8,15,35,0.70)";
      roundRectPath(px, py, panelW, panelH, 56);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      roundRectPath(px, py, panelW, panelH, 56);
      ctx.stroke();

      const hi = ctx.createLinearGradient(px, py, px + panelW, py + panelH);
      hi.addColorStop(0, "rgba(255,255,255,0.08)");
      hi.addColorStop(0.55, "rgba(255,255,255,0)");
      hi.addColorStop(1, "rgba(255,255,255,0.05)");
      ctx.fillStyle = hi;
      roundRectPath(px, py, panelW, panelH, 56);
      ctx.fill();

      const orbCount = 12;
      const a = w * 0.40;
      const b = h * 0.30;
      const tilt = -0.25;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);

      for (let i = 0; i < orbCount; i++) {
        const t = (i / orbCount) * TAU + 0.55;
        let x = a * Math.cos(t);
        let y = b * Math.sin(t);
        const xr = x * ct - y * st;
        const yr = x * st + y * ct;
        const X = cx + xr;
        const Y = cy + yr;

        const depth = (Math.sin(t) + 1) / 2;
        const rr = lerp(22, 42, depth);
        const glowA = lerp(0.08, 0.22, depth);

        softGlow(X, Y, rr, `rgba(96,165,250,${glowA})`);
        glassOrb(X, Y, rr, {
          core: `rgba(255,255,255,${0.55 + 0.25 * depth})`,
          rim: `rgba(255,255,255,${0.18 + 0.22 * depth})`,
          body: `rgba(8,15,35,${0.78 + 0.12 * depth})`,
          tint: `rgba(120,160,255,${0.14 + 0.12 * depth})`,
        });
      }
    }

    // Lighter scene (useful for white sections)
    function drawMandala() {
      clear("#ffffff");

      const rnd = mulberry32(11 + stableSeed);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.46;

      const ringCount = 16;
      const rings: Array<{ t: number; radius: number; nodes: Array<{ a: number; x: number; y: number }> }> = [];

      for (let r = 0; r < ringCount; r++) {
        const t = r / (ringCount - 1);
        const radius = lerp(R * 0.06, R, t);
        const count = Math.round(lerp(18, 150, t));
        const jitter = lerp(0.0, 0.02, t);
        const nodes: Array<{ a: number; x: number; y: number }> = [];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU + (rnd() - 0.5) * jitter;
          nodes.push({ a, x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
        }
        rings.push({ t, radius, nodes });
      }

      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      for (const ring of rings) {
        const n = ring.nodes.length;
        const stride = Math.max(2, Math.floor(n / 30));
        const hop = Math.max(3, Math.floor(n / 17));
        for (let i = 0; i < n; i += stride) {
          const a = ring.nodes[i];
          const b = ring.nodes[(i + hop) % n];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let r = 0; r < rings.length - 1; r++) {
        const A = rings[r];
        const B = rings[r + 1];
        const nA = A.nodes.length;
        const nB = B.nodes.length;
        const stride = Math.max(1, Math.floor(nA / 55));
        for (let i = 0; i < nA; i += stride) {
          const a = A.nodes[i];
          const j = Math.floor((((a.a % TAU) + TAU) % TAU) / TAU * nB);
          for (let k = -1; k <= 1; k++) {
            const b = B.nodes[(j + k + nB) % nB];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const outer = rings[rings.length - 1].nodes;
      const nO = outer.length;
      for (let i = 0; i < nO; i += 4) {
        const a = outer[i];
        const b = outer[(i + Math.floor(nO / 7)) % nO];
        const c = outer[(i + Math.floor(nO / 11)) % nO];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      }

      const nodeColor = (t: number) => {
        if (t < 0.12) return "#1bd96a";
        if (t < 0.34) return "#f3ff2e";
        if (t < 0.66) return "#ff9b1a";
        return "#ff2a2a";
      };

      for (const ring of rings) {
        const t = ring.t;
        const col = nodeColor(t);
        const rNode = lerp(3.2, 5.6, t);
        ctx.fillStyle = col;
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 1.2;
        const stride = Math.max(1, Math.floor(ring.nodes.length / 260));
        for (let i = 0; i < ring.nodes.length; i += stride) {
          const p = ring.nodes[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, rNode, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.07, 0, TAU);
      ctx.stroke();
    }

    // Device scene: monitor+laptop+tablet+phone, pure geometry
    function drawDevices() {
      clear("#c9d8e8");
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const desk = ctx.createLinearGradient(0, 0, w, h);
      desk.addColorStop(0, "#cfe0f2");
      desk.addColorStop(1, "#99b3cf");
      ctx.fillStyle = desk;
      ctx.fillRect(0, 0, w, h);

      function device(x: number, y: number, W: number, H: number, r: number, bezel = 18, rot = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 14;

        ctx.fillStyle = "#0b1220";
        roundRectPath(-W / 2, -H / 2, W, H, r);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 2;
        roundRectPath(-W / 2, -H / 2, W, H, r);
        ctx.stroke();

        const sx = -W / 2 + bezel;
        const sy = -H / 2 + bezel;
        const sW = W - 2 * bezel;
        const sH = H - 2 * bezel;
        const g = ctx.createLinearGradient(sx, sy, sx + sW, sy + sH);
        g.addColorStop(0, "#79f3ff");
        g.addColorStop(1, "#3db8ff");
        ctx.fillStyle = g;
        roundRectPath(sx, sy, sW, sH, r * 0.7);
        ctx.fill();

        // simple UI tiles
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        const pad = sW * 0.06;
        const cols = 3;
        const rows = 2;
        const tileW = (sW - pad * 2 - (cols - 1) * pad) / cols;
        const tileH = (sH * 0.46 - (rows - 1) * pad) / rows;
        const ox = sx + pad;
        const oy = sy + sH * 0.40;
        for (let rr = 0; rr < rows; rr++) {
          for (let cc = 0; cc < cols; cc++) {
            roundRectPath(ox + cc * (tileW + pad), oy + rr * (tileH + pad), tileW, tileH, 16);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // monitor
      device(w * 0.36, h * 0.30, w * 0.52, h * 0.28, 26, 20, -0.02);
      // stand
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      roundRectPath(w * 0.36 - w * 0.05, h * 0.46, w * 0.10, h * 0.08, 16);
      ctx.fill();
      roundRectPath(w * 0.36 - w * 0.09, h * 0.54, w * 0.18, h * 0.03, 14);
      ctx.fill();

      // laptop
      device(w * 0.40, h * 0.68, w * 0.45, h * 0.24, 18, 16, 0.03);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      roundRectPath(w * 0.40 - w * 0.22, h * 0.76, w * 0.44, h * 0.10, 16);
      ctx.fill();

      // tablet
      device(w * 0.76, h * 0.46, w * 0.22, h * 0.30, 26, 16, 0.02);

      // phone
      device(w * 0.62, h * 0.58, w * 0.10, h * 0.18, 26, 12, -0.02);
    }

    // Overlapping website cards
    function drawCollage() {
      clear("#0b0f1a");
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.55, h * 0.45, w * 0.9);
      bg.addColorStop(0, "rgba(93,160,255,0.18)");
      bg.addColorStop(0.45, "rgba(236,72,153,0.10)");
      bg.addColorStop(1, "rgba(0,0,0,0.92)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      function card(x: number, y: number, W: number, H: number, rot: number, hue: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 34;
        ctx.shadowOffsetY = 16;

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        roundRectPath(-W / 2, -H / 2, W, H, 18);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.fillStyle = `hsla(${hue},65%,45%,0.92)`;
        roundRectPath(-W / 2, -H / 2, W, H * 0.22, 18);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(-W * 0.40, -H * 0.36, W * 0.56, H * 0.07);

        ctx.fillStyle = "rgba(0,0,0,0.06)";
        const pad = W * 0.06;
        const cols = 3;
        const rows = 2;
        const tileW = (W - pad * 2 - (cols - 1) * pad) / cols;
        const tileH = (H * 0.62 - (rows - 1) * pad) / rows;
        const ox = -W / 2 + pad;
        const oy = -H * 0.10;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            roundRectPath(ox + c * (tileW + pad), oy + r * (tileH + pad), tileW, tileH, 12);
            ctx.fill();
          }
        }

        ctx.fillStyle = "rgba(0,0,0,0.09)";
        roundRectPath(-W * 0.42, H * 0.34, W * 0.22, H * 0.06, 999);
        ctx.fill();
        roundRectPath(-W * 0.16, H * 0.34, W * 0.22, H * 0.06, 999);
        ctx.fill();

        ctx.restore();
      }

      const cards = [
        { x: w * 0.20, y: h * 0.35, W: w * 0.34, H: h * 0.42, rot: -0.18, hue: 210 },
        { x: w * 0.37, y: h * 0.48, W: w * 0.34, H: h * 0.42, rot: -0.06, hue: 280 },
        { x: w * 0.54, y: h * 0.35, W: w * 0.34, H: h * 0.42, rot: 0.10, hue: 35 },
        { x: w * 0.72, y: h * 0.52, W: w * 0.34, H: h * 0.42, rot: 0.20, hue: 155 },
        { x: w * 0.62, y: h * 0.68, W: w * 0.34, H: h * 0.42, rot: 0.02, hue: 330 },
      ];
      cards.forEach((c) => card(c.x, c.y, c.W, c.H, c.rot, c.hue));
    }

    // Phone overlay geometry (payments-style UI)
    function drawPhonePayments() {
      clear("#0b0f1a");
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(255,255,255,0.08)");
      bg.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const px = w * 0.18;
      const py = h * 0.18;
      const pW = w * 0.64;
      const pH = h * 0.64;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#05070c";
      roundRectPath(px, py, pW, pH, 48);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(8,10,16,0.98)";
      roundRectPath(px + 10, py + 10, pW - 20, pH - 20, 42);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillRect(px + pW * 0.16, py + pH * 0.16, pW * 0.55, pH * 0.035);
      ctx.fillRect(px + pW * 0.16, py + pH * 0.22, pW * 0.42, pH * 0.035);

      function field(y: number) {
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 2;
        roundRectPath(px + pW * 0.14, y, pW * 0.72, pH * 0.09, 16);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(px + pW * 0.18, y + pH * 0.03, pW * 0.38, pH * 0.02);
      }
      field(py + pH * 0.30);
      field(py + pH * 0.44);

      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.fillRect(px + pW * 0.14, py + pH * 0.62, pW * 0.42, pH * 0.02);
      ctx.fillRect(px + pW * 0.62, py + pH * 0.62, pW * 0.24, pH * 0.02);

      ctx.fillStyle = "#e11d7c";
      roundRectPath(px + pW * 0.14, py + pH * 0.70, pW * 0.72, pH * 0.10, 18);
      ctx.fill();

      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.43, h * 0.03, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.43, h * 0.012, 0, TAU);
      ctx.fill();
    }

    // Phone overlay geometry (deploy-style split panes)
    function drawPhoneDeploy() {
      clear("#0b0f1a");
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.60, w * 0.95);
      bg.addColorStop(0, "rgba(255,255,255,0.10)");
      bg.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const px = w * 0.14;
      const py = h * 0.22;
      const pW = w * 0.72;
      const pH = h * 0.54;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#05070c";
      roundRectPath(px, py, pW, pH, 48);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(245,247,252,0.98)";
      roundRectPath(px + 10, py + 10, pW - 20, pH - 20, 42);
      ctx.fill();

      const sx = px + 22;
      const sy = py + 24;
      const sW = pW - 44;
      const sH = pH - 48;

      ctx.fillStyle = "rgba(0,0,0,0.06)";
      roundRectPath(sx, sy, sW * 0.52, sH, 18);
      ctx.fill();
      roundRectPath(sx + sW * 0.56, sy, sW * 0.44, sH, 18);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      for (let i = 0; i < 14; i++) {
        const y = sy + 24 + i * 18;
        ctx.fillRect(sx + 18, y, lerp(sW * 0.18, sW * 0.44, (i % 5) / 4), 8);
      }

      ctx.fillStyle = "rgba(0,0,0,0.28)";
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(sx + sW * 0.58, sy + 130 + i * 24, sW * 0.36, 10);
      }

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      roundRectPath(w * 0.10, h * 0.74, w * 0.80, h * 0.18, 26);
      ctx.fill();
    }

    // Torus-flow: projected sphere grid + colorful flow line
    function drawTorusFlow() {
      clear("#000");
      const rnd = mulberry32(99 + stableSeed);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.34;

      // stars
      for (let i = 0; i < 520; i++) {
        ctx.globalAlpha = lerp(0.06, 0.30, rnd());
        ctx.fillStyle = "rgba(255,255,255,1)";
        const s = rnd() < 0.92 ? 1 : 2;
        ctx.fillRect(rnd() * w, rnd() * h, s, s);
      }
      ctx.globalAlpha = 1;

      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.3);
      glow.addColorStop(0, "rgba(80,160,255,0.25)");
      glow.addColorStop(0.4, "rgba(236,72,153,0.10)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();

      function project(x: number, y: number, z: number) {
        const k = 1 / (1 + 0.55 * z);
        return [cx + x * R * k, cy + y * R * k * 0.85] as const;
      }

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.3;

      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI;
        ctx.beginPath();
        for (let t = 0; t <= 220; t++) {
          const phi = (t / 220) * TAU;
          const x = Math.cos(a) * Math.cos(phi);
          const y = Math.sin(phi);
          const z = Math.sin(a) * Math.cos(phi);
          const [X, Y] = project(x, y, z);
          if (t === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }

      for (let j = -6; j <= 6; j++) {
        const lat = (j / 6) * (Math.PI / 2) * 0.85;
        ctx.beginPath();
        for (let t = 0; t <= 220; t++) {
          const lon = (t / 220) * TAU;
          const x = Math.cos(lat) * Math.cos(lon);
          const y = Math.sin(lat);
          const z = Math.cos(lat) * Math.sin(lon);
          const [X, Y] = project(x, y, z);
          if (t === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }

      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      const turns = 5.2;
      const steps = 900;
      for (let i = 0; i < steps - 1; i++) {
        const u = i / (steps - 1);
        const lat = Math.sin(u * TAU) * 0.55;
        const lon = u * TAU * turns + 0.6;
        const x = Math.cos(lat) * Math.cos(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.sin(lon);
        const [X, Y] = project(x, y, z);

        const u2 = (i + 1) / (steps - 1);
        const lat2 = Math.sin(u2 * TAU) * 0.55;
        const lon2 = u2 * TAU * turns + 0.6;
        const x2 = Math.cos(lat2) * Math.cos(lon2);
        const y2 = Math.sin(lat2);
        const z2 = Math.cos(lat2) * Math.sin(lon2);
        const [X2, Y2] = project(x2, y2, z2);

        const hue = (u * 360 * 2.2) % 360;
        const alpha = 0.25 + 0.55 * ((z + 1) / 2);
        ctx.strokeStyle = `hsla(${hue},90%,60%,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(X, Y);
        ctx.lineTo(X2, Y2);
        ctx.stroke();
      }
    }

    const renderers: Record<string, () => void> = {
      orbitMock: drawOrbitMock,
      mandala: drawMandala,
      devices: drawDevices,
      collage: drawCollage,
      phonePayments: drawPhonePayments,
      phoneDeploy: drawPhoneDeploy,
      torusFlow: drawTorusFlow,
    };

    function renderNow() {
      const fn = renderers[scene] || drawOrbitMock;
      fn();
    }

    // initial size + render
    const rect = parent.getBoundingClientRect();
    setSizeCssAndBuffer(rect.width, rect.height);
    renderNow();

    // keep in sync with layout
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSizeCssAndBuffer(cr.width, cr.height);
      renderNow();
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
    };
  }, [scene, stableSeed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
