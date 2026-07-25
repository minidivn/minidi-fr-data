import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t, getLang } from "../utils/i18n.js";

export class MiniTimeline extends LitElement {
  static styles = css`
    :host { display: block; }
    .era-section { margin-bottom: 8px; }
    .era-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: var(--bg3, #1e293b);
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      border-radius: var(--md);
      cursor: pointer; transition: 0.2s;
    }
    .era-header:hover { background: var(--border-color, rgba(255,255,255,0.07)); border-color: var(--a1); }
    .era-icon { font-size: 1.2rem; }
    .era-title { font-weight: 600; font-size: 0.92rem; color: var(--text); flex: 1; }
    .era-years { color: var(--text3); font-size: 0.75rem; }
    .era-count { font-size: 0.7rem; color: var(--text3); background: var(--bg2); padding: 2px 10px; border-radius: 20px; }
    .era-arrow { color: var(--text3); font-size: 0.7rem; transition: transform 0.2s; }
    .era-arrow.open { transform: rotate(90deg); }
    .era-entities { padding: 8px 0 8px 16px; }
    .entity-row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 8px; border-radius: 4px; cursor: pointer;
      font-size: 0.82rem; color: var(--text2); transition: 0.12s;
    }
    .entity-row:hover { color: var(--a1); background: var(--bg3, #1e293b); }
    .entity-year { color: var(--text3); font-size: 0.7rem; font-family: monospace; min-width: 40px; }
    .entity-type { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .type-place { background: var(--ok); }
    .type-person { background: var(--a1); }
    .type-event { background: var(--warn); }
    .type-other { background: var(--text3); }
    @media (max-width: 768px) {
      .era-header { padding: 10px 12px; }
    }
  `;

  static properties = { data: {} };
  constructor() {
    super();
    this._expanded = {};
    this._cfg = getConfig();
  }

  _getYear(n) {
    if (!n?.m) return null;
    for (const f of ["point_in_time", "start_time", "birth_date", "death_date"]) {
      const v = n.m[f];
      if (v) { const m = String(v).match(/(-?\d{4})/); if (m) return m[1]; }
    }
    return null;
  }

  _nodesInEra(era) {
    if (!this.data?.nodes) return [];
    const range = era.years;
    return this.data.nodes.filter((n) => {
      if (!n.m) return false;
      for (const f of ["point_in_time", "start_time", "birth_date", "death_date"]) {
        const v = n.m[f];
        if (v) {
          const match = String(v).match(/(-?\d{4})/);
          if (match) { const y = parseInt(match[1], 10); if (y >= range[0] && y <= range[1]) return true; }
        }
      }
      return false;
    });
  }

  _toggleEra(id) {
    this._expanded[id] = !this._expanded[id];
    this.requestUpdate();
  }

  _showDetail(id) {
    this.dispatchEvent(new CustomEvent("show-detail", { detail: { id } || id, bubbles: true, composed: true }));
  }

  render() {
    if (!this.data) return "";
    const cfg = this._cfg;
    const eras = cfg.eras || [];
    const lang = getLang();

    return html`<div>
      ${eras.map((era) => {
        const eraNodes = this._nodesInEra(era);
        const isOpen = this._expanded[era.id];
        const label = typeof era.label === "object" ? (era.label[lang] || era.label.en || era.id) : era.label;
        return html`
          <div class="era-section">
            <div class="era-header" @click=${() => this._toggleEra(era.id)}>
              <span class="era-icon">${era.emoji || "📜"}</span>
              <span class="era-title">${label}</span>
              <span class="era-years">${era.years ? (era.years[0] + " – " + (era.years[1] >= 9999 ? "present" : era.years[1])) : ""}</span>
              <span class="era-count">${eraNodes.length}</span>
              <span class="era-arrow ${isOpen ? "open" : ""}">▶</span>
            </div>
            ${isOpen ? html`
              <div class="era-entities">
                ${eraNodes.length === 0 ? html`<div style="color:var(--text3);font-size:0.78rem;padding:8px;">No entities in this era.</div>` : ""}
                ${eraNodes.slice(0, 100).map((n) => html`
                  <div class="entity-row" @click=${() => this._showDetail(n.id)}>
                    <span class="entity-type type-${n.t || "other"}"></span>
                    <span class="entity-year">${this._getYear(n) || ""}</span>
                    <span>${n.l}</span>
                    ${n.lv ? html`<span style="color:var(--text3);font-size:0.72rem">${n.lv}</span>` : ""}
                  </div>
                `)}
                ${eraNodes.length > 100 ? html`<div style="color:var(--text3);font-size:0.75rem;padding:4px 8px;">+ ${eraNodes.length - 100} more</div>` : ""}
              </div>
            ` : ""}
          </div>
        `;
      })}
    </div>`;
  }
}
customElements.define("mini-timeline", MiniTimeline);
