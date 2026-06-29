# Sales Analytics — Sales Dashboard (India Edition)

A full-stack sales analytics dashboard localised for the Indian market.  
Currency: **Indian Rupee (₹ INR)** · Locale: **en-IN** · Regions: North / South / East / West / Central

---

## What changed from the original

| Area | Original | India Edition |
|---|---|---|
| Currency | USD ($) | INR (₹) |
| Locale | en-US | en-IN |
| App name | Sales Analytics | Sales Analytics |
| Primary colour | Indigo #3D4FE0 | Saffron #FF6600 |
| Chart colours | Indigo palette | Tricolour-inspired (saffron, green, navy) |
| Sample products | Generic Western | Indian market mix (Tiffin Box, Kurta, etc.) |
| Sample customers | Acme Corp etc. | TCS, Infosys, Reliance, Wipro, Mahindra, HDFC |
| Seed price range | $8 – $250 | ₹500 – ₹15,000 |
| Regions | N/S/E/W | N/S/E/W + Central |

---

## Stack

- **Frontend** — React 18 + Vite, Recharts, React Router v6
- **Backend** — Python 3.11+, Flask, Flask-JWT-Extended, SQLAlchemy
- **Database** — SQLite (local) / PostgreSQL (production)

---

## Quick start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                     # starts on http://localhost:5000
python seed.py                    # (optional) creates demo data in INR
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # set VITE_API_URL=http://localhost:5000
npm run dev                       # starts on http://localhost:5173
```

Demo login: `username: demo` / `password: demo1234`

---

## Deployment

See `render.yaml` for a one-click Render deployment config (PostgreSQL + Python web service + static site).

---

## GST note

This version does not yet compute GST on transactions. To add it, extend the `Sale` model with `gst_rate` and `gst_amount` columns and update the reports aggregations accordingly.
