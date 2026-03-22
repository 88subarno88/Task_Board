import RichTextEditor from "../components/RichTextEditot";
import React, { useState, useEffect } from "react";
import issueStyles from "../components/cssmodules/issue.module.css";
import { useParams, useNavigate } from "react-router-dom";
import projectService from "../services/projectservices";
import boardService from "../services/boardservices";
import styles from "./cssmodules/projectdetail.module.css";
import IssueDetail from "../components/issuedetail";
import issueService from "../services/Issueservice";
import { useAuth } from "../context/AuthContext";

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
  user: { id: string; name: string; email: string; globalRole?: string };
};

type CreateBoardFormProps = {
  projectId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const isGlobalAdmin = user?.globalRole === "GLOBAL_ADMIN";
  const myMembership = members.find((m) => m.user.id === user?.id);
  const projectRole = myMembership?.role;

  const canManageProject = isGlobalAdmin || projectRole === "PROJECT_ADMIN";
  const canModifyContent = canManageProject || projectRole === "PROJECT_MEMBER";
  const isReadOnly = !isGlobalAdmin && projectRole === "PROJECT_VIEWER";

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
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await projectService.updateMemberRole(projectId!, userId, newRole);
      loadProjectAndBoards();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await projectService.removeMember(projectId!, userId);
      loadProjectAndBoards();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove member");
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
            {canManageProject && (
              <button
                onClick={() => setShowCreateBoard(true)}
                className={styles.primaryBtn}
              >
                + Create Board
              </button>
            )}
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
            {canModifyContent && (
              <button
                onClick={() => setShowCreateStory(true)}
                className={styles.primaryBtn}
              >
                + Create Story
              </button>
            )}
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
                  onClick={() => setSelectedStoryId(story.id)}
                >
                  <h3 className={styles.cardTitle}>{story.title}</h3>
                  <p className={styles.cardMeta}>Status: {story.status}</p>
                  <p className={styles.cardMeta}>Priority: {story.priority}</p>
                  {story.assignee && (
                    <p className={styles.cardMeta}>
                      Assignee: {story.assignee.name}
                    </p>
                  )}
                  {story.dueDate && (
                    <p className={styles.cardMeta}>
                      Due: {new Date(story.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className={styles.cardMeta}>
                    Created: {new Date(story.createdAt).toLocaleDateString()}
                  </p>
                  <span className={styles.roleTag}>
                    {(story.children?.length || 0) > 0 && (
                      <span className={styles.roleTag}>
                        {story.children.length} tasks
                      </span>
                    )}
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
          {canManageProject && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className={styles.primaryBtn}
            >
              {showAddMember ? "Close" : "+ Add Member"}
            </button>
          )}
        </div>

        {showAddMember && canManageProject && (
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
                  const userRes =
                    await projectService.searchUserByEmail(newMemberEmail);
                  const userId = userRes.data.id;
                  await projectService.addMember(
                    projectId!,
                    userId,
                    newMemberRole,
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
            {members.map((member) => {
              const memberIsGlobalAdmin =
                member.user.globalRole === "GLOBAL_ADMIN";
              // Project admins cannot edit/remove global admins
              const canEditThisMember =
                canManageProject &&
                member.user.id !== user?.id &&
                !(memberIsGlobalAdmin && !isGlobalAdmin);

              return (
                <div key={member.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{member.user.name}</h3>
                  <p className={styles.cardMeta}>{member.user.email}</p>

                  {canEditThisMember ? (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.user.id, e.target.value)
                        }
                        className={styles.select}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          width: "auto",
                        }}
                      >
                        <option value="PROJECT_ADMIN">Admin</option>
                        <option value="PROJECT_MEMBER">Member</option>
                        <option value="PROJECT_VIEWER">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        style={{
                          color: "#dc3545",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {memberIsGlobalAdmin && (
                        <span
                          className={styles.roleTag}
                          style={{
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            border: "1px solid #c3e6cb",
                          }}
                        >
                          Global Admin
                        </span>
                      )}
                      <span className={styles.roleTag}>
                        {member.role.replace("PROJECT_", "")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateStory && (
        <CreateStoryForm
          boards={boards}
          members={members}
          onClose={() => setShowCreateStory(false)}
          onSuccess={() => {
            setShowCreateStory(false);
            loadProjectAndBoards();
          }}
        />
      )}

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
      {selectedStoryId && projectId && (
        <IssueDetail
          projectId={projectId}
          issueId={selectedStoryId}
          isReadOnly={isReadOnly}
          onClose={() => setSelectedStoryId(null)}
          onUpdate={() => {
            setSelectedStoryId(null);
            loadProjectAndBoards();
          }}
        />
      )}
    </div>
  );
}

function CreateStoryForm({
  boards,
  members,
  onClose,
  onSuccess,
}: {
  boards: BoardSummary[];
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardId)
      return alert("You must select a target Board to store this story.");
    const selectedBoard = boards.find((b) => b.id === selectedBoardId);
    const fallbackColumnId = selectedBoard?.columns?.[0]?.id;
    if (!fallbackColumnId) {
      return alert(
        "The selected board must have at least one column before you can create a story!",
      );
    }
    setLoading(true);
    try {
      await issueService.createIssue({
        title,
        description,
        type: "STORY",
        priority,
        boardId: selectedBoardId,
        columnId: fallbackColumnId,
        status: "To Do",
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      } as any);
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error creating Story!";
      alert(`Backend rejected it: ${errorMessage}`);
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "500px" }}
      >
        <h2 className={styles.modalTitle}>Create Story</h2>
        {boards.length === 0 ? (
          <p style={{ color: "red" }}>
            You must create a Board first before creating Stories!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                }}
              >
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter story title"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.select}
                  style={{ width: "100%" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  Target Board *
                </label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className={styles.select}
                  style={{ width: "100%" }}
                  required
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={issueStyles.formGroup}>
              <label className={issueStyles.label}>Assignee</label>
              <select
                className={issueStyles.input}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={issueStyles.formGroup}>
              <label className={issueStyles.label}>Due Date</label>
              <input
                type="date"
                className={issueStyles.input}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            {/* <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.input}
                style={{ minHeight: "100px", resize: "vertical" }}
                placeholder="Add a detailed description..."
              />
            </div> */}
            <div
              className={styles.btnGroup}
              style={{ justifyContent: "flex-end", marginTop: "10px" }}
            >
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={styles.primaryBtn}
              >
                {loading ? "Creating..." : "Create Story"}
              </button>
            </div>

            <div className={issueStyles.formGroup}>
              <label className={issueStyles.label}>Description</label>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "4px" }}>
                <RichTextEditor
                  placeholder="Add a detailed description..."
                  onChange={(html: string) => setDescription(html)}
                />
              </div>
            </div>
          </form>
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
