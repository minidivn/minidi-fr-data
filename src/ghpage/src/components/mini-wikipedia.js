import { LitElement, html, css } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { getLang } from "../utils/i18n.js";
import { enrichEntityFull } from "../utils/wikidata-fetcher.js";

export class MiniWikipedia extends LitElement {
  static styles = css`
    :host { display: block; margin-top: 16px; }
    .wp-card { border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); overflow: hidden; }
    .wp-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(6,182,212,0.06); border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07)); }
    .wp-header-icon { font-size: 1.1rem; }
    .wp-header-label { font-size: 0.78rem; font-weight: 600; color: var(--a2); }
    .wp-body { padding: 16px 18px; }
    .wp-thumb { float: right; width: 140px; height: 100px; object-fit: cover; border-radius: var(--sm); margin: 0 0 8px 12px; }
    .wp-extract { font-size: 0.85rem; line-height: 1.75; color: var(--text2); }
    .wp-extract p { margin: 0 0 10px; }
    .wp-extract h2, .wp-extract h3, .wp-extract h4 { font-size: 0.95rem; font-weight: 600; color: var(--text); margin: 16px 0 8px; }
    .wp-extract h3 { font-size: 0.88rem; }
    .wp-extract a { color: var(--a1); text-decoration: underline; }
    .wp-extract img { max-width: 100%; height: auto; border-radius: var(--sm); margin: 8px 0; }
    .wp-extract ul, .wp-extract ol { margin: 4px 0 8px; padding-left: 20px; }
    .wp-extract li { margin: 2px 0; }
    .wp-extract b, .wp-extract strong { color: var(--text); font-weight: 600; }
    .wp-extract figure { margin: 12px 0; text-align: center; }
    .wp-extract figure img { max-width: 100%; height: auto; border-radius: var(--sm); }
    .wp-extract figcaption { font-size: 0.75rem; color: var(--text3); font-style: italic; margin-top: 4px; }
    .wp-readmore { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; padding: 8px 18px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: var(--md); color: var(--a1); font-size: 0.78rem; text-decoration: none; transition: 0.18s; }
    .wp-readmore:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); }
    .wp-loading { display: flex; align-items: center; gap: 8px; padding: 14px 18px; color: var(--text3); font-size: 0.8rem; }
    .wp-spinner { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--bg3); border-top-color: var(--a1); animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .wp-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 18px; }
    .wp-fact { padding: 10px 12px; background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--md); transition: 0.15s; }
    .wp-fact:hover { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.04); }
    .wp-fact-label { font-size: 0.55rem; font-weight: 600; color: var(--a2); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .wp-fact-value { font-size: 0.8rem; color: var(--text); line-height: 1.4; word-break: break-word; }
  `;

  static properties = { entityId: {}, label: {}, ready: {} };

  constructor() {
    super();
    this._enriched = null;
    this._loading = false;
    this._lang = "en";
    this.ready = false;
  }

  updated(changed) {
    if (changed.has("ready") && this.ready && this.entityId && !this._enriched) this._load();
  }

  async _load() {
    this._loading = true; this.requestUpdate();
    try { this._enriched = await enrichEntityFull(this.entityId, { l: this.label }); }
    catch (e) { console.warn("WP load:", e); }
    this._loading = false; this.requestUpdate();
  }

  _switchLang(lang) { this._lang = lang; this.requestUpdate(); }

  render() {
    const currentLang = getLang();
    if (currentLang !== this._lang) this._lang = currentLang;
    const show = this._lang === "en" ? this._enriched?.fullEn : this._enriched?.fullVi || this._enriched?.fullEn;
    const wp = this._lang === "en" ? this._enriched?.wikipediaEn : this._enriched?.wikipediaVi || this._enriched?.wikipediaEn;
    const paragraphs = show?.paragraphs;
    const fallback = wp?.extract;
    const thumb = wp?.thumbnail;
    const url = wp?.url;
    const title = wp?.title || "";
    const hasVi = !!(this._enriched?.wikipediaVi || this._enriched?.fullVi);

    if (this._loading) return html`<div class="wp-card"><div class="wp-loading"><span class="wp-spinner"></span>Loading Wikipedia...</div></div>`;
    if (!paragraphs && !fallback) return html``;

    return html`
      <div class="wp-card">
        <div class="wp-header">
          <span class="wp-header-icon">🌐</span>
          <span class="wp-header-label">Wikipedia</span>
          <span style="font-size:0.62rem;margin-left:4px;color:var(--text3)">${title}</span>
          <div style="margin-left:auto;display:flex;gap:4px">
            <button @click=${() => this._switchLang("en")} style="border:none;background:${this._lang === "en" ? "var(--a1)" : "transparent"};color:${this._lang === "en" ? "#fff" : "var(--text3)"};padding:2px 8px;border-radius:3px;cursor:pointer;font-size:0.62rem;font-family:inherit">EN</button>
            ${hasVi ? html`<button @click=${() => this._switchLang("vi")} style="border:none;background:${this._lang === "vi" ? "var(--a1)" : "transparent"};color:${this._lang === "vi" ? "#fff" : "var(--text3)"};padding:2px 8px;border-radius:3px;cursor:pointer;font-size:0.62rem;font-family:inherit">VI</button>` : ""}
          </div>
        </div>
        <div class="wp-body">
          ${thumb ? html`<img class="wp-thumb" src=${thumb} alt="" loading="lazy" />` : ""}
          ${show?.infobox ? html`<div class="wp-facts">${show.infobox.slice(0, 16).map(r => html`<div class="wp-fact"><div class="wp-fact-label">${r.label}</div><div class="wp-fact-value">${r.value}</div></div>`)}</div>` : ""}
          <div class="wp-extract">
            ${show?.rich ? unsafeHTML(show.rich) : paragraphs ? paragraphs.map(p => html`<p>${p}</p>`) : html`<p>${fallback}</p>`}
            ${url ? html`<a style="color:var(--a1);font-size:0.78rem;text-decoration:none;display:inline-block;margin-top:8px" href=${url} target="_blank">Read full article on Wikipedia →</a>` : ""}
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define("mini-wikipedia", MiniWikipedia);
