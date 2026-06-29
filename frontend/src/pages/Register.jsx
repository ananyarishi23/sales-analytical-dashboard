import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/reports", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">SA</span>
          <span className="brand-name">Sales Analytics</span>
        </div>

        <h1>Create your account</h1>
        <p className="auth-subtitle">Register to start tracking sales and viewing reports.</p>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={update("full_name")}
            placeholder="Jane Doe"
            autoComplete="name"
          />

          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={update("username")}
            placeholder="jane.doe"
            autoComplete="username"
            minLength={3}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="jane@company.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="confirm_password">Confirm password</label>
          <input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
