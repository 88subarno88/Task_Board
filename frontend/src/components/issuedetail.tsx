import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useState, useEffect } from "react";
import issueService from "../services/Issueservice";
import commentService from "../services/commentservice";
import projectService from "../services/projectservices";
import type { Issue } from "../types/issues";
import type { Comment } from "../types/comment";
import { useAuth } from "../context/AuthContext";
import styles from "./cssmodules/issuedetail.module.css";

interface IssueDetailProps {
  projectId: string;
  issueId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function IssueDetail({
  projectId,
  issueId,
  onClose,
  onUpdate,
}: IssueDetailProps) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]); // ADD THIS STATE

  useEffect(() => {
    loadMembers();
    loadIssueData();
  }, [issueId]);

  const loadMembers = async () => {
    try {
      const res = await projectService.getProject(projectId);
      const membersArray =
        res.data?.members || res.data?.data?.members || res.members || [];
      setProjectMembers(membersArray.map((m: any) => m.user || m));
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

  const loadIssueData = async () => {
    try {
      setLoading(true);

      // 1. Fetch the issue first
      const issueRes = await issueService.getIssue(issueId);
      const currentIssue = issueRes.data;
      setIssue(currentIssue);

      // 2. Fetch everything else using currentIssue directly
      // Corrected: Passing currentIssue.boardId as a string, not an object
      const [commentsRes, auditRes, boardIssuesRes] = await Promise.all([
        commentService.getComments(issueId),
        issueService.getIssueAuditLogs(issueId),
        issueService.getIssuesByBoard(currentIssue.boardId),
      ]);

      // 3. Filter stories for the parent dropdown
      setAvailableStories(
        boardIssuesRes.data.filter(
          (i: any) => i.type === "STORY" && i.id !== issueId,
        ),
      );

      // 4. Set the initial state for the Edit modal
      setEditData({
        title: currentIssue.title,
        description: currentIssue.description || "",
        priority: currentIssue.priority || "MEDIUM",
        assigneeId: currentIssue.assignee?.id || null,
        parentId: currentIssue.parentId || null,
        dueDate: currentIssue.dueDate ? currentIssue.dueDate.split("T")[0] : "",
      });

      // 5. Build and sort the activity timeline
      const combined = [
        ...commentsRes.data.map((c: any) => ({ ...c, type: "COMMENT" })),
        ...auditRes.data.map((a: any) => ({ ...a, type: "AUDIT" })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTimeline(combined);
    } catch (err) {
      console.error("Failed to load issue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineUpdate = async (field: string, value: any) => {
    try {
      // Send update to backend
      await issueService.updateIssue(issueId, {
        [field]: value === "" ? null : value,
      });

      // Refresh local data to show new Audit Log in timeline
      await loadIssueData();

      // Notify parent component to refresh the board
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update " + field);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await issueService.updateIssue(issueId, editData);
      setIsEditing(false);
      await loadIssueData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update issue");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      await commentService.addComment(issueId, newComment);
      setNewComment("");
      await loadIssueData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentService.deleteComment(commentId);
      await loadIssueData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      await issueService.deleteIssue(issueId);
      onUpdate();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete issue");
    }
  };

  if (loading) return null;
  if (!issue) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.metaTags}>
              {issue.type} • {issue.status}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                className={styles.titleInput}
              />
            ) : (
              <h2 className={styles.titleText}>{issue.title}</h2>
            )}
          </div>

          <div className={styles.headerActions}>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className={styles.btnPrimary}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.btnSecondary}
              >
                Edit Issue
              </button>
            )}
            <button onClick={onClose} className={styles.closeBtn}>
              ×
            </button>
          </div>
        </div>
        {/* Content - Scrollable */}
        {/* Content - Scrollable */}
        <div className={styles.contentScroll}>
          <div className={styles.mainGrid}>
            {/* LEFT: Description */}
            <div>
              <h3 className={styles.sectionTitle}>Description</h3>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  rows={6}
                  className={styles.textArea}
                />
              ) : (
                <p className={styles.descText}>
                  {issue.description || (
                    <span className={styles.emptyItalic}>
                      No description provided.
                    </span>
                  )}
                </p>
              )}
            </div>
            {/* RIGHT: Metadata Sidebar */}
            <div className={styles.metaSidebar}>
              {/* Assignee Selection */}
              <div>
                <div className={styles.metaLabel}>Assignee</div>
                <select
                  value={issue.assignee?.id || ""}
                  onChange={(e) =>
                    handleInlineUpdate("assigneeId", e.target.value)
                  }
                  className={styles.selectInput}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selection */}
              <div>
                <div className={styles.metaLabel}>Priority</div>
                <select
                  value={issue.priority}
                  onChange={(e) =>
                    handleInlineUpdate("priority", e.target.value)
                  }
                  className={styles.selectInput}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Hierarchy: Parent Story Selection */}
              {issue.type !== "STORY" && (
                <div>
                  <div className={styles.metaLabel}>Parent Story</div>
                  <select
                    value={issue.parentId || ""}
                    onChange={(e) =>
                      handleInlineUpdate("parentId", e.target.value)
                    }
                    className={styles.selectInput}
                  >
                    <option value="">No Parent (Independent)</option>
                    {availableStories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Due Date Operation */}
              <div>
                <div className={styles.metaLabel}>Due Date</div>
                <input
                  type="date"
                  className={styles.selectInput}
                  value={issue.dueDate ? issue.dueDate.split("T")[0] : ""}
                  onChange={(e) =>
                    handleInlineUpdate("dueDate", e.target.value)
                  }
                />
              </div>

              <div>
                <div className={styles.metaLabel}>Reporter</div>
                <div className={styles.metaValue}>
                  {issue.reporter?.name || "Unknown"}
                </div>
              </div>

              <div>
                <div className={styles.metaLabel}>Created</div>
                <div className={styles.metaValue}>
                  {new Date(issue.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>{" "}
            {/* Closes metaSidebar */}
          </div>{" "}
          {/* Closes mainGrid */}
          <hr className={styles.divider} />
          {/* Activity/Comments section */}
          <div>
            <h3 className={styles.sectionTitle}>
              Activity Timeline (
              {timeline.filter((t) => t.type === "COMMENT").length} Comments)
            </h3>

            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <div
                style={{
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-primary)",
                  marginBottom: "10px",
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Add a rich text comment..."
                />
              </div>
              <div className={styles.commentActions}>
                <button
                  type="submit"
                  disabled={
                    addingComment ||
                    newComment.replace(/<[^>]*>/g, "").trim() === ""
                  }
                  className={styles.btnPrimary}
                >
                  {addingComment ? "Adding..." : "Add Comment"}
                </button>
              </div>
            </form>

            <div className={styles.commentList}>
              {timeline.length === 0 ? (
                <div className={styles.emptyComments}>No activity yet</div>
              ) : (
                timeline.map((item) => {
                  if (item.type === "COMMENT") {
                    return (
                      <div
                        key={`comment-${item.id}`}
                        className={styles.commentBox}
                      >
                        <div className={styles.commentHeader}>
                          <div>
                            <span className={styles.commentAuthor}>
                              {item.user?.name || "Unknown"}
                            </span>
                            <span className={styles.commentDate}>
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {item.userId === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(item.id)}
                              className={styles.btnDangerText}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div
                          className={styles.commentBody}
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </div>
                    );
                  }

                  if (item.type === "AUDIT") {
                    let actionText = "";
                    if (item.action === "STATUS_CHANGED") {
                      actionText = `moved this issue from ${item.oldValue} to ${item.newValue}`;
                    } else if (item.action === "ASSIGNEE_CHANGED") {
                      const oldName =
                        projectMembers.find((m) => m.id === item.oldValue)
                          ?.name || "Unassigned";
                      const newName =
                        projectMembers.find((m) => m.id === item.newValue)
                          ?.name || "Unassigned";
                      actionText = `changed assignee from ${oldName} to ${newName}`;
                    } else if (item.action === "PRIORITY_CHANGED") {
                      actionText = `changed priority from ${item.oldValue} to ${item.newValue}`;
                    }

                    return (
                      <div
                        key={`audit-${item.id}`}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "var(--bg-main)",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {item.user?.name || "Someone"}
                        </span>
                        <span>{actionText}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.7,
                            marginLeft: "auto",
                          }}
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        </div>{" "}
        {/* Closes contentScroll */}
        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={handleDelete} className={styles.btnDangerOutline}>
            Delete Issue
          </button>
        </div>
      </div>{" "}
      {/* Closes modal */}
    </div> // Closes overlay
  );
}
