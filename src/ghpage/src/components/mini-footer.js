import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t } from "../utils/i18n.js";

export class MiniFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      text-align: center;
      padding: 24px;
      color: var(--text3);
      font-size: 0.76rem;
      border-top: 1px solid var(--border-color, rgba(255,255,255,0.07));
      margin-top: 32px;
    }
    a { color: var(--a1); text-decoration: none; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: var(--bg3, #1e293b);
      border-radius: var(--sm);
      margin: 2px;
    }
  `;

  static properties = { data: {} };

  render() {
    if (!this.data) return "";
    const cfg = getConfig();
    return html`
      <div>
        <span class="badge">
          📦 ${t("entities")}:
          <strong>${this.data.meta.entity_count.toLocaleString()}</strong>
        </span>
        <span class="badge">🌐 ${t("source")}: ${cfg.dataSource}</span>
      </div>
      <div style="margin-top:8px">
        ${cfg.countryEmoji} ${t("builtWith")}
        <a href="https://github.com/${cfg.githubRepo}">minidi-spider</a>
        · <a href="https://github.com/${cfg.githubRepo}">GitHub</a>
      </div>
    `;
  }
}
customElements.define("mini-footer", MiniFooter);
