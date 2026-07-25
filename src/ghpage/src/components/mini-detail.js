import { LitElement, html, css } from "lit";
import { t } from "../utils/i18n.js";
import { enrichEntity } from "../utils/wikidata-fetcher.js";
import "./mini-wikipedia.js";

function getImageUrl(node) {
  if (!node) return null;
  if (node.m) {
    for (const key of ["image", "commons_image", "flag_image", "seal_image", "coat_of_arms_image"]) {
      const val = node.m[key];
      if (val && typeof val === "string") {
        const filename = val.replace(/^File:/, "").replace(/\s/g, "_");
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=600`;
      }
    }
    for (const [key, val] of Object.entries(node.m)) {
      if (typeof val === "string" && (key.includes("image") || key.includes("photo") || key.includes("flag") || key.includes("seal") || key.includes("coat")) && val.length < 200) {
        const filename = val.replace(/^File:/, "").replace(/\s/g, "_");
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=600`;
      }
    }
  }
  return null;
}

function hasCoords(node) { return !!(node?.m && (node.m.coordinates || node.m.coord)); }

function parseCoords(node) {
  const raw = node.m?.coordinates || node.m?.coord;
  if (!raw) return null;
  const m = String(raw).match(/(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/);
  if (!m) return null;
  const lat = parseFloat(m[1]); const lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export class MiniDetail extends LitElement {
  static styles = css`
    :host { display: block; }
    .page { max-width: 1100px; margin: 0 auto; padding: 20px 0 40px; }
    .hero-area { display: flex; gap: 24px; margin-bottom: 24px; align-items: flex-start; }
    .hero-image { width: 260px; min-height: 180px; border-radius: var(--md); background: var(--bg3, #1e293b); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .hero-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero-image .placeholder { color: var(--text3); font-size: 2.5rem; opacity: 0.3; text-align: center; padding: 40px 10px; }
    .hero-text { flex: 1; min-width: 0; }
    .type-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 500; margin-bottom: 6px; }
    .badge-place { background: rgba(34,197,94,0.15); color: var(--ok); }
    .badge-person { background: rgba(99,102,241,0.15); color: var(--a1); }
    .badge-event { background: rgba(234,179,8,0.15); color: var(--warn); }
    .badge-other { background: var(--bg3); color: var(--text3); }
    .title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 2px; }
    .title-vi { font-size: 0.9rem; color: var(--text3); margin: 0 0 6px; }
    .desc { font-size: 0.82rem; color: var(--text2); line-height: 1.6; margin: 0 0 10px; }
    .enrich-note { font-size: 0.65rem; color: var(--a2); margin: 2px 0; display: flex; align-items: center; gap: 4px; }
    .enrich-loading { font-size: 0.65rem; color: var(--text3); margin: 2px 0; display: flex; align-items: center; gap: 4px; }
    .wp-extract { font-size: 0.78rem; line-height: 1.55; color: var(--text2); border-left: 2px solid var(--border-color, rgba(255,255,255,0.07)); padding-left: 12px; margin: 6px 0; }
    .tabs { display: flex; gap: 2px; background: var(--bg3); border-radius: var(--sm); padding: 2px; margin-bottom: 16px; overflow-x: auto; }
    .tab { padding: 6px 14px; border: none; border-radius: 4px; background: transparent; color: var(--text3); cursor: pointer; font-size: 0.78rem; transition: 0.25s; white-space: nowrap; }
    .tab:hover { color: var(--text2); }
    .tab.active { background: var(--a1); color: #fff; }
    .tab-content { min-height: 120px; }
    .relation-list { display: flex; flex-direction: column; gap: 2px; }
    .relation-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: var(--sm); cursor: pointer; transition: 0.12s; }
    .relation-item:hover { background: var(--border-color, rgba(255,255,255,0.07)); }
    .rel-arrow { color: var(--text3); font-size: 0.7rem; }
    .rel-type { font-size: 0.62rem; color: var(--a2); background: rgba(6,182,212,0.08); padding: 1px 6px; border-radius: 4px; }
    .rel-target { color: var(--a1); font-size: 0.82rem; font-weight: 500; }
    .rel-target-vi { font-size: 0.68rem; color: var(--text3); }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; }
    .meta-item { padding: 8px 12px; background: var(--bg3, #1e293b); border-radius: var(--sm); }
    .meta-label { font-size: 0.55rem; font-weight: 600; color: var(--a2); text-transform: uppercase; letter-spacing: 0.8px; }
    .meta-value { font-size: 0.8rem; color: var(--text); word-break: break-word; }
    .map-container { height: 280px; border-radius: var(--md); overflow: hidden; border: 1px solid var(--border-color, rgba(255,255,255,0.07)); }
    .wiki-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 18px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: var(--md); color: var(--a1); font-size: 0.78rem; text-decoration: none; transition: 0.18s; }
    .wiki-link:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); }
    .empty-state { text-align: center; color: var(--text3); padding: 40px; font-size: 0.85rem; }
    @media (max-width: 768px) {
      .hero-area { flex-direction: column; }
      .hero-image { width: 100%; min-height: 140px; }
      .title { font-size: 1.15rem; }
      .desc { font-size: 0.78rem; }
      .meta-grid { grid-template-columns: 1fr; }
      .tabs { gap: 1px; }
      .tab { padding: 5px 10px; font-size: 0.72rem; }
      .map-container { height: 200px; }
    }
  `;

  static properties = { node: {}, edges: {} };

  constructor() {
    super();
    this._activeTab = "overview";
    this._enriched = null;
    this._loading = false;
    this._detailMap = null;
  }

  updated(changed) {
    if (changed.has("node")) {
      this._enriched = null;
      this._loading = true;
      if (this.node) this._doEnrich(this.node);
    }
    if (changed.has("node") && this.node && this._activeTab === "map") {
      requestAnimationFrame(() => this._initDetailMap());
    }
  }

  async _doEnrich(node) {
    this._loading = true;
    try { const enriched = await enrichEntity(node.id, node); this._enriched = enriched; }
    catch (err) { console.warn("Enrichment error:", err); this._enriched = null; }
    this._loading = false;
    this.requestUpdate();
  }

  _switchTab(tab) {
    this._activeTab = tab;
    this.requestUpdate();
    if (tab === "map") requestAnimationFrame(() => this._initDetailMap());
  }

  _navigateTo(id) {
    this.dispatchEvent(new CustomEvent("navigate-detail", { detail: id, bubbles: true, composed: true }));
  }

  _initDetailMap() {
    if (typeof L === "undefined") return;
    const el = this.shadowRoot.getElementById("detail-map");
    if (!el || this._detailMap) return;
    const coords = parseCoords(this.node);
    if (!coords) return;
    if (!this.shadowRoot.querySelector("#leaflet-tile-style")) {
      const s = document.createElement("style"); s.id = "leaflet-tile-style";
      s.textContent = `.leaflet-container{height:100%;width:100%}.leaflet-tile{visibility:hidden;position:absolute}.leaflet-tile-loaded{visibility:inherit}.leaflet-tile-pane{z-index:2}.leaflet-popup-pane{z-index:8}.leaflet-control{position:relative;z-index:800}.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000}.leaflet-top{top:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}.leaflet-right{right:0}.leaflet-control-zoom{display:inline-block}.leaflet-control-zoom a{display:block;width:30px;height:30px;text-align:center;text-decoration:none;color:#000;background:#fff;border-bottom:1px solid #ccc;line-height:30px;font-size:18px}.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:8px;background:#fff;color:#333}.leaflet-popup-content{margin:8px 12px;line-height:1.4;font-size:13px;font-family:-apple-system,sans-serif}.leaflet-popup-close-button{position:absolute;top:4px;right:4px;width:18px;height:18px;text-align:center;font:16px/18px sans-serif;color:#c3c3c3;text-decoration:none;border:none;background:transparent;cursor:pointer}.leaflet-attribution-flag{display:none!important}`;
      this.shadowRoot.appendChild(s);
    }
    this._detailMap = L.map(el, { zoomControl: true }).setView([coords.lat, coords.lng], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(this._detailMap);
    L.circleMarker([coords.lat, coords.lng], { radius: 8, color: "#6366f1", fillColor: "rgba(99,102,241,0.4)", fillOpacity: 0.8, weight: 2 }).addTo(this._detailMap).bindPopup(`<b>${this.node.l}</b>`);
  }

  render() {
    if (!this.node) return html`<div class="empty-state">${t("noResults")}</div>`;
    const n = this.node;
    const enriched = this._enriched;
    const wikidataImage = enriched?.wikidata?.image;
    const wpThumb = enriched?.wikipediaEn?.thumbnail || enriched?.wikipediaVi?.thumbnail || enriched?.wikipediaEn?.originalImage;
    const imageUrl = wikidataImage || getImageUrl(n) || wpThumb;
    const isEnriching = this._loading;
    const relations = this.edges ? this.edges.filter((e) => e.s === n.id).slice(0, 80) : [];
    const metaFields = [];
    if (n.id) metaFields.push({ label: "WikiData ID", value: n.id });
    if (n.m) {
      const skipKeys = new Set(["image", "commons_image", "flag_image", "seal_image", "coordinates", "coord"]);
      for (const [key, val] of Object.entries(n.m)) {
        if (skipKeys.has(key)) continue;
        if (typeof val === "string" && val.length < 120) metaFields.push({ label: key.replace(/_/g, " "), value: val });
      }
    }
    const tabs = [
      { id: "overview", label: t("details") || "Overview", icon: "ℹ️" },
      { id: "properties", label: "Properties", icon: "📋" },
      { id: "relations", label: `${t("relations") || "Relations"} (${relations.length})`, icon: "🔗" },
    ];
    if (hasCoords(n)) tabs.push({ id: "map", label: "Map", icon: "🗺" });

    return html`
      <div class="page">
        <div class="hero-area">
          <div class="hero-image">
            ${imageUrl ? html`<img src=${imageUrl} alt="" loading="lazy" />` : html`<div class="placeholder">📷</div>`}
          </div>
          <div class="hero-text">
            <div><span class="type-badge badge-${n.t || "other"}">${n.t || "other"}</span></div>
            <h1 class="title">${n.l}</h1>
            ${n.lv ? html`<div class="title-vi">${n.lv}</div>` : ""}
            <p class="desc">${n.dv || n.d || ""}</p>
            ${isEnriching ? html`<div class="enrich-loading"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg3);border-top-color:var(--a1);animation:spin 0.7s linear infinite"></span> Loading Wikipedia...</div>` : ""}
            ${enriched?.wikipediaEn?.extract && !isEnriching ? html`<div class="wp-extract">${enriched.wikipediaEn.extract.substring(0, 300)}…</div>` : ""}
            <a class="wiki-link" href=${n.u || "#"} target="_blank">🔗 ${t("wiki") || "Open in WikiData"}</a>
          </div>
        </div>

        <div class="tabs">${tabs.map(tab => html`<button class="tab ${this._activeTab === tab.id ? "active" : ""}" @click=${() => this._switchTab(tab.id)}>${tab.icon} ${tab.label}</button>`)}</div>

        <div class="tab-content">
          ${this._activeTab === "overview" ? html`
            <div>
              ${n.d ? html`<p style="color:var(--text2);font-size:0.85rem;line-height:1.7">${n.d}</p>` : ""}
              <mini-wikipedia .entityId=${n.id} .label=${n.l} .ready=${!isEnriching}></mini-wikipedia>
            </div>
          ` : ""}

          ${this._activeTab === "properties" ? html`
            <div class="meta-grid">
              ${metaFields.map(f => html`<div class="meta-item"><div class="meta-label">${f.label}</div><div class="meta-value">${f.value}</div></div>`)}
              ${metaFields.length === 0 ? html`<div style="color:var(--text3);font-size:0.82rem">No properties available.</div>` : ""}
            </div>
          ` : ""}

          ${this._activeTab === "relations" ? html`
            <div class="relation-list">
              ${relations.length === 0 ? html`<div style="color:var(--text3);font-size:0.82rem">No outgoing relations.</div>` : relations.map(e => {
                const target = this.edges ? null : null;
                const tgt = (this.edges ? null : null) || { id: e.t };
                return html`
                  <div class="relation-item" @click=${() => this._navigateTo(e.t)}>
                    <span class="rel-arrow">→</span>
                    <span class="rel-type">${e.r || "related"}</span>
                    <span class="rel-target">${e.t}</span>
                  </div>
                `;
              })}
            </div>
          ` : ""}

          ${this._activeTab === "map" && hasCoords(n) ? html`<div id="detail-map" class="map-container"></div>` : ""}
        </div>
      </div>
    `;
  }
}
customElements.define("mini-detail", MiniDetail);
