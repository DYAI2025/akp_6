# akp_6

React/Vite-Präsentationsseite für AKP Architekten Kauschke + Partner.

## Lokale Entwicklung

```bash
npm ci
npm run dev
```

## Qualitätssicherung

```bash
npm run typecheck
npm test
npm run build
```

## Railway Deployment

Das Repository enthält eine `railway.toml` für Nixpacks. Railway baut die App mit `npm ci && npm run build` und startet anschließend den statischen Produktionsserver mit `npm start`.

Der Server liest den von Railway gesetzten `PORT`, bindet an `0.0.0.0` und stellt `/healthz` als Healthcheck bereit.
