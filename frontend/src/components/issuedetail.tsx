import { useState, useEffect } from "react";
import issueService from "../services/Issueservice";
import commentService from "../services/commentservice";
import type { Issue } from "../types/issues";
import type { Comment } from "../types/comment";
import { useAuth } from "../context/AuthContext";

interface IssueDetailProps {
  issueId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function IssueDetail({
  issueId,
  onClose,
  onUpdate,
}: IssueDetailProps) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    loadIssue();
    loadComments();
  }, [issueId]);

  const loadIssue = async () => {
    try {
      const response = await issueService.getIssue(issueId);
      setIssue(response.data);
    } catch (err) {
      console.error("Failed to load issue:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentService.getComments(issueId);
      setComments(response.data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      await commentService.addComment(issueId, newComment);
      setNewComment("");
      loadComments();
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
      loadComments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }

    try {
      await issueService.deleteIssue(issueId);
      onUpdate();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete issue");
    }
  };

  if (loading) {
    return (
      <div
        style={{
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
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  return (
    <div
      style={{
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
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "800px",
          maxWidth: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #eee" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
              >
                {issue.type} • {issue.priority}
              </div>
              <h2 style={{ margin: 0, fontSize: "20px" }}>{issue.title}</h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                padding: "0 10px",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              Description
            </h3>
            <p style={{ color: "#666", whiteSpace: "pre-wrap", margin: 0 }}>
              {issue.description || "No description"}
            </p>
          </div>

          {/* Meta info */}
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "5px",
                  }}
                >
                  Status
                </div>
                <div style={{ fontSize: "14px" }}>{issue.status}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "5px",
                  }}
                >
                  Reporter
                </div>
                <div style={{ fontSize: "14px" }}>
                  {issue.reporter?.name || "Unknown"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "5px",
                  }}
                >
                  Assignee
                </div>
                <div style={{ fontSize: "14px" }}>
                  {issue.assignee?.name || "Unassigned"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "5px",
                  }}
                >
                  Created
                </div>
                <div style={{ fontSize: "14px" }}>
                  {new Date(issue.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "15px",
              }}
            >
              Comments ({comments.length})
            </h3>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} style={{ marginBottom: "20px" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      addingComment || !newComment.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "14px",
                  }}
                >
                  {addingComment ? "Adding..." : "Add Comment"}
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {comments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  No comments yet
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>
                          {comment.user?.name || "Unknown"}
                        </span>
                        <span
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            marginLeft: "10px",
                          }}
                        >
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {comment.userId === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc3545",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #eee", padding: "20px" }}>
          <button
            onClick={handleDelete}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Delete Issue
          </button>
        </div>
      </div>
    </div>
  );
}
