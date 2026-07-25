import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { getStats } from "../utils/data-loader.js";
import { t } from "../utils/i18n.js";

export class MiniHero extends LitElement {
  static styles = css`
    :host {
      position: relative;
      text-align: center;
      padding: 40px max(20px, calc((100vw - 1100px) / 2)) 28px;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .gradient-text {
      background: linear-gradient(135deg, var(--a1), var(--a2), var(--a3));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h1 { font-size: 2rem; font-weight: 800; margin: 0 0 6px; }
    p { color: var(--text2); font-size: 0.9rem; margin: 0 0 14px; }
    .stats { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .stat {
      text-align: center;
      padding: 10px 22px;
      border-radius: var(--md);
      cursor: pointer;
      transition: 0.2s;
      background: var(--bg3, #1e293b);
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      min-width: 100px;
    }
    .stat:hover { background: var(--border-color, rgba(255,255,255,0.07)); border-color: rgba(255,255,255,0.12); transform: translateY(-2px); }
    .stat:active { transform: translateY(0); }
    .stat .num {
      font-size: 1.4rem; font-weight: 700;
      background: linear-gradient(135deg, var(--a1), var(--a2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat .label { color: var(--text3); font-size: 0.72rem; margin-top: 2px; }
    @media (max-width: 768px) {
      :host { padding: 24px 10px 20px; min-height: 120px; }
      h1 { font-size: 1.4rem; }
      p { font-size: 0.8rem; }
      .stat { padding: 8px 14px; min-width: 70px; }
      .stat .num { font-size: 1.1rem; }
      .stats { gap: 8px; }
    }
  `;

  static properties = { data: {} };

  _onFilter(type) {
    this.dispatchEvent(new CustomEvent("filter-type", { detail: { filter: type, query: "" }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.data) return "";
    const cfg = getConfig();
    const stats = getStats(this.data.nodes);
    const items = [
      { type: "all", count: this.data.meta.entity_count, label: "entities" },
      { type: "event", count: stats.event || 0, label: "events" },
      { type: "person", count: stats.person || 0, label: "people" },
      { type: "place", count: stats.place || 0, label: "places" },
    ];
    return html`
      <h1><span class="gradient-text">${cfg.countryEmoji} ${cfg.title}</span></h1>
      <p>${cfg.subtitle.replace("{n}", this.data.meta.entity_count.toLocaleString())}</p>
      <div class="stats">
        ${items.map(item => html`
          <div class="stat" @click=${() => this._onFilter(item.type)}>
            <div class="num">${item.count.toLocaleString()}</div>
            <div class="label">${t(item.label)}</div>
          </div>
        `)}
      </div>
    `;
  }
}
customElements.define("mini-hero", MiniHero);
