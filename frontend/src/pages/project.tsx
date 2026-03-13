import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import projectService from "../services/projectservices";
import type { Project } from "../types/index";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectService.getMyProjects();
      const projectsArray = Array.isArray(data) ? data : data.data;
      setProjects(projectsArray || []);
    } catch (err) {
      setError("Failed to load projects. Please try again later.");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (loading) return <div style={styles.loading}>Loading projects...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>My Projects</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={styles.primaryBtn}
        >
          Create Project
        </button>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {showCreateForm && (
        <CreateProjectForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadProjects();
          }}
        />
      )}

      {projects.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              style={styles.card}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <h3>{project.name}</h3>
              {project.description && (
                <p style={styles.cardDesc}>{project.description}</p>
              )}

              <div style={styles.cardMeta}>
                <span>Role: {project.role}</span>
                <span>{project.memberCount} members</span>
                <span>{project.boardCount} boards</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateProjectForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await projectService.createProject({ name, description });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create New Project</h2>
        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={styles.input}
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.secondaryBtn}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.disabledBtn : styles.primaryBtn}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "20px" },
  loading: { padding: "20px", textAlign: "center" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  errorBanner: {
    color: "white",
    backgroundColor: "#dc3545",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
  },
  emptyState: { textAlign: "center", padding: "40px", color: "#666" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },

  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "box-shadow 0.2s ease-in-out",
  },
  cardHover: { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  cardDesc: { color: "#666", fontSize: "14px", marginTop: "8px" },
  cardMeta: {
    marginTop: "15px",
    fontSize: "12px",
    color: "#999",
    display: "flex",
    gap: "15px",
  },

  primaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
  },
  disabledBtn: {
    padding: "10px 20px",
    backgroundColor: "#a5c8fd",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "not-allowed",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    width: "500px",
    maxWidth: "90%",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "20px",
  },

  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: 500 },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
};
