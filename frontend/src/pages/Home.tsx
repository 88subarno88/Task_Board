import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import projectService from "../services/projectservices";
import type { Project } from "../types";
import styles from "./cssmodules/home.module.css"; // <-- Import the new styles

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getMyProjects();
      setRecentProjects(response.data.slice(0, 3));
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          Welcome back, {user?.name || "there"}!
        </h1>
        <p className={styles.subGreeting}>
          Here's what's happening with your projects
        </p>
      </div>

      {/* Error State */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div>
          <button
            onClick={() => navigate("/projects")}
            className={styles.primaryBtn}
          >
            View All Projects
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Projects</h2>

        {loading ? (
          <div className={styles.loadingState}>Loading your workspaces...</div>
        ) : recentProjects.length > 0 ? (
          <div className={styles.projectGrid}>
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={styles.projectCard}
              >
                <h3 className={styles.cardTitle}>{project.name}</h3>

                {project.description ? (
                  <p className={styles.cardDesc}>{project.description}</p>
                ) : (
                  <p
                    className={styles.cardDesc}
                    style={{ fontStyle: "italic", opacity: 0.7 }}
                  >
                    No description provided.
                  </p>
                )}

                <div className={styles.cardMeta}>
                  <span>🗂 {project.boardCount || 0} boards</span>
                  <span>👥 {project.memberCount || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No projects yet. Create one to get started!</p>
            <button
              onClick={() => navigate("/projects")}
              className={styles.primaryBtn}
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
