-- ============================================================
-- Sales Analytics Dashboard - reference SQL schema (PostgreSQL)
-- ============================================================
-- NOTE: You do NOT need to run this file by hand for normal use.
-- The Flask app calls db.create_all() on startup and creates these
-- same tables automatically (works for both SQLite and Postgres).
--
-- This file is provided so you can:
--   1. See exactly what the schema looks like in plain SQL
--   2. Run it manually against a fresh Postgres database if you prefer
--      to manage your schema by hand / with a migration tool
--   3. Use it as a reference if you extend the project
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(80)  NOT NULL UNIQUE,
    email           VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS sales (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_name    VARCHAR(150) NOT NULL,
    category        VARCHAR(80)  NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      DOUBLE PRECISION NOT NULL,
    total_amount    DOUBLE PRECISION NOT NULL,
    customer_name   VARCHAR(150),
    region          VARCHAR(100),
    sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales (user_id);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales (category);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales (sale_date);

-- ============================================================
-- Example queries used to power the Reports page
-- ============================================================

-- Total revenue, orders, units, average order value for one user
-- SELECT
--     COALESCE(SUM(total_amount), 0)            AS total_revenue,
--     COUNT(*)                                  AS total_orders,
--     COALESCE(SUM(quantity), 0)                AS total_units,
--     COALESCE(SUM(total_amount) / COUNT(*), 0) AS avg_order_value
-- FROM sales
-- WHERE user_id = :user_id;

-- Revenue grouped by category
-- SELECT category, SUM(total_amount) AS revenue, COUNT(*) AS orders
-- FROM sales
-- WHERE user_id = :user_id
-- GROUP BY category
-- ORDER BY revenue DESC;

-- Top 5 products by revenue
-- SELECT product_name, SUM(total_amount) AS revenue, SUM(quantity) AS units
-- FROM sales
-- WHERE user_id = :user_id
-- GROUP BY product_name
-- ORDER BY revenue DESC
-- LIMIT 5;
