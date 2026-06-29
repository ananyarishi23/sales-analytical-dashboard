# Sales Analytics Dashboard

A full-stack sales tracking and reporting app.

- **Register / Login** — JWT-based authentication, each user only sees their own sales
- **Add Sale** — log a transaction (product, category, quantity, price, customer, region, date)
- **Reports** — revenue KPIs, a 6-month revenue trend chart, revenue-by-category chart, and a top-products table

**Backend:** Python (Flask) + SQL (PostgreSQL in production, SQLite for local dev)
**Frontend:** React (Vite)

```
sales-analytics-dashboard/
├── backend/                 Flask REST API
│   ├── app.py                application factory / entry point
│   ├── config.py             env-driven configuration
│   ├── extensions.py         shared db / bcrypt / jwt instances
│   ├── models.py             SQLAlchemy models (User, Sale)
│   ├── routes/
│   │   ├── auth.py           register, login, /me
│   │   ├── sales.py          add / list / update / delete sales
│   │   └── reports.py        summary, by-category, trend, top-products
│   ├── schema.sql            reference SQL schema (Postgres DDL)
│   ├── seed.py                optional demo-data script
│   ├── requirements.txt
│   ├── render.yaml            (see root render.yaml — same Blueprint)
│   └── .env.example
├── frontend/                 React (Vite) app
│   ├── src/
│   │   ├── pages/             Login, Register, AddSales, Reports
│   │   ├── components/        Sidebar, DashboardLayout, StatCard, ProtectedRoute
│   │   ├── context/           AuthContext (JWT session handling)
│   │   ├── api.js             axios client + endpoint helpers
│   │   └── styles/index.css
│   ├── vercel.json            SPA rewrite rule
│   └── .env.example
└── render.yaml                Render Blueprint (deploys backend + Postgres together)
```

---

## 1. Run it locally first

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # defaults already work for local dev
python app.py
```

The API now runs at `http://localhost:5000` and uses a local SQLite file
(`sales_dashboard.db`) — no database setup needed. Tables are created
automatically on first run.

Optional: populate some demo data (`demo` / `demo1234`):

```bash
python seed.py
```

Quick smoke test:

```bash
curl http://localhost:5000/api/health
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env            # points at http://localhost:5000 by default
npm run dev
```

Open `http://localhost:5173`, register an account (or log in as `demo` /
`demo1234` if you ran `seed.py`), and try the Add Sale and Reports pages.

---

## 2. Push the project to GitHub

```bash
cd sales-analytics-dashboard
git init
git add .
git commit -m "Initial commit: sales analytics dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first, then run the commands above. `.env`
files are already excluded via `.gitignore` so secrets never get committed.)

---

## 3. Deploy the backend to Render

**Option A — One-click Blueprint (recommended)**

1. Push this repo to GitHub (step 2).
2. In the [Render Dashboard](https://dashboard.render.com), click **New > Blueprint**.
3. Connect your GitHub repo. Render reads the `render.yaml` file at the repo
   root and shows you a plan: one **Postgres database** + one **web service**.
4. Click **Deploy Blueprint**. Render will:
   - provision a free Postgres database
   - install backend dependencies (`pip install -r requirements.txt`)
   - start the API with `gunicorn app:app`
   - auto-generate `SECRET_KEY` / `JWT_SECRET_KEY` and wire up `DATABASE_URL`
5. When it's done, your API is live at something like
   `https://sales-dashboard-api.onrender.com`. Test it:
   ```bash
   curl https://sales-dashboard-api.onrender.com/api/health
   ```

**Option B — Manual setup** (if you'd rather not use Blueprints)

1. Create a **Postgres** database on Render (free tier is fine) and copy its
   **Internal Database URL**.
2. Create a **Web Service**, point it at your repo, and set:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
3. Add environment variables: `DATABASE_URL` (from step 1), `SECRET_KEY`,
   `JWT_SECRET_KEY` (any long random strings), and `CORS_ORIGINS` (set to
   `*` for now — tighten it in step 5 below).

> **Free tier notes:** a free Render web service spins down after periods of
> inactivity (the first request after idling takes a few extra seconds), and
> a free Postgres database expires after 30 days unless upgraded.

---

## 4. Deploy the frontend to Vercel

1. In the [Vercel Dashboard](https://vercel.com/new), import the same GitHub repo.
2. Set the project's **Root Directory** to `frontend`. Vercel auto-detects
   Vite (`npm run build`, output directory `dist`) — no other build settings
   needed.
3. Add an environment variable:
   - `VITE_API_URL` = your Render API URL from step 3 (e.g.
     `https://sales-dashboard-api.onrender.com`)
4. Click **Deploy**. The `vercel.json` file already included takes care of
   SPA routing, so refreshing `/reports` or `/add-sale` won't 404.

Your app is now live at `https://<your-project>.vercel.app`.

---

## 5. Connect the two (CORS)

Once you know your real Vercel URL, go back to the Render service's
environment variables and set:

```
CORS_ORIGINS=https://<your-project>.vercel.app
```

(Comma-separate multiple origins if you also want to allow
`http://localhost:5173` for local testing.) Render redeploys automatically
when you save environment variable changes.

---

## API reference

All `/api/sales/*` and `/api/reports/*` routes require an
`Authorization: Bearer <token>` header from `/api/auth/login` or
`/api/auth/register`.

| Method | Endpoint                     | Description                          |
|--------|-------------------------------|---------------------------------------|
| POST   | `/api/auth/register`          | Create a new user, returns a token    |
| POST   | `/api/auth/login`              | Log in, returns a token               |
| GET    | `/api/auth/me`                 | Current user info                     |
| POST   | `/api/sales`                    | Add a sale                            |
| GET    | `/api/sales`                    | List sales (filters: `category`, `start_date`, `end_date`, pagination) |
| PUT    | `/api/sales/<id>`               | Update a sale                         |
| DELETE | `/api/sales/<id>`               | Delete a sale                         |
| GET    | `/api/reports/summary`          | Total revenue, orders, units, AOV     |
| GET    | `/api/reports/by-category`      | Revenue grouped by category           |
| GET    | `/api/reports/trend?months=6`   | Monthly revenue trend                 |
| GET    | `/api/reports/top-products`     | Best-selling products by revenue      |

## Notes on the database

`schema.sql` documents the same tables (`users`, `sales`) that SQLAlchemy
creates automatically — you don't need to run it by hand. It's there for
reference, or if you'd rather manage the schema yourself / with a migration
tool down the line.

## Extending this project

- Swap `db.create_all()` for **Flask-Migrate** once you need real schema
  migrations instead of create-on-startup.
- Add roles (e.g. "manager" sees everyone's sales, "rep" sees only their own).
- Add CSV export on the Reports page.
- Add refresh tokens if you want shorter-lived access tokens.
