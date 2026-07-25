import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t } from "../utils/i18n.js";
import { themeColors } from "../utils/theme-colors.js";

export class MiniMap extends LitElement {
  static styles = css`
    :host { display: block; padding: 8px 0; }
    #map { width: 100%; height: 450px; border-radius: var(--md); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); z-index: 1; position: relative; overflow: hidden; }
    .legend { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; font-size: 0.75rem; color: var(--text2); margin: 0 0 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; vertical-align: middle; }
    @media (max-width: 768px) { #map { height: 300px; } }
  `;

  static properties = { data: {} };
  _map = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._map) { this._map.remove(); this._map = null; }
  }

  firstUpdated() { this._initMap(); }

  _initMap() {
    if (!this.data || typeof L === "undefined") return;
    const el = this.shadowRoot.getElementById("map");
    if (!el || this._map) return;

    if (!this.shadowRoot.querySelector("#leaflet-tile-style")) {
      const style = document.createElement("style");
      style.id = "leaflet-tile-style";
      style.textContent = `
        .leaflet-container { height: 100%; width: 100%; }
        .leaflet-tile { visibility: hidden; position: absolute; }
        .leaflet-tile-loaded { visibility: inherit; }
        .leaflet-tile-pane { z-index: 2; }
        .leaflet-overlay-pane { z-index: 4; }
        .leaflet-shadow-pane { z-index: 5; }
        .leaflet-marker-pane { z-index: 6; }
        .leaflet-tooltip-pane { z-index: 7; }
        .leaflet-popup-pane { z-index: 8; }
        .leaflet-control { position: relative; z-index: 800; }
        .leaflet-top, .leaflet-bottom { position: absolute; z-index: 1000; }
        .leaflet-top { top: 0; } .leaflet-bottom { bottom: 0; }
        .leaflet-left { left: 0; } .leaflet-right { right: 0; }
        .leaflet-control-zoom { display: inline-block; }
        .leaflet-control-zoom a { display: block; width: 30px; height: 30px; text-align: center; text-decoration: none; color: #000; background: #fff; border-bottom: 1px solid #ccc; line-height: 30px; font-size: 18px; }
        .leaflet-popup-content-wrapper { padding: 1px; text-align: left; border-radius: 8px; background: white; color: #333; box-shadow: 0 3px 14px rgba(0,0,0,0.4); }
        .leaflet-popup-content { margin: 8px 12px; line-height: 1.4; font-size: 13px; font-family: -apple-system, sans-serif; }
        .leaflet-popup-tip { width: 0; height: 0; background: white; box-shadow: 0 3px 14px rgba(0,0,0,0.4); }
        .leaflet-popup-close-button { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; text-align: center; font: 16px/18px sans-serif; color: #c3c3c3; text-decoration: none; border: none; background: transparent; cursor: pointer; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.7); margin: 0; padding: 0 5px; color: #333; font-size: 10px; clear: both; }
      `;
      this.shadowRoot.appendChild(style);
    }

    const cfg = getConfig();
    this._map = L.map(el, { zoomControl: true }).setView(cfg.mapCenter, cfg.mapZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a>",
    }).addTo(this._map);

    const coords = this.data.nodes.filter((n) => n.m && (n.m.coordinates || n.m.coord));
    const tcolors = themeColors(this);
    const typeColors = {
      place: { color: tcolors.place, fillColor: tcolors.place + "59" },
      person: { color: tcolors.person, fillColor: tcolors.person + "59" },
      event: { color: tcolors.event, fillColor: tcolors.event + "59" },
    };

    coords.forEach((n) => {
      const raw = n.m.coordinates || n.m.coord;
      if (!raw) return;
      const match = raw.match(/(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/);
      if (!match) return;
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isNaN(lat) || isNaN(lng)) return;
      const colors = typeColors[n.t] || { color: "#64748b", fillColor: "rgba(100,116,139,0.35)" };
      const marker = L.circleMarker([lat, lng], { radius: 6, color: colors.color, fillColor: colors.fillColor, fillOpacity: 0.8, weight: 2 });
      marker.bindPopup("<b>" + n.l + "</b>" + (n.lv ? "<br>" + n.lv : "") + "<br><span style='color:" + colors.color + "'>" + (n.t || "other") + "</span>");
      marker.addTo(this._map);
    });
  }

  render() {
    return html`
      <div class="legend">
        <span><span class="dot" style="background:var(--ok)"></span> ${t("mapPlaces")}</span>
        <span><span class="dot" style="background:var(--a1)"></span> ${t("mapPeople")}</span>
        <span><span class="dot" style="background:var(--warn)"></span> ${t("mapEvents")}</span>
      </div>
      <div id="map"></div>
    `;
  }
}
customElements.define("mini-map", MiniMap);
