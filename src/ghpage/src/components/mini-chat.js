import { LitElement, html, css } from "lit";
import { getConfig } from "../config/store.js";
import { t } from "../utils/i18n.js";

const COMMANDS = {
  help: /^(help|what can you do|commands|assist)/i,
  stats: /^(stats|statistics|how many|entity count|graph stat)/i,
  greeting: /^(hello|hi|hey|greetings|good (morning|afternoon|evening)|xin chào)/i,
  thanks: /^(thanks|thank you|cảm ơn)/i,
  who: /^(who is|who was|who's|tell me about person|ai là|người) (.+)/i,
  where: /^(where is|where's|tell me about place|địa điểm|ở đâu) (.+)/i,
  what: /^(what is|what was|what's|tell me about|giải thích|định nghĩa) (.+)/i,
  search: /^(search|find|tìm|look for|tra cứu) (.+)/i,
  timeline: /^(timeline|events in|era|thời kỳ|sự kiện năm|show timeline)/i,
  map: /^(map|show map|bản đồ|view map)/i,
  dynasty: /^(dynasty|triều đại|nhà|vua|king|emperor|hoàng đế)/i,
  random: /^(random|surprise me|ngẫu nhiên|bất kỳ)/i,
  recent: /^(recent|latest|newest|modern|gần đây|mới nhất)/i,
  count: /^(count|how many) (place|person|event|people|places|events)/i,
  popular: /^(popular|top|most known|nổi tiếng)/i,
  language: /^(language|lang|change language|ngôn ngữ|switch lang)/i,
  clear: /^(clear|reset|new chat|xóa)/i,
};

export class MiniChat extends LitElement {
  static styles = css`
    :host { position: fixed; bottom: 20px; right: 20px; z-index: 90; }
    .toggle-btn {
      width: 48px; height: 48px; border-radius: 50%; border: none;
      background: linear-gradient(135deg, var(--a1), var(--a2)); color: #fff;
      font-size: 1.3rem; cursor: pointer; box-shadow: 0 4px 20px rgba(99,102,241,0.4); transition: 0.3s;
    }
    .toggle-btn:hover { transform: scale(1.1); }
    .panel {
      width: 360px; max-height: 500px; background: var(--bg2);
      border: 1px solid var(--border-color, rgba(255,255,255,0.07));
      border-radius: var(--lg); overflow: hidden; display: none;
      flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
    .panel.open { display: flex; }
    .header { padding: 10px 14px; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07)); display: flex; justify-content: space-between; align-items: center; }
    .header strong { font-size: 0.82rem; }
    .header button { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 1.1rem; }
    .messages { flex: 1; overflow-y: auto; padding: 10px 14px; min-height: 220px; max-height: 340px; }
    .msg { font-size: 0.78rem; line-height: 1.55; margin-bottom: 8px; padding: 8px 12px; border-radius: var(--md); max-width: 85%; white-space: pre-wrap; }
    .msg.bot { background: var(--bg3); color: var(--text2); }
    .msg.user { background: rgba(99,102,241,0.15); color: var(--text); margin-left: auto; }
    .input-area { display: flex; padding: 8px 12px; gap: 6px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.07)); }
    .input-area input { flex: 1; padding: 7px 10px; background: var(--bg3); border: 1px solid var(--border-color, rgba(255,255,255,0.07)); border-radius: var(--sm); color: var(--text); font-size: 0.8rem; outline: none; }
    .input-area button { padding: 7px 14px; border: none; border-radius: var(--sm); background: var(--a1); color: #fff; cursor: pointer; font-size: 0.8rem; }
  `;

  static properties = { data: {}, bm25: {} };

  constructor() {
    super();
    this._open = false;
    this._messages = [];
    this._cfg = getConfig();
  }

  _toggle() {
    this._open = !this._open;
    if (this._open && this._messages.length === 0) {
      this._addMessage("bot", "🤖 Hello! I'm MiniDi Assistant. " + this._cfg.chatGreeting + " Type 'help' to see commands.");
    }
    this.requestUpdate();
  }

  _addMessage(role, text) {
    this._messages.push({ role, text });
    if (this._messages.length > 40) this._messages.shift();
    this.requestUpdate();
    setTimeout(() => { const el = this.shadowRoot.querySelector(".messages"); if (el) el.scrollTop = el.scrollHeight; }, 50);
  }

  _send() {
    const input = this.shadowRoot.querySelector("input");
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = "";
    this._addMessage("user", text);
    this._respond(text);
  }

  _respond(query) {
    const lower = query.toLowerCase();
    let response = null;
    const cfg = this._cfg;

    if (COMMANDS.help.test(lower)) {
      response = `I can help with ${cfg.chatCountry} knowledge! Try:\n• "who is ..." — find people\n• "where is ..." — find places\n• "tell me about ..." — explain topics\n• "search ..." — full-text search\n• "stats" — graph statistics\n• "timeline" — historical eras\n• "dynasty" — dynasty information\n• "map" — show map view\n• "random" — random entity\n• "recent" — recent events\n• "count places" — count by type\n• "language" — switch language\n• "help" — this message`;
    } else if (COMMANDS.clear.test(lower)) {
      this._messages = [];
      this._addMessage("bot", "Chat cleared. How can I help?");
      return;
    } else if (COMMANDS.greeting.test(lower)) {
      response = "Hello! 👋 How can I help you explore the knowledge graph?";
    } else if (COMMANDS.thanks.test(lower)) {
      response = "You're welcome! 😊 Feel free to ask anything else.";
    } else if (COMMANDS.stats.test(lower)) {
      const total = this.data?.meta?.entity_count?.toLocaleString() || "--";
      const edges = this.data?.meta?.edge_count?.toLocaleString() || "--";
      const types = {};
      if (this.data?.nodes) this.data.nodes.forEach(n => { const t = n.t || "other"; types[t] = (types[t] || 0) + 1; });
      response = `📊 Knowledge Graph Stats:\nTotal entities: ${total}\nRelations: ${edges}\nBreakdown: ${Object.entries(types).map(([k, v]) => `${k}: ${v}`).join(", ")}`;
    } else if (COMMANDS.random.test(lower)) {
      const nodes = this.data?.nodes;
      if (nodes) { const r = nodes[Math.floor(Math.random() * nodes.length)]; response = `🎲 Random pick: **${r.l}**${r.lv ? " (" + r.lv + ")" : ""}\nType: ${r.t || "other"}\n${r.d || ""}`; }
    } else if (COMMANDS.map.test(lower)) {
      this.dispatchEvent(new CustomEvent("navigate", { detail: "map", bubbles: true, composed: true }));
      response = "Switching to Map view 🗺️";
    } else if (COMMANDS.timeline.test(lower)) {
      this.dispatchEvent(new CustomEvent("navigate", { detail: "timeline", bubbles: true, composed: true }));
      response = "Switching to Timeline view 📅";
    } else if (COMMANDS.language.test(lower)) {
      response = "Language toggle is in the top-right corner of the header.";
    } else if (COMMANDS.dynasty.test(lower)) {
      const dynasties = this.data?.nodes?.filter(n => { const t = ((n.l || "") + " " + (n.lv || "") + " " + (n.d || "")).toLowerCase(); return t.includes("dynasty") || t.includes("triều") || t.includes("nhà"); }) || [];
      if (dynasties.length) { response = `👑 Found ${dynasties.length} dynasties:\n${dynasties.slice(0, 10).map(d => `• ${d.l}${d.lv ? " (" + d.lv + ")" : ""}`).join("\n")}`; } else { response = "No dynasties found. Try browsing the Dynasty Tree view!"; }
    } else if (COMMANDS.recent.test(lower)) {
      const recent = this.data?.nodes?.filter(n => { const y = this._getYear(n); return y !== null && y >= 1975; }).sort((a, b) => this._getYear(b) - this._getYear(a)).slice(0, 10) || [];
      if (recent.length) { response = `🕐 Recent/modern entities:\n${recent.map(r => `• ${r.l} (${this._getYear(r)})`).join("\n")}`; }
    } else {
      const match = COMMANDS.who.exec(query) || COMMANDS.where.exec(query) || COMMANDS.what.exec(query) || COMMANDS.search.exec(query);
      if (match) { response = this._searchEntities(match[2].trim()); }
      else { response = this._searchEntities(query); if (response === "No matching entities found.") { response = 'I didn\'t find exact matches. Try:\n• A person name: "who is..."\n• A place: "where is..."\n• A topic: "tell me about..."\n• Or type "help" for commands'; } }
    }

    if (response) { setTimeout(() => this._addMessage("bot", response), 300); }
  }

  _searchEntities(q) {
    if (!this.data?.nodes || !this.bm25) return "No data loaded yet.";
    const scores = this.bm25(q);
    const top = scores.slice(0, 5);
    if (!top.length) return "No matching entities found.";
    return top.map((s, i) => { const n = this.data.nodes[s.index]; const yr = this._getYear(n); return `${i + 1}. **${n.l}**${n.lv ? " (" + n.lv + ")" : ""} [${n.t || "other"}]${yr ? " — " + yr : ""}\n   ${(n.d || "").substring(0, 120)}`; }).join("\n\n");
  }

  _getYear(n) {
    if (!n?.m) return null;
    for (const f of ["point_in_time", "start_time", "birth_date", "death_date"]) { const v = n.m[f]; if (v) { const m = String(v).match(/(-?\d{4})/); if (m) return parseInt(m[1], 10); } }
    return null;
  }

  render() {
    return html`
      <div class="panel ${this._open ? "open" : ""}">
        <div class="header">
          <strong>🤖 MiniDi Assistant</strong>
          <button @click=${this._toggle}>&times;</button>
        </div>
        <div class="messages">
          ${this._messages.map(m => html`<div class="msg ${m.role}">${m.text}</div>`)}
        </div>
        <div class="input-area">
          <input type="text" placeholder=${t("chatPlaceholder")} @keydown=${e => { if (e.key === "Enter") this._send(); }} />
          <button @click=${this._send}>➡</button>
        </div>
      </div>
      <button class="toggle-btn" @click=${this._toggle}>💬</button>
    `;
  }
}
customElements.define("mini-chat", MiniChat);
