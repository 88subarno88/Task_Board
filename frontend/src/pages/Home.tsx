import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Task Board</h1>

        <div style={styles.userSection}>
          <span style={styles.greeting}>Welcome, {user?.name}!</span>
          <button onClick={logoutUser} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.card}>
          <h2>Ready to get to work?</h2>
          <p style={styles.subtitle}>
            Manage your tasks, boards, and team members all in one place.
          </p>

          <button
            onClick={() => navigate("/projects")}
            style={styles.primaryBtn}
          >
            View My Projects
          </button>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "20px",
  },
  userSection: { display: "flex", alignItems: "center", gap: "20px" },
  greeting: { fontWeight: 500, color: "#333" },

  logoutBtn: {
    padding: "8px 16px",
    border: "1px solid #dc3545",
    backgroundColor: "transparent",
    color: "#dc3545",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  mainContent: { marginTop: "50px", display: "flex", justifyContent: "center" },

  card: {
    textAlign: "center",
    padding: "40px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  subtitle: { color: "#666", marginBottom: "30px", marginTop: "10px" },

  primaryBtn: {
    padding: "15px 30px",
    fontSize: "16px",
    fontWeight: "bold",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 2px 4px rgba(0, 123, 255, 0.2)",
  },
};
