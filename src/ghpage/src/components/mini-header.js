import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t, setLang, getLang } from "../utils/i18n.js";

export class MiniHeader extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 max(16px, calc((100vw - 1100px) / 2));
      height: 56px;
      background: var(--bg2, rgba(15, 23, 42, 0.85));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
      position: sticky;
      top: 0;
      z-index: 50;
      color: var(--text, #f1f5f9);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, var(--a1), var(--a2));
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: var(--text2);
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
      padding: 4px 10px;
      border-radius: var(--sm);
      transition: 0.2s;
      flex-shrink: 0;
    }
    .back-btn:hover { color: var(--text); background: var(--border-color, rgba(255,255,255,0.07)); }
    .detail-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .search-box { flex: 1; max-width: 360px; position: relative; }
    .search-box input {
      width: 100%;
      padding: 7px 12px 7px 32px;
      background: var(--bg3, #1e293b);
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      border-radius: var(--md);
      color: var(--text);
      font-size: 0.85rem;
      outline: none;
    }
    .search-box input:focus { border-color: var(--a1); box-shadow: 0 0 16px rgba(99,102,241,0.15); }
    .search-box input::placeholder { color: var(--text3); }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text3);
      font-size: 0.8rem;
    }
    .nav-tabs {
      display: flex;
      gap: 2px;
      background: var(--bg3);
      border-radius: var(--sm);
      padding: 2px;
    }
    .nav-tab {
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--text3);
      cursor: pointer;
      font-size: 0.78rem;
      transition: 0.3s;
    }
    .nav-tab:hover { color: var(--text2); }
    .nav-tab.active { background: var(--a1); color: #fff; }
    .lang-toggle {
      display: flex;
      background: var(--bg3);
      border-radius: var(--sm);
      overflow: hidden;
      flex-shrink: 0;
    }
    .lang-btn {
      padding: 4px 9px;
      border: none;
      background: transparent;
      color: var(--text3);
      cursor: pointer;
      font-size: 0.75rem;
      transition: 0.2s;
    }
    .lang-btn.active { background: var(--a1); color: #fff; }
    .dropdown { position: relative; flex-shrink: 0; }
    .dropdown-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 5px 10px;
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      border-radius: var(--sm);
      background: transparent; color: var(--text2); cursor: pointer;
      font-size: 0.75rem; font-family: inherit; transition: 0.2s;
    }
    .dropdown-btn:hover { border-color: var(--a1); color: var(--text); }
    .dropdown-btn .arrow { font-size: 0.6rem; transition: transform 0.2s; }
    .dropdown-btn .arrow.open { transform: rotate(180deg); }
    .dropdown-menu {
      position: absolute; top: 100%; left: 50%;
      transform: translateX(-50%); margin-top: 6px;
      background: var(--bg2); border: 1px solid rgba(255,255,255,0.1);
      border-radius: var(--md); min-width: 170px; max-width: min(300px,90vw);
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      display: none; flex-direction: column; padding: 4px; z-index: 999;
    }
    .dropdown-menu.open { display: flex; }
    .dropdown-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: var(--sm); background: none;
      border: none; color: var(--text2); cursor: pointer;
      font-size: 0.8rem; font-family: inherit; text-align: left; transition: 0.12s;
    }
    .dropdown-item:hover { background: var(--border-color, rgba(255,255,255,0.07)); color: var(--text); }
    .github-link { color: var(--text3); font-size: 1.2rem; text-decoration: none; flex-shrink: 0; }
    @media (max-width: 768px) {
      :host { gap: 6px; padding: 0 10px; height: 50px; }
      .search-box { display: none; }
      .nav-tab { padding: 4px 7px; font-size: 0.72rem; }
      .lang-btn { padding: 3px 7px; font-size: 0.7rem; }
      .logo { font-size: 0.85rem; }
      .logo-icon { width: 24px; height: 24px; font-size: 0.85rem; }
    }
  `;

  static properties = { view: {}, entityName: {}, lang: {} };
  constructor() {
    super();
    this.lang = "en";
    this._dropdownOpen = false;
    const cfg = getConfig();
    this._cfg = cfg;
  }

  _toggleDropdown() { this._dropdownOpen = !this._dropdownOpen; this.requestUpdate(); }
  _closeDropdown() { this._dropdownOpen = false; this.requestUpdate(); }
  _navigate(v) { this.dispatchEvent(new CustomEvent("navigate", { detail: v })); }
  _onSearchKeydown(e) {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      this.dispatchEvent(new CustomEvent("search-input", { detail: query }));
      this.dispatchEvent(new CustomEvent("navigate", { detail: "search" }));
    }
  }
  _setLang(lang) {
    this.lang = lang;
    setLang(lang);
    this.dispatchEvent(new CustomEvent("lang-changed", { detail: lang }));
  }

  render() {
    const cfg = this._cfg;
    const isDetail = this.view === "detail";

    // Dynamic lang buttons from config
    const langBtns = cfg.languages.map(
      (l) => html`
        <button
          class="lang-btn ${this.lang === l ? "active" : ""}"
          @click=${() => this._setLang(l)}
        >
          ${l.toUpperCase()}
        </button>
      `
    );

    const commonNav = html`
      <div class="nav-tabs">
        <button class="nav-tab ${this.view === "search" ? "active" : ""}" @click=${() => this._navigate("search")} title="Search">🔍</button>
        <button class="nav-tab ${this.view === "map" ? "active" : ""}" @click=${() => this._navigate("map")} title="Map">🗺</button>
        <button class="nav-tab ${this.view === "timeline" ? "active" : ""}" @click=${() => this._navigate("timeline")} title="Timeline">📅</button>
        <button class="nav-tab ${this.view === "tree" ? "active" : ""}" @click=${() => this._navigate("tree")} title="Dynasty Tree">🌳</button>
      </div>
      <div class="lang-toggle">${langBtns}</div>
      <a href="https://github.com/${cfg.githubRepo}" target="_blank" class="github-link" title="GitHub">📒</a>
      <div class="dropdown">
        <button class="dropdown-btn" @click=${this._toggleDropdown}>
          ☰ Views <span class="arrow ${this._dropdownOpen ? "open" : ""}">▼</span>
        </button>
        <div class="dropdown-menu ${this._dropdownOpen ? "open" : ""}">
          <button class="dropdown-item" @click=${() => { this._navigate("timeline"); this._closeDropdown(); }}><span>📅</span> Timeline</button>
          <button class="dropdown-item" @click=${() => { this._navigate("map"); this._closeDropdown(); }}><span>🗺</span> Map</button>
          <button class="dropdown-item" @click=${() => { this._navigate("tree"); this._closeDropdown(); }}><span>🌳</span> Dynasty Tree</button>
          <button class="dropdown-item" @click=${() => { this._navigate("graph"); this._closeDropdown(); }}><span>🕸</span> Graph View</button>
          <button class="dropdown-item" @click=${() => { this._navigate("options"); this._closeDropdown(); }}><span>⚙</span> Options</button>
        </div>
      </div>
    `;

    if (isDetail) {
      return html`
        <button class="back-btn" @click=${() => this._navigate("search")}>← Back</button>
        <span class="detail-title" style="display:flex;align-items:center;gap:6px">
          <span style="color:var(--text3);font-size:0.7rem">Home</span>
          <span style="color:var(--text3);font-size:0.6rem"> › </span>
          ${this.entityName || ""}
        </span>
        <div class="nav-tabs">
          <button class="nav-tab" @click=${() => this._navigate("map")} title="Map">🗺</button>
          <button class="nav-tab" @click=${() => this._navigate("timeline")} title="Timeline">📅</button>
          <button class="nav-tab" @click=${() => this._navigate("tree")} title="Dynasty Tree">🌳</button>
        </div>
        <div class="lang-toggle">${langBtns}</div>
        <div class="dropdown">
          <button class="dropdown-btn" @click=${this._toggleDropdown}>
            ☰ Views <span class="arrow ${this._dropdownOpen ? "open" : ""}">▼</span>
          </button>
          <div class="dropdown-menu ${this._dropdownOpen ? "open" : ""}">
            <button class="dropdown-item" @click=${() => { this._navigate("timeline"); this._closeDropdown(); }}><span>📅</span> Timeline</button>
            <button class="dropdown-item" @click=${() => { this._navigate("map"); this._closeDropdown(); }}><span>🗺</span> Map</button>
            <button class="dropdown-item" @click=${() => { this._navigate("tree"); this._closeDropdown(); }}><span>🌳</span> Dynasty Tree</button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="logo" @click=${() => this._navigate("search")}>
        <span class="logo-icon">${cfg.countryEmoji}</span>
        <span>MiniDi</span>
      </div>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder=${t("search")} @keydown=${this._onSearchKeydown} />
      </div>
      ${commonNav}
    `;
  }
}
customElements.define("mini-header", MiniHeader);
