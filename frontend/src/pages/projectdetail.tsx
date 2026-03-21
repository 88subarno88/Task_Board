import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectService from "../services/projectservices";
import boardService from "../services/boardservices";
import styles from "./cssmodules/projectdetail.module.css";

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

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
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
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("PROJECT_MEMBER");
  const [activeTab, setActiveTab] = useState<"boards" | "stories">("boards");

  const loadProjectAndBoards = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const projectResponse = await projectService.getProject(projectId);
      setProject(projectResponse.data);

      const boardsResponse = await boardService.getBoardsByProject(projectId);
      setBoards(boardsResponse.data);

      const storiesData = await boardService.getStoriesByProject(projectId);
      setStories(storiesData);

      const membersResponse = await projectService.getMembers(projectId);
      setMembers(membersResponse.data);
    } catch (err) {
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndBoards();
  }, [projectId]);

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!project)
    return <div className={styles.container}>Project not found</div>;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate("/projects")} className={styles.backBtn}>
        ← Back to Projects
      </button>

      <div className={styles.headerTop}>
        <div>
          <h1 className={styles.projectTitle}>{project.name}</h1>
          <p className={styles.projectDesc}>
            {project.description || "No description provided."}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "20px",
          borderBottom: "2px solid #eee",
        }}
      >
        <button
          onClick={() => setActiveTab("boards")}
          style={{
            padding: "10px 24px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: activeTab === "boards" ? "600" : "normal",
            borderBottom: activeTab === "boards" ? "2px solid blue" : "none",
            color: activeTab === "boards" ? "blue" : "#666",
          }}
        >
          Boards
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          style={{
            padding: "10px 24px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: activeTab === "stories" ? "600" : "normal",
            borderBottom: activeTab === "stories" ? "2px solid blue" : "none",
            color: activeTab === "stories" ? "blue" : "#666",
          }}
        >
          Stories
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "boards" && (
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Boards</h2>
            <button
              onClick={() => setShowCreateBoard(true)}
              className={styles.primaryBtn}
            >
              + Create Board
            </button>
          </div>
          {boards.length === 0 ? (
            <p className={styles.emptyState}>No boards yet. Create one!</p>
          ) : (
            <div className={styles.grid}>
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className={`${styles.card} ${styles.cardClickable}`}
                >
                  <h3 className={styles.cardTitle}>{board.name}</h3>
                  <p className={styles.cardMeta}>
                    {board.columns ? board.columns.length : 0} columns
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "stories" && (
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Stories</h2>
          </div>
          {stories.length === 0 ? (
            <p className={styles.emptyState}>
              No stories yet. Create a story in a board!
            </p>
          ) : (
            <div className={styles.grid}>
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`${styles.card} ${styles.cardClickable}`}
                  onClick={() => navigate(`/boards/${story.boardId}`)}
                >
                  <h3 className={styles.cardTitle}>{story.title}</h3>
                  <p className={styles.cardMeta}>Status: {story.status}</p>
                  <p className={styles.cardMeta}>Priority: {story.priority}</p>
                  {story.assignee && (
                    <p className={styles.cardMeta}>
                      Assignee: {story.assignee.name}
                    </p>
                  )}
                  <span className={styles.roleTag}>
                    {story.children?.length || 0} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Members</h2>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className={styles.primaryBtn}
          >
            {showAddMember ? "Close" : "+ Add Member"}
          </button>
        </div>

        {showAddMember && (
          <div className={styles.addMemberBox}>
            <input
              type="text"
              placeholder="Enter User Email or ID"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className={styles.input}
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className={styles.select}
            >
              <option value="PROJECT_MEMBER">Member</option>
              <option value="PROJECT_ADMIN">Admin</option>
              <option value="PROJECT_VIEWER">Viewer</option>
            </select>
            <button
              onClick={async () => {
                if (!newMemberEmail.trim()) return;
                try {
                  const userRes = await projectService.searchUserByEmail(
                    newMemberEmail
                  );
                  const userId = userRes.data.id;
                  await projectService.addMember(
                    projectId!,
                    userId,
                    newMemberRole
                  );
                  setNewMemberEmail("");
                  setShowAddMember(false);
                  loadProjectAndBoards();
                } catch {
                  alert("Failed to add member. Check the User ID/Email.");
                }
              }}
              className={styles.primaryBtn}
            >
              Add User
            </button>
          </div>
        )}

        {members.length === 0 ? (
          <p className={styles.emptyState}>No members yet.</p>
        ) : (
          <div className={styles.grid}>
            {members.map((member) => (
              <div key={member.id} className={styles.card}>
                <h3 className={styles.cardTitle}>{member.user.name}</h3>
                <p className={styles.cardMeta}>{member.user.email}</p>
                <span className={styles.roleTag}>
                  {member.role.replace("PROJECT_", "")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
      .then(() => {
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create Board</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Board Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              style={{ width: "100%", boxSizing: "border-box" }}
              autoFocus
            />
          </div>

          <div className={styles.btnGroup}>
            <button
              type="submit"
              disabled={loading}
              className={styles.primaryBtn}
            >
              {loading ? "Creating..." : "Create Board"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
