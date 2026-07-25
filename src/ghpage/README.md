# @minidi/minidi-data-ghpage

Generic MiniDi knowledge graph frontend, built with Lit + Vite.

Drop it into any MiniDi-compatible data repository with a simple config file.

## Usage

```js
// src/main.js
import { createMiniDiApp } from "@minidi/minidi-data-ghpage";
import config from "./config.js";
createMiniDiApp(config);
```

```html
<!-- index.html -->
<script type="module" src="/src/main.js"></script>
<mini-app></mini-app>
```

## Configuration

Create a `src/config.js` that exports a config object:

| Field | Type | Description |
|-------|------|-------------|
| `countryCode` | `string` | ISO 3166-1 alpha-2 |
| `countryName` | `string` | Display name |
| `countryEmoji` | `string` | Flag emoji |
| `languages` | `string[]` | Available UI languages |
| `defaultLanguage` | `string` | Default (must be in `languages`) |
| `title` | `string` | Hero title |
| `subtitle` | `string` | Hero subtitle (`{n}` = entity count) |
| `splashTitle` | `string` | Loading screen title |
| `splashMessage` | `string` | Loading screen message |
| `slides` | `object[]` | Slideshow items (label, img) |
| `mapCenter` | `[number, number]` | [lat, lng] |
| `mapZoom` | `number` | Initial zoom |
| `eras` | `object[]` | Timeline eras (id, emoji, label, years, color) |
| `githubRepo` | `string` | `owner/repo` |
| `dataSource` | `string` | Attribution label |
| `dataPath` | `string` | Path to index.json |
| `chatCountry` | `string` | Country name for chat |
| `chatGreeting` | `string` | Chat greeting text |
| `translations` | `object` | `{ lang: { key: value } }` |

## Examples

### Vietnam (2 languages: EN, VI)
```js
config = {
  countryCode: "vn",
  languages: ["en", "vi"],
  defaultLanguage: "en",
  mapCenter: [16, 107.5],
  eras: [
    { id: "hong_bang", label: { en: "Hồng Bàng Dynasty", vi: "Thời kỳ Hồng Bàng" }, years: [-2879, -258], color: "#8b5cf6" },
    // ...
  ],
  // ...
}
```

### United Kingdom (1 language: EN)
```js
config = {
  countryCode: "gb",
  languages: ["en"],
  defaultLanguage: "en",
  mapCenter: [55.3, -3.4],
  eras: [
    { id: "roman", label: { en: "Roman Britain" }, years: [-43, 410], color: "#ef4444" },
    // ...
  ],
  // ...
}
```

### United States (2 languages: EN, ES)
```js
config = {
  countryCode: "us",
  languages: ["en", "es"],
  defaultLanguage: "en",
  // ...
  translations: {
    en: { /* ... */ },
    es: { /* ... */ },
  },
}
```

## Development

```bash
pnpm dev        # Dev server on :5174
pnpm build      # Not needed — library is consumed as source
pnpm test       # Run tests
```
