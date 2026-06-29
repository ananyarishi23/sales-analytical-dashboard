import Sidebar from "./Sidebar";

export default function DashboardLayout({ title, subtitle, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
