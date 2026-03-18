import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./notificationbell";
import styles from "../components/cssmodules/layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo} onClick={() => navigate("/")}>
            Task Board
          </div>

          <div className={styles.rightNav}>
            <button
              className={styles.navBtn}
              onClick={() => navigate("/projects")}
            >
              Projects
            </button>

            <NotificationBell />

            {/* THEME TOGGLE WIDGET */}
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            <div
              className={styles.userName}
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer" }}
              title="View Profile"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "6px",
                    verticalAlign: "middle",
                  }}
                />
              ) : null}
              {user?.name}
            </div>

            <button className={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
