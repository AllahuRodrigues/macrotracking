# MacroTrack

Personal macro, body composition, and photo tracking app.

## Features

- **Meals** — CRUD food entries with calories, protein, fat, carbs by meal type
- **Body / InBody** — Weight, body fat %, muscle mass, skeletal muscle, BMI, visceral fat, InBody score, BMR
- **Photos** — Upload meal, body, and progress photos
- **Stats** — Charts for daily macros, weight, and body composition trends
- **Dashboard** — Today's macro rings, breakdown, and latest body reading

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored locally in SQLite (`data/macro-tracking.db`). Photos are saved to `public/uploads/`.

## May 28 Breakfast (pre-seeded)

Your breakfast is already logged for **2026-05-28**:

| Item | kcal | P | F | C |
|------|------|---|---|---|
| 3 large eggs | 210 | 18g | 15g | 1g |
| 1 tbsp olive oil | 120 | 0g | 14g | 0g |
| 2 egg whites | 34 | 7g | 0g | 0g |
| 50% more protein milk (5 tbsp) | 40 | 4g | 1.5g | 2g |
| Oikos Triple Zero | 95 | 15g | 0g | 5g |
| **Total** | **499** | **44g** | **30.5g** | **8g** |

## Tech Stack

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3)
- Recharts
