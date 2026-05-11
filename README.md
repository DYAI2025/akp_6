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

Das Repository enthält eine `railway.toml` für Nixpacks. Railway/Nixpacks installiert die Abhängigkeiten automatisch mit `npm ci` und führt in der Build-Phase nur `npm run build` aus. Die Node-Runtime ist auf Node 20.x und npm 11.x gepinnt, damit Railway nicht automatisch auf eine neuere Node-Major-Version (z. B. Node 24) wechselt. Anschließend startet Railway den statischen Produktionsserver mit `npm start`.

Der Server liest den von Railway gesetzten `PORT`, bindet an `0.0.0.0` und stellt `/healthz` als Healthcheck bereit.
