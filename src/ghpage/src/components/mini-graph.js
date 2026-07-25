import { LitElement, html, css } from "lit";
import { themeColors } from "../utils/theme-colors.js";

export class MiniGraph extends LitElement {
  static styles = css`
    :host { display: block; position: relative; user-select: none; }
    canvas { display: block; width: 100%; height: 600px; border-radius: var(--md); background: var(--bg3, #1e293b); cursor: grab; }
    canvas:active { cursor: grabbing; }
    .legend { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 8px 0; font-size: 0.75rem; color: var(--text2); }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
    .info { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--bg2); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); padding: 8px 16px; font-size: 0.72rem; color: var(--text3); pointer-events: none; white-space: nowrap; }
    .zoom-hint { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }
    .zoom-hint button { width: 28px; height: 28px; border-radius: var(--sm); border: 1px solid rgba(255,255,255,0.1); background: var(--bg2); color: var(--text2); cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; }
    .zoom-hint button:hover { background: var(--a1); color: #fff; }
  `;

  static properties = { data: {} };

  constructor() {
    super();
    this._nodes = [];
    this._edges = [];
    this._hovered = null;
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._panStartX = 0;
    this._panStartY = 0;
    this._W = 0;
    this._H = 0;
    this._positions = {};
    this._velocities = {};
  }

  firstUpdated() { if (this.data) this._build(); }
  updated(changed) { if (changed.has("data") && this.data) this._build(); }

  _screenToWorld(sx, sy) { return { x: (sx - this._W / 2) / this._zoom - this._panX, y: (sy - this._H / 2) / this._zoom - this._panY }; }
  _worldToScreen(wx, wy) { return { x: (wx + this._panX) * this._zoom + this._W / 2, y: (wy + this._panY) * this._zoom + this._H / 2 }; }

  _build() {
    if (!this.data?.nodes || !this.data?.edges) return;
    const connCount = {};
    this.data.edges.forEach((e) => { connCount[e.s] = (connCount[e.s] || 0) + 1; connCount[e.t] = (connCount[e.t] || 0) + 1; });
    const sorted = [...this.data.nodes].sort((a, b) => (connCount[b.id] || 0) - (connCount[a.id] || 0));
    const selected = new Set(sorted.slice(0, 200).map((n) => n.id));
    this._nodes = this.data.nodes.filter((n) => selected.has(n.id));
    const edgeSet = new Set();
    this._edges = this.data.edges.filter((e) => { if (!selected.has(e.s) || !selected.has(e.t)) return false; const k = e.s + ":" + e.t; if (edgeSet.has(k)) return false; edgeSet.add(k); return true; });

    const canvas = this.shadowRoot.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    this._W = rect.width;
    this._H = rect.height;

    this._positions = {};
    this._velocities = {};
    const nPts = this._nodes.length;
    const r = Math.min(this._W, this._H) * 0.35;
    this._nodes.forEach((n, i) => {
      const angle = (i / nPts) * Math.PI * 2;
      this._positions[n.id] = { x: Math.cos(angle) * r * (0.5 + Math.random() * 0.5), y: Math.sin(angle) * r * (0.5 + Math.random() * 0.5) };
      this._velocities[n.id] = { x: 0, y: 0 };
    });

    for (let iter = 0; iter < 80; iter++) {
      const forces = {};
      this._nodes.forEach((n) => {
        forces[n.id] = { x: 0, y: 0 };
        this._nodes.forEach((o) => {
          if (o.id === n.id) return;
          const dx = this._positions[n.id].x - this._positions[o.id].x;
          const dy = this._positions[n.id].y - this._positions[o.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = 5000 / (dist * dist);
          forces[n.id].x += (dx / dist) * f;
          forces[n.id].y += (dy / dist) * f;
        });
        forces[n.id].x += -this._positions[n.id].x * 0.01;
        forces[n.id].y += -this._positions[n.id].y * 0.01;
      });
      this._edges.forEach((e) => {
        const p1 = this._positions[e.s]; const p2 = this._positions[e.t];
        if (!p1 || !p2) return;
        const dx = p2.x - p1.x; const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = dist * 0.005;
        forces[e.s].x += dx * f; forces[e.s].y += dy * f;
        forces[e.t].x -= dx * f; forces[e.t].y -= dy * f;
      });
      this._nodes.forEach((n) => {
        this._velocities[n.id].x = (this._velocities[n.id].x + forces[n.id].x) * 0.7;
        this._velocities[n.id].y = (this._velocities[n.id].y + forces[n.id].y) * 0.7;
        this._positions[n.id].x += this._velocities[n.id].x;
        this._positions[n.id].y += this._velocities[n.id].y;
      });
    }
    this._draw();
  }

  _draw() {
    const canvas = this.shadowRoot.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, this._W, this._H);
    ctx.save();
    ctx.translate(this._W / 2, this._H / 2);
    ctx.scale(this._zoom, this._zoom);
    ctx.translate(this._panX, this._panY);
    const col = themeColors(this);
    ctx.strokeStyle = col.edge;
    ctx.lineWidth = 0.5 / this._zoom;
    this._edges.forEach((e) => {
      const p1 = this._positions[e.s]; const p2 = this._positions[e.t];
      if (!p1 || !p2) return;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    });
    this._nodes.forEach((n) => {
      const p = this._positions[n.id]; if (!p) return;
      const color = themeColors(this)[n.t] || "#64748b";
      const baseR = n.id === this._hovered ? 8 : 5; const r = baseR / this._zoom;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
      if (n.id === this._hovered) {
        ctx.strokeStyle = col.text; ctx.lineWidth = 2 / this._zoom; ctx.stroke();
        ctx.fillStyle = col.text; ctx.font = 12 / this._zoom + "px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.fillText(n.l, p.x, p.y - r - 6 / this._zoom);
      }
    });
    ctx.restore();
  }

  _onWheel(e) {
    e.preventDefault();
    const rect = this.shadowRoot.querySelector("canvas").getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(0.2, Math.min(10, this._zoom * factor));
    this._panX -= (mx / this._zoom - mx / newZoom) / newZoom;
    this._panY -= (my / this._zoom - my / newZoom) / newZoom;
    this._zoom = newZoom; this._draw();
  }

  _onDragStart(e) { this._isDragging = true; this._dragStartX = e.clientX; this._dragStartY = e.clientY; this._panStartX = this._panX; this._panStartY = this._panY; }
  _onDragMove(e) { if (!this._isDragging) return; this._panX = this._panStartX + (e.clientX - this._dragStartX) / this._zoom; this._panY = this._panStartY + (e.clientY - this._dragStartY) / this._zoom; this._draw(); }
  _onDragEnd() { this._isDragging = false; }

  _onHover(e) {
    const rect = this.shadowRoot.querySelector("canvas").getBoundingClientRect();
    const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
    const w = this._screenToWorld(sx, sy);
    let found = null;
    const threshold = 144 / (this._zoom * this._zoom);
    for (const n of this._nodes) {
      const p = this._positions[n.id]; if (!p) continue;
      const dx = p.x - w.x; const dy = p.y - w.y;
      if (dx * dx + dy * dy < threshold) { found = n; break; }
    }
    this._hovered = found?.id || null;
    this._draw();
    const info = this.shadowRoot.querySelector(".info");
    if (info) info.textContent = found ? `${found.l}${found.lv ? " (" + found.lv + ")" : ""} — ${found.t || "other"}` : "";
  }

  render() {
    return html`
      <div class="legend">
        <span><span class="dot" style="background:var(--a1,#6366f1)"></span> People</span>
        <span><span class="dot" style="background:var(--ok,#22c55e)"></span> Places</span>
        <span><span class="dot" style="background:var(--warn,#eab308)"></span> Events</span>
      </div>
      <div style="position:relative">
        <canvas @mousemove=${e => { this._onHover(e); this._onDragMove(e); }} @wheel=${this._onWheel} @mousedown=${this._onDragStart} @mouseup=${this._onDragEnd} @mouseleave=${this._onDragEnd}></canvas>
        <div class="zoom-hint">
          <button @click=${() => { this._zoom = Math.min(10, this._zoom * 1.4); this._draw(); }}>+</button>
          <button @click=${() => { this._zoom = Math.max(0.2, this._zoom / 1.4); this._draw(); }}>−</button>
          <button @click=${() => { this._zoom = 1; this._panX = 0; this._panY = 0; this._draw(); }}>⟲</button>
        </div>
      </div>
      <div class="info">Scroll to zoom · Drag to pan · Hover for details</div>
    `;
  }
}
customElements.define("mini-graph", MiniGraph);
