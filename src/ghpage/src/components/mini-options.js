import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t, setLang } from "../utils/i18n.js";
import { loadPrefs, savePrefs, applyTheme } from "../utils/preferences.js";

export class MiniOptions extends LitElement {
  static styles = css`
    :host { display: block; }
    .page { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    h2 { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 20px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 0.72rem; font-weight: 600; color: var(--a2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .option {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: var(--bg3, #1e293b);
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      border-radius: var(--md); margin-bottom: 6px;
    }
    .option-label { font-size: 0.83rem; color: var(--text); }
    .option-desc { font-size: 0.68rem; color: var(--text3); margin-top: 2px; }
    .btn-group { display: flex; gap: 2px; background: var(--bg3); border-radius: var(--sm); padding: 2px; }
    .btn-group button {
      padding: 4px 12px; border: none; border-radius: 3px;
      font-size: 0.72rem; font-family: inherit; cursor: pointer;
      background: transparent; color: var(--text3); transition: 0.15s;
    }
    .btn-group button.active { background: var(--a1); color: #fff; }
    .btn-group button:hover:not(.active) { color: var(--text); }
    .saved-msg { font-size: 0.65rem; color: var(--ok); text-align: center; padding: 2px; opacity: 0; transition: opacity 0.3s; }
    .saved-msg.show { opacity: 1; }
  `;

  constructor() {
    super();
    const cfg = getConfig();
    this._cfg = cfg;
    this._prefs = loadPrefs();
    this._saved = false;
  }

  _update(key, value) {
    this._prefs[key] = value;
    savePrefs(this._prefs);
    if (key === "lang") {
      setLang(value);
      this.dispatchEvent(new CustomEvent("lang-changed", { bubbles: true, composed: true }));
    }
    if (key === "theme") applyTheme(value);
    this._saved = true;
    this.requestUpdate();
    setTimeout(() => { this._saved = false; this.requestUpdate(); }, 2000);
  }

  render() {
    const p = this._prefs;
    const cfg = this._cfg;
    const langBtns = cfg.languages.map(l => html`
      <button class="${p.lang === l ? "active" : ""}" @click=${() => this._update("lang", l)}>${l.toUpperCase()}</button>
    `);

    return html`
      <div class="page">
        <h2>⚙️ ${t("settings") || "Settings"}</h2>
        ${this._saved ? html`<div class="saved-msg show">✓ Preferences saved</div>` : ""}

        <div class="section">
          <div class="section-title">Language</div>
          <div class="option">
            <div>
              <div class="option-label">Site Language</div>
              <div class="option-desc">UI labels + Wikipedia content</div>
            </div>
            <div class="btn-group">${langBtns}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Theme</div>
          <div class="option">
            <div>
              <div class="option-label">Color Theme</div>
              <div class="option-desc">Appearance mode</div>
            </div>
            <div class="btn-group">
              <button class="${p.theme === "dark" ? "active" : ""}" @click=${() => this._update("theme", "dark")}>Dark</button>
              <button class="${p.theme === "light" ? "active" : ""}" @click=${() => this._update("theme", "light")}>Light</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">AI Model</div>
          <div class="option">
            <div>
              <div class="option-label">Assistant Model</div>
              <div class="option-desc">Chat response engine</div>
            </div>
            <div class="btn-group">
              <button class="${p.aiModel === "mini" ? "active" : ""}" @click=${() => this._update("aiModel", "mini")}>MiniDi (BM25)</button>
              <button disabled style="opacity:0.3" class="${p.aiModel === "gpt" ? "active" : ""}">GPT</button>
              <button disabled style="opacity:0.3" class="${p.aiModel === "claude" ? "active" : ""}">Claude</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Data</div>
          <div class="option">
            <div>
              <div class="option-label">Knowledge Graph</div>
              <div class="option-desc">${t("entitiesTotal", { n: "—" })}</div>
            </div>
            <div style="font-size:0.72rem;color:var(--text3)">v1.0</div>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define("mini-options", MiniOptions);
