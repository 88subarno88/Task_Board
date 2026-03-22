import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import boardService from "../services/boardservices";
import issueService from "../services/Issueservice";
import IssueForm from "../components/Issue";
import projectService from "../services/projectservices";
import IssueDetail from "../components/issuedetail";
import { useAuth } from "../context/AuthContext";
import styles from "./cssmodules/board.module.css";

type Issue = {
  id: string;
  columnId?: string;
  title: string;
  type?: string;
  priority?: string;
  assignee?: { name: string };
};

type Column = {
  id: string;
  name: string;
  issues?: Issue[];
  wipLimit?: number | null;
};

type BoardData = {
  id: string;
  name: string;
  projectId: string;
  columns: Column[];
};

export default function BoardView() {
  const { user } = useAuth();
  const { boardId } = useParams();
  const navigate = useNavigate();
  // 2. Then, define your permission variables using that user
  const [board, setBoard] = useState<BoardData | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  // --- PERMISSIONS LOGIC ---
  const isGlobalAdmin = user?.globalRole === "GLOBAL_ADMIN";
  const myMembership = members.find((m) => m.user.id === user?.id);
  const projectRole = myMembership?.role;

  const canManageBoard = isGlobalAdmin || projectRole === "PROJECT_ADMIN";
  const canEditIssues = canManageBoard || projectRole === "PROJECT_MEMBER";
  const isReadOnly = !isGlobalAdmin && projectRole === "PROJECT_VIEWER";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [movingIssue, setMovingIssue] = useState(false);

  const [wipModal, setWipModal] = useState<{
    id: string;
    name: string;
    limit: number | null;
  } | null>(null);
  const [wipInput, setWipInput] = useState("");
  const [savingWip, setSavingWip] = useState(false);
  // const isAdmin = user?.globalRole === "GLOBAL_ADMIN";

  const loadBoard = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const response = await boardService.getBoardWithIssues(boardId);
      const boardData = response.data ? response.data : response;
      setBoard(boardData);
      if (boardData.projectId) {
        const membersRes = await projectService.getMembers(boardData.projectId);
        setMembers(membersRes.data || membersRes);
      }
    } catch (err) {
      setError("Failed to load board... check console");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "CRITICAL":
        return "#dc3545";
      case "HIGH":
        return "#fd7e14";
      case "MEDIUM":
        return "#ffc107";
      case "LOW":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "STORY":
        return "📖";
      case "TASK":
        return "✓";
      case "BUG":
        return "🐛";
      default:
        return "•";
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issue: Issue,
    columnId: string,
  ) => {
    setDraggedIssue({ ...issue, columnId });
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIssue(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: string,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const openWipModal = (
    columnId: string,
    currentLimit: number | null | undefined,
    columnName: string,
  ) => {
    setWipModal({
      id: columnId,
      name: columnName,
      limit: currentLimit ?? null,
    });
    setWipInput(currentLimit ? currentLimit.toString() : "");
  };

  const handleSaveWip = async () => {
    if (!wipModal || !canManageBoard) return;

    const newLimit = wipInput.trim() === "" ? null : parseInt(wipInput, 10);

    if (wipInput.trim() !== "" && isNaN(newLimit as number)) {
      alert("Please enter a valid number");
      return;
    }

    setSavingWip(true);
    try {
      await boardService.updateColumn(boardId!, wipModal.id, {
        name: wipModal.name,
        wipLimit: newLimit,
      });
      await loadBoard();
      setWipModal(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update WIP Limit.");
    } finally {
      setSavingWip(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    columnId: string,
  ) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedIssue) return;

    if (draggedIssue.columnId === columnId) {
      setDraggedIssue(null);
      return;
    }

    let targetColumn = board?.columns?.find((c) => c.id === columnId);

    if (
      targetColumn &&
      targetColumn.wipLimit !== null &&
      targetColumn.wipLimit !== undefined
    ) {
      const issuesInColumn = targetColumn.issues
        ? targetColumn.issues.length
        : 0;
      if (issuesInColumn >= targetColumn.wipLimit) {
        alert(
          `Cannot move: ${targetColumn.name} has reached its WIP limit of ${targetColumn.wipLimit}`,
        );
        setDraggedIssue(null);
        return;
      }
    }

    setMovingIssue(true);
    try {
      await issueService.moveIssue(draggedIssue.id, columnId);
      await loadBoard();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to move issue");
      console.error(error);
    } finally {
      setMovingIssue(false);
    }
  };

  if (loading) return <div className={styles.centerMessage}>Loading...</div>;

  if (error || !board) {
    return (
      <div className={styles.container}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Go Back
        </button>
        <div className={styles.errorText}>{error || "Board not found!"}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Go Back
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h1 className={styles.boardTitle} style={{ margin: 0 }}>
            {board.name}
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {isGlobalAdmin && (
              <span
                className={styles.roleTag}
                style={{
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  border: "1px solid #c3e6cb",
                }}
              >
                Global Admin
              </span>
            )}
            {!isGlobalAdmin && projectRole === "PROJECT_ADMIN" && (
              <span
                className={styles.roleTag}
                style={{
                  backgroundColor: "#cce5ff",
                  color: "#004085",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  border: "1px solid #b8daff",
                }}
              >
                Project Admin
              </span>
            )}
            {!isGlobalAdmin && projectRole === "PROJECT_MEMBER" && (
              <span
                className={styles.roleTag}
                style={{
                  backgroundColor: "#e2d9f3",
                  color: "#4a235a",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  border: "1px solid #c5b3e6",
                }}
              >
                Project Member
              </span>
            )}
            {isReadOnly && (
              <span
                className={styles.roleTag}
                style={{
                  backgroundColor: "#fff3cd",
                  color: "#856404",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  border: "1px solid #ffeeba",
                }}
              >
                View Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.columnsWrapper}>
        {board.columns &&
          board.columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => !isReadOnly && handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => !isReadOnly && handleDrop(e, column.id)}
              className={`${styles.column} ${dragOverColumn === column.id ? styles.columnDragOver : ""}`}
            >
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>{column.name}</span>
                <div className={styles.columnStats}>
                  <span className={styles.issueCount}>
                    {column.issues ? column.issues.length : 0}
                    {column.wipLimit != null ? ` / ${column.wipLimit}` : ""}
                  </span>
                  {canManageBoard && (
                    <button
                      onClick={() =>
                        openWipModal(column.id, column.wipLimit, column.name)
                      }
                      className={styles.editWipBtn}
                      title="Edit WIP Limit"
                    >
                      ✏️
                    </button>
                  )}
                  {canEditIssues && (
                    <button
                      onClick={() => setShowCreateIssue(column.id)}
                      className={styles.addBtn}
                      title="Add issue"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.issueList}>
                {column.issues && column.issues.length > 0 ? (
                  column.issues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable={!isReadOnly}
                      onDragStart={(e) =>
                        !isReadOnly && handleDragStart(e, issue, column.id)
                      }
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (draggedIssue === null) setSelectedIssue(issue.id);
                      }}
                      className={styles.issueCard}
                      style={{
                        borderLeftColor: getPriorityColor(issue.priority),
                        cursor: isReadOnly ? "pointer" : "grab",
                      }}
                    >
                      <div className={styles.issueType}>
                        {getTypeIcon(issue.type)} {issue.type || "TASK"}
                      </div>

                      <div className={styles.issueTitle}>{issue.title}</div>

                      <div className={styles.issueFooter}>
                        {issue.assignee ? (
                          <span className={styles.assigneeTag}>
                            {issue.assignee.name}
                          </span>
                        ) : (
                          <span className={styles.unassignedTag}>
                            Unassigned
                          </span>
                        )}
                        <span
                          className={styles.priorityTag}
                          style={{ color: getPriorityColor(issue.priority) }}
                        >
                          {issue.priority || "MEDIUM"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyColumn}>No issues here</div>
                )}
              </div>
            </div>
          ))}
      </div>

      {showCreateIssue !== null && boardId !== undefined && (
        <IssueForm
          projectId={board.projectId}
          boardId={boardId}
          columnId={showCreateIssue}
          onClose={() => setShowCreateIssue(null)}
          onSuccess={() => {
            setShowCreateIssue(null);
            loadBoard();
          }}
        />
      )}

      {selectedIssue !== null && boardId !== undefined && (
        <IssueDetail
          projectId={board.projectId}
          issueId={selectedIssue}
          isReadOnly={isReadOnly}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {
            setSelectedIssue(null);
            loadBoard();
          }}
        />
      )}

      {movingIssue && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>Moving issue...</div>
        </div>
      )}
      {wipModal && (
        <div className={styles.overlay}>
          <div className={styles.wipModalContainer}>
            <h3 className={styles.wipModalTitle}>Edit WIP Limit</h3>
            <p className={styles.wipModalDesc}>
              Set a limit for <strong>{wipModal.name}</strong>. Leave blank to
              remove.
            </p>

            <input
              type="number"
              value={wipInput}
              onChange={(e) => setWipInput(e.target.value)}
              placeholder="e.g. 5"
              className={styles.wipModalInput}
              autoFocus
            />

            <div className={styles.wipModalActions}>
              <button
                onClick={() => setWipModal(null)}
                className={styles.btnCancel}
                disabled={savingWip}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWip}
                className={styles.btnSave}
                disabled={savingWip}
              >
                {savingWip ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
