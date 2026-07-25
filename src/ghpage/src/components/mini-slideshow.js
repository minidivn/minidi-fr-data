import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { getLang } from "../utils/i18n.js";

export class MiniSlideshow extends LitElement {
  static styles = css`
    :host { display: block; position: relative; overflow: hidden; }
    .track { position: relative; height: 160px; width: 100%; }
    .slide {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      opacity: 0; transition: opacity 1s ease; pointer-events: none;
      background-size: cover; background-position: center;
    }
    .slide.active { opacity: 1; }
    .slide::after {
      content: "";
      position: absolute; inset: 0;
      background: linear-gradient(transparent 50%, rgba(0,0,0,0.5));
    }
    .slide-label {
      position: relative; z-index: 1; font-size: 1.15rem;
      font-weight: 600; color: #fff;
      text-shadow: 0 2px 12px rgba(0,0,0,0.5); margin-bottom: 2px;
    }
    .slide-label-alt {
      position: relative; z-index: 1; font-size: 0.78rem;
      color: rgba(255,255,255,0.75); font-style: italic;
      text-shadow: 0 1px 6px rgba(0,0,0,0.4);
    }
    .dots {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; z-index: 2;
    }
    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.25); transition: 0.3s; cursor: pointer;
    }
    .dot.active { background: #fff; width: 20px; border-radius: 4px; }
    @media (max-width: 768px) {
      .track { height: 120px; }
      .slide-label { font-size: 0.9rem; }
      .slide-label-alt { font-size: 0.68rem; }
    }
  `;

  constructor() {
    super();
    const cfg = getConfig();
    this._slides = cfg.slides || [];
    this._index = 0;
    this._timer = null;
  }
  connectedCallback() { super.connectedCallback(); this._startTimer(); }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._timer); }
  _startTimer() {
    clearInterval(this._timer);
    if (this._slides.length < 2) return;
    this._timer = setInterval(() => {
      this._index = (this._index + 1) % this._slides.length;
      this.requestUpdate();
    }, 5000);
  }
  _goTo(i) { this._index = i; this._startTimer(); this.requestUpdate(); }

  render() {
    if (!this._slides.length) return "";
    const lang = getLang();
    return html`<div class="track">
      ${this._slides.map((s, i) => html`
        <div class="slide ${i === this._index ? "active" : ""}" style="background-image:url(${s.img});background-color:#1a1a2e">
          <div class="slide-label">${s.lang === lang ? s.label : (s.labelAlt || s.label)}</div>
          ${s.labelAlt ? html`<div class="slide-label-alt">${s.lang === lang ? s.labelAlt : s.label}</div>` : ""}
        </div>
      `)}
      <div class="dots">
        ${this._slides.map((_, i) => html`<div class="dot ${i === this._index ? "active" : ""}" @click=${() => this._goTo(i)}></div>`)}
      </div>
    </div>`;
  }
}
customElements.define("mini-slideshow", MiniSlideshow);
