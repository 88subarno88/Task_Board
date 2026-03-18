import { useState } from "react";
import { register } from "../services/authservice";
import { useNavigate, Link } from "react-router-dom";
import styles from "./cssmodules/login.module.css"; 

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Custom Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

 
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, and one number.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await register({ name, email, password });
      if (res.success) {
        // redirect to login after successful registration
        navigate("/login");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.brandPanel}>
        <h2 className={styles.brandTitle}>
          Start planning,
          <br />
          <em>stay organized,</em>
          <br />
          build together.
        </h2>
        <p className={styles.brandDescription}>
          Join Task Board today. A Kanban-style project management tool built
          for teams — boards, issues, workflows, and collaboration in one place.
        </p>
      </div>

  
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <p className={styles.greeting}>Start your journey</p>
          <h1 className={styles.heading}>Create Account</h1>
          <p className={styles.subHeading}>
            Sign up to get started with Task Board.
          </p>

          {error && <div className={styles.errorBox}>{error}</div>}

        
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                className={styles.input}
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                  color: "var(--text-secondary)",
                  marginTop: "6px",
                  display: "block",
                }}
              >
                Must be at least 10 characters with 1 uppercase, 1 lowercase,
                and 1 number.
              </span>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                className={styles.input}
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
