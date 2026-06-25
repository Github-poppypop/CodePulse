import { Routes, Route, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
}

interface Run {
  id: string;
  repositoryId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  trigger: string;
  commitSha: string | null;
  branch: string | null;
}

interface Finding {
  id: string;
  repositoryId: string;
  runId: string | null;
  category: string;
  severity: string;
  title: string;
  description: string;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  source: string;
  createdAt: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<"repos" | "runs" | "findings" | "settings">("repos");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/repos");
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (e) {
      console.error("Failed to fetch repos:", e);
    }
    setLoading(false);
  };

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (e) {
      console.error("Failed to fetch runs:", e);
    }
    setLoading(false);
  };

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/findings");
      if (res.ok) {
        const data = await res.json();
        setFindings(data);
      }
    } catch (e) {
      console.error("Failed to fetch findings:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepos();
    fetchRuns();
    fetchFindings();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "var(--error)";
      case "HIGH": return "var(--error)";
      case "MEDIUM": return "var(--warning)";
      case "LOW": return "var(--accent)";
      case "INFO": return "var(--fg-muted)";
      default: return "var(--fg-muted)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "var(--success)";
      case "RUNNING": return "var(--accent)";
      case "FAILED": return "var(--error)";
      case "CANCELLED": return "var(--fg-muted)";
      case "PENDING": return "var(--warning)";
      default: return "var(--fg-muted)";
    }
  };

  const renderRepos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Repositories</h2>
        <button className="btn-primary" onClick={() => window.location.href = "/api/repos/connect"}>
          Connect Repository
        </button>
      </div>
      {loading ? (
        <div className="loading">Loading repositories...</div>
      ) : repos.length === 0 ? (
        <div className="empty-state">
          <p>No repositories connected yet.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/api/repos/connect"}>
            Connect Your First Repository
          </button>
        </div>
      ) : (
        <div className="repo-grid">
          {repos.map((repo) => (
            <div key={repo.id} className="repo-card">
              <div className="repo-header">
                <h3>{repo.owner}/{repo.name}</h3>
                <span className="repo-branch">{repo.branch}</span>
              </div>
              <p className="repo-url">{repo.url}</p>
              <div className="repo-meta">
                <span>Updated: {new Date(repo.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="repo-actions">
                <button className="btn-secondary" onClick={() => fetchRuns()}>View Runs</button>
                <button className="btn-danger">Disconnect</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRuns = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Runs</h2>
      </div>
      {loading ? (
        <div className="loading">Loading runs...</div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <p>No runs yet. Trigger a run from a repository.</p>
        </div>
      ) : (
        <table className="runs-table">
          <thead>
            <tr>
              <th>Repository</th>
              <th>Status</th>
              <th>Trigger</th>
              <th>Branch</th>
              <th>Commit</th>
              <th>Started</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.repositoryId.slice(0, 8)}</td>
                <td>
                  <span className="status-badge" style={{ background: getStatusColor(run.status) }}>
                    {run.status}
                  </span>
                </td>
                <td>{run.trigger}</td>
                <td>{run.branch || "-"}</td>
                <td>{run.commitSha?.slice(0, 7) || "-"}</td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
                <td>{run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderFindings = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Findings</h2>
      </div>
      {loading ? (
        <div className="loading">Loading findings...</div>
      ) : findings.length === 0 ? (
        <div className="empty-state">
          <p>No findings yet. Run CodePulse on a repository to find issues.</p>
        </div>
      ) : (
        <div className="findings-list">
          {findings.map((finding) => (
            <div key={finding.id} className="finding-card">
              <div className="finding-header">
                <span className="finding-category">{finding.category}</span>
                <span className="finding-severity" style={{ background: getSeverityColor(finding.severity) }}>
                  {finding.severity}
                </span>
              </div>
              <h4>{finding.title}</h4>
              <p>{finding.description}</p>
              {finding.filePath && (
                <p className="finding-location">
                  {finding.filePath}:{finding.lineStart || ""}-{finding.lineEnd || ""}
                </p>
              )}
              <span className="finding-source">Source: {finding.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-section">
        <h3>LLM Providers</h3>
        <div className="provider-grid">
          {["openrouter", "anthropic", "openai", "local"].map((provider) => (
            <div key={provider} className="provider-card">
              <h4>{provider.charAt(0).toUpperCase() + provider.slice(1)}</h4>
              <p>Configure API keys in environment variables</p>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-section">
        <h3>Autonomy Policies</h3>
        <p>Configure autonomy levels and rules for automated fixes.</p>
      </div>
      <div className="settings-section">
        <h3>MCP Servers</h3>
        <p>Connected: filesystem, github</p>
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>CodePulse</h1>
        <nav className="main-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab("repos")}
          >
            Repositories
          </NavLink>
          <NavLink
            to="/runs"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab("runs")}
          >
            Runs
          </NavLink>
          <NavLink
            to="/findings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab("findings")}
          >
            Findings
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === "repos" && renderRepos()}
        {activeTab === "runs" && renderRuns()}
        {activeTab === "findings" && renderFindings()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}

export default App;