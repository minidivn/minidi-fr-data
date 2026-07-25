import { LitElement, html, css } from "lit";
import { t } from "../utils/i18n.js";

const DYNASTY_RELATIONS = new Set([
  "child", "parent", "founded_by", "founder", "position_held",
  "preceded_by", "followed_by", "member_of", "head_of_state", "head_of_government",
]);

const DYNASTY_KEYWORDS = [
  "dynasty", "triều", "nhà", "vua", "king", "emperor",
  "hoàng đế", "empire", "quốc",
];

export class MiniTree extends LitElement {
  static styles = css`
    :host { display: block; padding: 8px 0; }
    .tree-container { max-width: 800px; margin: 0 auto; }
    .dynasty-card { background: var(--bg3, #1e293b); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); padding: 14px 18px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; }
    .dynasty-card:hover { background: var(--border-color, rgba(255,255,255,0.07)); border-color: var(--a1); }
    .dynasty-header { display: flex; align-items: center; gap: 10px; }
    .dynasty-icon { font-size: 1.3rem; }
    .dynasty-name { font-weight: 600; font-size: 0.95rem; color: var(--text); }
    .dynasty-years { color: var(--text3); font-size: 0.72rem; margin-left: auto; }
    .ruler-list { margin-top: 8px; padding-left: 32px; display: flex; flex-direction: column; gap: 2px; }
    .ruler-item { display: flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 4px; font-size: 0.82rem; color: var(--text2); cursor: pointer; transition: 0.15s; }
    .ruler-item:hover { color: var(--a1); background: var(--bg3, #1e293b); }
    .ruler-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--a2); flex-shrink: 0; }
    .ruler-years { color: var(--text3); font-size: 0.7rem; margin-left: auto; font-family: monospace; }
    .empty { text-align: center; color: var(--text3); padding: 40px; font-size: 0.85rem; }
    .search-box { display: flex; justify-content: center; margin-bottom: 16px; }
    .search-box input { width: 100%; max-width: 400px; padding: 8px 12px; background: var(--bg3); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); color: var(--text); font-size: 0.85rem; outline: none; }
    .search-box input:focus { border-color: var(--a1); box-shadow: 0 0 16px rgba(99,102,241,0.15); }
  `;

  static properties = { data: {} };

  constructor() {
    super();
    this._expanded = new Set();
    this._searchQuery = "";
  }

  _isDynastyEntity(n) {
    const text = ((n.l || "") + " " + (n.lv || "") + " " + (n.d || "")).toLowerCase();
    return DYNASTY_KEYWORDS.some((kw) => text.includes(kw));
  }

  _getRulers(dynastyNode, allNodes, allEdges) {
    if (!allEdges) return [];
    const dynEdges = allEdges.filter((e) => e.r === "founded_by" || e.r === "member_of");
    const childEdges = allEdges.filter(
      (e) => e.s === dynastyNode.id && (e.r === "child" || e.r === "followed_by" || e.r === "position_held"),
    );
    const rulerIds = new Set();
    dynEdges.filter((e) => e.t === dynastyNode.id).forEach((e) => rulerIds.add(e.s));
    childEdges.forEach((e) => rulerIds.add(e.t));
    const rulers = [];
    rulerIds.forEach((id) => { const node = allNodes.find((n) => n.id === id); if (node) rulers.push(node); });
    return rulers.slice(0, 15);
  }

  _getDynasties() {
    if (!this.data) return [];
    const all = this.data.nodes.filter((n) => this._isDynastyEntity(n));
    if (this.data.edges) {
      this.data.edges.forEach((e) => {
        if (DYNASTY_RELATIONS.has(e.r)) {
          const target = this.data.nodes.find((n) => n.id === e.t);
          if (target && !all.includes(target) && (e.r === "founded_by" || e.r === "member_of")) all.push(target);
        }
      });
    }
    const seen = new Set();
    return all.filter((n) => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
  }

  _showDetail(id) {
    this.dispatchEvent(new CustomEvent("show-detail", { detail: id, bubbles: true, composed: true }));
  }

  _onSearch(e) { this._searchQuery = e.target.value.toLowerCase(); this.requestUpdate(); }

  _toggleExpand(id) {
    if (this._expanded.has(id)) this._expanded.delete(id);
    else this._expanded.add(id);
    this.requestUpdate();
  }

  _getYear(n) {
    if (!n.m) return null;
    for (const field of ["point_in_time", "start_time", "birth_date"]) {
      const val = n.m[field];
      if (val) { const m = String(val).match(/(-?\d{4})/); if (m) return m[1]; }
    }
    return null;
  }

  render() {
    if (!this.data) return "";
    const dynasties = this._getDynasties();
    const filtered = this._searchQuery
      ? dynasties.filter((n) => { const text = ((n.l || "") + " " + (n.lv || "") + " " + (n.d || "")).toLowerCase(); return text.includes(this._searchQuery); })
      : dynasties;

    return html`
      <div class="tree-container">
        <div class="search-box">
          <input type="text" placeholder="${t("search")}" @input=${this._onSearch} />
        </div>
        ${filtered.length === 0 ? html`<div class="empty">${t("noResults")}</div>` : filtered.slice(0, 80).map((n) => html`
          <div class="dynasty-card">
            <div class="dynasty-header" @click=${() => this._toggleExpand(n.id)}>
              <span class="dynasty-icon">🏛</span>
              <span class="dynasty-name">${n.l}</span>
              ${n.lv ? html`<span style="color:var(--text3);font-size:0.72rem">${n.lv}</span>` : ""}
              <span class="dynasty-years">${this._getYear(n) || ""}</span>
              <span style="color:var(--text3);font-size:0.7rem">${this._expanded.has(n.id) ? "▼" : "▶"}</span>
            </div>
            ${this._expanded.has(n.id) ? html`
              <div class="ruler-list">
                ${n.d ? html`<div style="font-size:0.78rem;color:var(--text3);padding:4px 0">${n.d}</div>` : ""}
                ${this._getRulers(n, this.data.nodes, this.data.edges).map((r) => html`
                  <div class="ruler-item" @click=${() => this._showDetail(r.id)}>
                    <span class="ruler-dot"></span>
                    <span>${r.l}</span>
                    ${r.lv ? html`<span style="color:var(--text3);font-size:0.7rem">${r.lv}</span>` : ""}
                    <span class="ruler-years">${this._getYear(r) || ""}</span>
                  </div>
                `)}
              </div>
            ` : ""}
          </div>
        `)}
      </div>
    `;
  }
}
customElements.define("mini-tree", MiniTree);
