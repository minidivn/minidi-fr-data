import { LitElement, html, css } from "lit";
import { getConfig } from "./config/store.js";
import { loadData } from "./utils/data-loader.js";
import { buildBM25 } from "./utils/bm25.js";
import { getLang } from "./utils/i18n.js";

// Import all components so their custom element registrations fire
import "./components/mini-header.js";
import "./components/mini-hero.js";
import "./components/mini-search.js";
import "./components/mini-map.js";
import "./components/mini-timeline.js";
import "./components/mini-tree.js";
import "./components/mini-footer.js";
import "./components/mini-slideshow.js";
import "./components/mini-chat.js";
import "./components/mini-detail.js";
import "./components/mini-graph.js";
import "./components/mini-options.js";

export class MiniApp extends LitElement {
  static styles = css`
    :host {
      --bg: #070b17;
      --bg2: #0f172a;
      --bg3: #1e293b;
      --a1: #6366f1;
      --a2: #06b6d4;
      --a3: #a78bfa;
      --text: #f1f5f9;
      --text2: #94a3b8;
      --text3: #64748b;
      --ok: #22c55e;
      --warn: #eab308;
      --border-color: rgba(255,255,255,0.07);
      --sm: 6px;
      --md: 10px;
      --lg: 16px;
      display: block;
      min-height: 100vh;
      font-family: "Inter", sans-serif;
    }

    .splash {
      position: fixed;
      inset: 0;
      z-index: 999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      transition: opacity 0.8s, transform 0.8s;
    }

    .splash.hidden {
      opacity: 0;
      transform: scale(1.05);
      pointer-events: none;
    }

    .spinner {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid var(--bg3);
      border-top-color: var(--a1);
      border-right-color: var(--a2);
      animation: spin 1s linear infinite;
      margin-bottom: 24px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .splash-logo {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--a1), var(--a2), var(--a3));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }

    .status {
      color: var(--text3);
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    .track {
      width: 240px;
      height: 4px;
      background: var(--bg3);
      border-radius: 2px;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--a1), var(--a2));
      border-radius: 2px;
      transition: width 0.3s;
    }

    .pct {
      color: var(--text3);
      font-size: 0.75rem;
      margin-top: 8px;
    }

    .app-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 16px;
    }

    @media (max-width: 768px) {
      .app-container {
        padding: 0 10px;
      }
    }
  `;

  static properties = {
    data: { state: true },
    loaded: { state: true },
    progress: { state: true },
    totalSize: { state: true },
    currentView: { state: true },
    entityDetail: { state: true },
    searchQuery: { state: true },
    searchFilter: { state: true },
  };

  constructor() {
    super();
    const cfg = getConfig();
    this._cfg = cfg;

    this.data = null;
    this.loaded = false;
    this.progress = 0;
    this.totalSize = 0;
    this.currentView = "search";
    this.entityDetail = null;
    this.bm25 = null;
    this.searchQuery = "";
    this.searchFilter = "all";
    this._pendingEntityFromUrl = null;
    this._loadData();
    this._initRouting();
  }

  _initRouting() {
    const hash = location.hash.substring(1);
    if (hash) {
      this._pendingEntityFromUrl = hash;
    } else {
      const p = new URLSearchParams(location.search);
      const entityRaw = p.get("entity");
      if (entityRaw) this._pendingEntityFromUrl = entityRaw.split("/")[0];
      if (p.has("view")) this.currentView = p.get("view");
    }

    window.addEventListener("hashchange", () => {
      const h = location.hash.substring(1);
      if (h) {
        const n = this.data?.nodes?.find((n) => n.id === h);
        if (n) {
          this.entityDetail = n;
          this.currentView = "detail";
          this.requestUpdate();
        }
      } else {
        this.currentView = "search";
        this.entityDetail = null;
        this.requestUpdate();
      }
    });

    window.addEventListener("popstate", () => {
      if (!location.hash) {
        const q = new URLSearchParams(location.search);
        if (q.has("entity")) {
          const id = q.get("entity")?.split("/")[0];
          const n = this.data?.nodes?.find((n) => n.id === id);
          if (n) { this.entityDetail = n; this.currentView = "detail"; this.requestUpdate(); }
        } else {
          this.currentView = q.get("view") || "search";
          this.entityDetail = null;
          this.requestUpdate();
        }
      }
    });
  }

  _pushUrl() {
    if (this.currentView === "detail" && this.entityDetail) {
      if (location.hash !== "#" + this.entityDetail.id) {
        location.hash = this.entityDetail.id;
      }
    } else {
      if (location.hash) {
        history.pushState("", document.title, location.pathname + location.search);
      }
    }
  }

  async _loadData() {
    try {
      this.data = await loadData((loaded, total) => {
        this.progress = loaded;
        this.totalSize = total;
      }, this._cfg.dataPath);
      this.loaded = true;
      this.bm25 = buildBM25(this.data.nodes);
      if (this._pendingEntityFromUrl) {
        const n = this.data.nodes.find((n) => n.id === this._pendingEntityFromUrl);
        if (n) { this.entityDetail = n; this.currentView = "detail"; this._pendingEntityFromUrl = null; }
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  _onNavigate(e) {
    const view = e.detail;
    this.currentView = view;
    if (view !== "detail") this.entityDetail = null;
    this._pushUrl();
  }

  _onSearchInput(query) {
    this.searchQuery = query;
    this.currentView = "search";
  }

  _onFilterType(e) {
    this.searchFilter = e.detail.filter;
    this.searchQuery = e.detail.query || "";
    this.currentView = "search";
  }

  _onLangChanged() {
    this.requestUpdate();
  }

  _onShowDetail(e) {
    const id = e.detail;
    const node = this.data.nodes.find((n) => n.id === id);
    if (node) {
      this.entityDetail = node;
      this.currentView = "detail";
      this._pushUrl();
    }
  }

  _onNavigateDetail(e) {
    this._onShowDetail({ detail: e.detail });
  }

  render() {
    const cfg = this._cfg;

    if (!this.loaded) {
      const pct = this.totalSize ? Math.round((this.progress / this.totalSize) * 100) : 0;
      return html`
        <div class="splash">
          <div class="splash-logo">${cfg.splashTitle}</div>
          <div class="spinner"></div>
          <div class="status">${cfg.splashMessage}</div>
          <div class="track"><div class="bar" style="width: ${pct}%"></div></div>
          <div class="pct">${pct}% (${(this.progress / 1048576).toFixed(1)} / ${(this.totalSize / 1048576).toFixed(1)} MB)</div>
        </div>
      `;
    }

    const isDetail = this.currentView === "detail";

    return html`
      <mini-header
        .view=${this.currentView}
        .entityName=${isDetail && this.entityDetail ? this.entityDetail.l : ""}
        @navigate=${this._onNavigate}
        @search-input=${(e) => this._onSearchInput(e.detail)}
        @lang-changed=${this._onLangChanged}
      ></mini-header>

      ${!isDetail ? html`
        <mini-slideshow></mini-slideshow>
        <mini-hero .data=${this.data} @filter-type=${this._onFilterType}></mini-hero>
      ` : ""}

      <div class="app-container">${this._renderView()}</div>

      <mini-footer .data=${this.data}></mini-footer>
      <mini-chat .data=${this.data} .bm25=${this.bm25}></mini-chat>
    `;
  }

  _renderView() {
    switch (this.currentView) {
      case "map": return html`<mini-map .data=${this.data}></mini-map>`;
      case "graph": return html`<mini-graph .data=${this.data}></mini-graph>`;
      case "options": return html`<mini-options @lang-changed=${this._onLangChanged}></mini-options>`;
      case "timeline": return html`<mini-timeline .data=${this.data} @show-detail=${this._onShowDetail}></mini-timeline>`;
      case "tree": return html`<mini-tree .data=${this.data} @show-detail=${this._onShowDetail}></mini-tree>`;
      case "detail": return html`<mini-detail .node=${this.entityDetail} .edges=${this.data.edges} @navigate-detail=${this._onNavigateDetail}></mini-detail>`;
      default: return html`<mini-search .data=${this.data} .bm25=${this.bm25} .query=${this.searchQuery} .filter=${this.searchFilter} @show-detail=${this._onShowDetail}></mini-search>`;
    }
  }
}

customElements.define("mini-app", MiniApp);
