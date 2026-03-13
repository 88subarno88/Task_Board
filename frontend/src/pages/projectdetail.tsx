import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectService from "../services/projectservices";
import boardService from "../services/boardservices";

type ProjectData = {
  id: string;
  name: string;
  description?: string;
};

type BoardSummary = {
  id: string;
  name: string;
  columns?: { id: string }[];
};

type CreateBoardFormProps = {
  projectId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const loadProjectAndBoards = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      const projectResponse = await projectService.getProject(projectId);
      setProject(projectResponse.data);

      const boardsResponse = await boardService.getBoardsByProject(projectId);
      setBoards(boardsResponse.data);

      console.log("boards loaded:", boardsResponse.data);
    } catch (err) {
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndBoards();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!project) {
    return <div style={{ padding: "20px" }}>Project not found</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/projects")} style={styles.backButton}>
          Back
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1>{project.name}</h1>
            <p style={{ color: "gray" }}>{project.description}</p>
          </div>
          <button
            onClick={() => setShowCreateBoard(true)}
            style={styles.primaryButton}
          >
            Create Board
          </button>
        </div>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {showCreateBoard && (
        <CreateBoardForm
          projectId={projectId}
          onClose={() => setShowCreateBoard(false)}
          onSuccess={() => {
            setShowCreateBoard(false);
            loadProjectAndBoards();
          }}
        />
      )}

      <div>
        <h2>Boards</h2>
        {boards.length === 0 ? (
          <p>No boards yet. Create one!</p>
        ) : (
          <div style={styles.grid}>
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                style={styles.card}
              >
                <h3>{board.name}</h3>
                <p>{board.columns ? board.columns.length : 0} columns</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateBoardForm({
  projectId,
  onClose,
  onSuccess,
}: CreateBoardFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    boardService
      .createBoard({ name: name, projectId: projectId || "" })
      .then((_res) => {
        onSuccess();
        setLoading(false);
      })
      .catch((err) => {
        alert("Error creating board!");
        console.log(err);
        setLoading(false);
      });
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create Board</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Board Name</label>
            <br />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: "8px", width: "90%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={styles.primaryButton}
            >
              Submit
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px", fontFamily: "sans-serif" },
  header: { marginBottom: "20px" },
  backButton: { padding: "5px 10px", marginBottom: "10px", cursor: "pointer" },
  primaryButton: {
    padding: "10px 15px",
    backgroundColor: "blue",
    color: "white",
    cursor: "pointer",
  },
  grid: { display: "flex", flexWrap: "wrap", gap: "15px" },
  card: {
    border: "1px solid black",
    padding: "15px",
    width: "200px",
    cursor: "pointer",
    borderRadius: "5px",
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
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "5px",
    width: "300px",
  },
} as const;
