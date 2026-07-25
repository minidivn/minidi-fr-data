import { LitElement, html, css } from "lit";
import { filterByType } from "../utils/data-loader.js";
import { t } from "../utils/i18n.js";

export class MiniSearch extends LitElement {
  static styles = css`
    :host { display: block; padding: 8px 0; }
    .filters { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin: 8px 0; }
    .filter-btn { padding: 3px 12px; border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: 20px; background: transparent; color: var(--text2); cursor: pointer; font-size: 0.74rem; transition: 0.3s; }
    .filter-btn:hover { border-color: var(--a1); color: var(--a1); }
    .filter-btn.active { background: rgba(99,102,241,0.15); border-color: var(--a1); color: var(--a1); }
    .card { background: var(--bg3, #1e293b); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); padding: 12px 16px; margin-bottom: 6px; cursor: pointer; transition: 0.3s; }
    .card:hover { background: var(--border-color, rgba(255,255,255,0.07)); border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
    .card-title { font-size: 0.92rem; font-weight: 600; color: var(--a1); }
    .card-title-vi { font-size: 0.75rem; color: var(--text3); font-style: italic; }
    .card-desc { color: var(--text2); font-size: 0.8rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .badge { font-size: 0.6rem; padding: 1px 8px; border-radius: 20px; font-weight: 500; }
    .badge-place { background: rgba(34,197,94,0.15); color: var(--ok); }
    .badge-person { background: rgba(99,102,241,0.15); color: var(--a1); }
    .badge-event { background: rgba(234,179,8,0.15); color: var(--warn); }
    .badge-other { background: var(--bg3); color: var(--text3); }
    .status { text-align: center; font-size: 0.82rem; color: var(--text3); }
    .pagination { text-align: center; display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
  `;

  static properties = {
    data: {}, bm25: {}, filter: {}, page: { state: true }, query: {},
  };

  constructor() {
    super();
    this.filter = "all";
    this.page = 0;
    this.query = "";
    this.PAGE_SIZE = 40;
  }

  updated(changed) {
    if (changed.has("query") && this.query && this.shadowRoot) {
      const input = this.shadowRoot.querySelector("input");
      if (input) input.value = this.query;
    }
    if (changed.has("filter") && this.shadowRoot) {
      this.page = 0;
    }
  }

  _setFilter(type) {
    this.filter = type;
    this.page = 0;
    this._search();
  }

  _showDetail(id) {
    this.dispatchEvent(new CustomEvent("show-detail", { detail: id, bubbles: true, composed: true }));
  }

  _search() {
    const input = this.shadowRoot.querySelector("input");
    this.query = input ? input.value : "";
    this.requestUpdate();
  }

  get _filteredNodes() {
    let nodes = this.data ? this.data.nodes : [];
    if (this.filter !== "all") nodes = nodes.filter((n) => n.t === this.filter);
    if (this.query) {
      const scores = this.bm25 ? this.bm25(this.query) : [];
      const ids = new Set(scores.map((s) => this.data.nodes[s.index].id));
      nodes = nodes.filter((n) => ids.has(n.id));
    }
    return nodes;
  }

  render() {
    if (!this.data) return "";
    const nodes = this._filteredNodes;
    const total = nodes.length;
    const pages = Math.ceil(total / this.PAGE_SIZE);
    const start = this.page * this.PAGE_SIZE;
    const end = Math.min(start + this.PAGE_SIZE, total);
    const pageNodes = nodes.slice(start, end);

    return html`
      <div class="filters">
        <button class="filter-btn ${this.filter === "all" ? "active" : ""}" @click=${() => this._setFilter("all")}>${t("all")}</button>
        <button class="filter-btn ${this.filter === "place" ? "active" : ""}" @click=${() => this._setFilter("place")}>📍 Places</button>
        <button class="filter-btn ${this.filter === "person" ? "active" : ""}" @click=${() => this._setFilter("person")}>👤 People</button>
        <button class="filter-btn ${this.filter === "event" ? "active" : ""}" @click=${() => this._setFilter("event")}>📅 Events</button>
      </div>

      <div class="status">
        ${this.query ? t("results", { n: total }) : t("entitiesTotal", { n: total })}
        ${this.query ? "" : ` - ${t("page", { p: this.page + 1, t: pages })}`}
      </div>

      ${pageNodes.map((n) => html`
        <div class="card" @click=${() => this._showDetail(n.id)}>
          <div>
            <span class="card-title">${n.l}</span>
            ${n.lv ? html`<span class="card-title-vi"> ${n.lv}</span>` : ""}
            <span class="badge badge-${n.t || "other"}">${n.t || "other"}</span>
          </div>
          <div class="card-desc">${n.d || ""}</div>
        </div>
      `)}
      ${total > this.PAGE_SIZE ? html`
        <div class="pagination">
          ${this.page > 0 ? html`<button class="filter-btn" @click=${() => { this.page--; }}>← ${t("prev")}</button>` : ""}
          <span>${this.page + 1} / ${pages}</span>
          ${end < total ? html`<button class="filter-btn" @click=${() => { this.page++; }}>${t("next")} →</button>` : ""}
        </div>
      ` : ""}
    `;
  }
}
customElements.define("mini-search", MiniSearch);
