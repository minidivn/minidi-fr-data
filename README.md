# minidi-fr-data

**France Knowledge Graph** — 2071 WikiData entities exported as a searchable hypergraph.

## Quick Links

| Link | Description |
|------|-------------|
| GitHub Pages | https://minidivn.github.io/minidi-fr-data/ |
| GraphQL API | https://minidi-graphql.i2cvnco.workers.dev/ |
| Crawler tool | https://github.com/minidivn/minidi-spider |
| Data source | https://github.com/minidivn/minidi-fr-data |

## Data Structure

```
docs/
  index.json           Full export: 2071 entities
  index.lite.json      Compact version (IDs + labels only)
  index.html           Bilingual (EN+FR) search frontend
  v1/entities/         Partitioned by entity type
  v1/timeline/         Partitioned by historical era
  v1/relations/        Partitioned by property category
```

## Stats

- Total entities: 2071
- Events: 58 | People: 17 | Places: 166
- Data source: WikiData SPARQL
- License: CC0 - WikiData contributors
- Updated: Weekly via GitHub Actions

## Build

```bash
# Crawl data
python scripts/run_pipeline.py --country fr --release
```
