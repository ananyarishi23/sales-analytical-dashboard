import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { salesApi } from "../api";

const CATEGORY_SUGGESTIONS = [
  "Electronics",
  "Furniture",
  "Stationery",
  "Home & Living",
  "Accessories",
  "Apparel",
  "Software",
  "Services",
];

const EMPTY_FORM = {
  product_name: "",
  category: "",
  quantity: 1,
  unit_price: "",
  customer_name: "",
  region: "",
  sale_date: new Date().toISOString().slice(0, 10),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

export default function AddSales() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [recentSales, setRecentSales] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function loadRecent() {
    setLoadingRecent(true);
    try {
      const res = await salesApi.list({ page: 1, per_page: 8 });
      setRecentSales(res.data.sales);
    } catch {
      // non-fatal: the form still works even if the recent list fails to load
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unit_price);

    if (!form.product_name.trim() || !form.category.trim()) {
      setError("product name and category are required");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("quantity must be a positive number");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError("unit price must be a valid number");
      return;
    }

    setSubmitting(true);
    try {
      await salesApi.add({
        ...form,
        quantity,
        unit_price: unitPrice,
      });
      setSuccess("Sale recorded successfully.");
      setForm(EMPTY_FORM);
      loadRecent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await salesApi.remove(id);
      setRecentSales((rows) => rows.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const computedTotal =
    Number(form.quantity) > 0 && Number(form.unit_price) >= 0
      ? Number(form.quantity) * Number(form.unit_price)
      : 0;

  return (
    <DashboardLayout title="Add Sale" subtitle="Log a new transaction to keep your reports current.">
      <div className="add-sale-grid">
        <section className="card form-card">
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          {success ? <div className="form-success" role="status">{success}</div> : null}

          <form onSubmit={handleSubmit} className="sale-form">
            <div className="form-row">
              <div className="field">
                <label htmlFor="product_name">Product name</label>
                <input
                  id="product_name"
                  type="text"
                  value={form.product_name}
                  onChange={update("product_name")}
                  placeholder="Wireless Mouse"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  list="category-suggestions"
                  value={form.category}
                  onChange={update("category")}
                  placeholder="Electronics"
                  required
                />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={update("quantity")}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="unit_price">Unit price (INR ₹)</label>
                <input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={update("unit_price")}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="customer_name">Customer (optional)</label>
                <input
                  id="customer_name"
                  type="text"
                  value={form.customer_name}
                  onChange={update("customer_name")}
                  placeholder="Tata Consultancy Services"
                />
              </div>
              <div className="field">
                <label htmlFor="region">Region (optional)</label>
                <input
                  id="region"
                  type="text"
                  value={form.region}
                  onChange={update("region")}
                  placeholder="Maharashtra"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="sale_date">Sale date</label>
                <input
                  id="sale_date"
                  type="date"
                  value={form.sale_date}
                  onChange={update("sale_date")}
                  required
                />
              </div>
              <div className="field total-preview">
                <span className="field-label-static">Total</span>
                <span className="total-amount">{formatCurrency(computedTotal)}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save sale"}
            </button>
          </form>
        </section>

        <section className="card recent-card">
          <h2>Recently added</h2>
          {loadingRecent ? (
            <p className="muted">Loading…</p>
          ) : recentSales.length === 0 ? (
            <p className="muted">No sales yet. Add your first one on the left.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th aria-label="actions"></th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span className="cell-title">{sale.product_name}</span>
                      <span className="cell-subtitle">{sale.category}</span>
                    </td>
                    <td>{sale.sale_date}</td>
                    <td className="num mono">{formatCurrency(sale.total_amount)}</td>
                    <td>
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => handleDelete(sale.id)}
                        aria-label={`Delete ${sale.product_name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
