# Nyelvtan gyakorló – Mássalhangzó‑törvények (mobilbarát)

Statikus (HTML/CSS/JS) gyakorló app 5. osztályos nyelvtan témazáróhoz.

## Fő funkciók
- **Mobil‑first** UI, nagy gombok, gyors visszajelzés.
- **Ismétlődés nélkül** (egy körön belül): a kérdések véletlenszerű sorrendben jönnek.
- **Részletes magyarázat** minden feladathoz.
- Módok:
  - **Kevert**
  - **Témakör szerint**
  - **Mini témazáró (időre)**
- **Offline** működés (Service Worker cache).
- Eredmények **csak a készüléken**: `localStorage`.

## Témakörök (kérdésbank)
- Teljes hasonulás (különösen: **-val/-vel**)
- Részleges hasonulás (zöngésség szerinti hasonulás – gyakran **kiejtésben**)
- Összeolvadás (pl. t/d + j hangzás)
- Egyszerűsítés (torlódásnál)
- Hosszúság / kettőzés
- Vegyes (törvény felismerése)

## Futatás lokálisan
Egyszerűen nyisd meg az `index.html`-t.

Ajánlott (különösen iOS/Safari miatt), hogy kiszolgálóról fusson:

```bash
# 1) Python beépített szerver
python -m http.server 8080
# 2) Nyisd meg: http://localhost:8080
```

## GitHub Pages telepítés
1. Hozz létre egy új repót GitHubon.
2. Másold fel a teljes mappatartalmat (a `README.md`-vel együtt).
3. `Settings` → `Pages` → `Deploy from a branch` → `main` / `(root)`.
4. Pár perc múlva a linket megkapod.

## Szerkesztés / bővítés
A kérdésbank itt van:
- `js/questions.js`

Az app logika:
- `js/app.js`

## Megjegyzés
A szabályok csoportosítása iskolánként eltérhet. Ha a tanárotok más terminológiát használ, a kérdéseket könnyen át tudod nevezni a `questions.js`‑ben.
