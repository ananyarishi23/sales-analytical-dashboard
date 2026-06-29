import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { reportsApi } from "../api";

const CHART_PRIMARY = "#FF6600";   // saffron-orange for Indian brand feel
const CATEGORY_COLORS = ["#FF6600", "#138808", "#000080", "#E8A33D", "#5B6178", "#8C6FE0"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="chart-tooltip-value">
          {p.name}: {typeof p.value === "number" ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, trendRes, categoryRes, topRes] = await Promise.all([
          reportsApi.summary(),
          reportsApi.trend(6),
          reportsApi.byCategory(),
          reportsApi.topProducts(5),
        ]);

        if (!isMounted) return;

        setSummary(summaryRes.data);
        setTrend(trendRes.data.trend.map((row) => ({ ...row, label: monthLabel(row.month) })));
        setCategories(categoryRes.data.categories);
        setTopProducts(topRes.data.top_products);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAnySales = summary && summary.total_orders > 0;

  return (
    <DashboardLayout title="Reports" subtitle="A snapshot of how sales are trending.">
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="muted">Loading your reports…</p>
      ) : !hasAnySales ? (
        <div className="card empty-state">
          <h2>No sales recorded yet</h2>
          <p className="muted">Add your first sale to start seeing reports here.</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} tone="primary" />
            <StatCard label="Total Orders" value={summary.total_orders} tone="amber" />
            <StatCard label="Avg Order Value" value={formatCurrency(summary.avg_order_value)} tone="success" />
            <StatCard label="Units Sold" value={summary.total_units} tone="muted" />
          </div>

          <div className="chart-grid">
            <section className="card chart-card">
              <h2>Revenue trend (last 6 months)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E6F0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="#5B6178" fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} stroke="#5B6178" fontSize={12} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CHART_PRIMARY}
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="card chart-card">
              <h2>Revenue by category</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categories} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E6F0" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} stroke="#5B6178" fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} stroke="#5B6178" fontSize={12} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                    {categories.map((entry, idx) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <section className="card">
            <h2>Top products</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Units Sold</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product_name}>
                    <td>{p.product_name}</td>
                    <td className="num mono">{p.units}</td>
                    <td className="num mono">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
