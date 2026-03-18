import { useState } from "react";
import styles from "./cssmodules/login.module.css";
import { login } from "../services/authservice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (res.success) {
        localStorage.setItem("accessToken", res.data.accessToken);
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.brandPanel}>
        <h2 className={styles.brandTitle}>
          Plan work,
          <br />
          <em>track progress,</em>
          <br />
          ship together.
        </h2>
        <p className={styles.brandDescription}>
          A Kanban-style project management tool built for teams — boards,
          issues, workflows and collaboration in one place.
        </p>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <p className={styles.greeting}>Welcome back</p>
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.subHeading}>
            Enter your credentials to continue.
          </p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={styles.input}
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#8b949e",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Must be at least 10 characters with 1 uppercase, 1 lowercase,
                and 1 number.
              </span>
            </div>

            <div className={styles.row}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="/forgot-password" className={styles.forgot}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className={styles.footer}>
            No account yet? <a href="/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}
