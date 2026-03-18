import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import boardService from "../services/boardservices";
import issueService from "../services/Issueservice";
import IssueForm from "../components/Issue";
import IssueDetail from "../components/issuedetail";
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
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [movingIssue, setMovingIssue] = useState(false);

  const loadBoard = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const response = await boardService.getBoardWithIssues(boardId);
      const boardData = response.data ? response.data : response;
      setBoard(boardData);
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
        <h1 className={styles.boardTitle}>{board.name}</h1>
      </div>

      <div className={styles.columnsWrapper}>
        {board.columns &&
          board.columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`${styles.column} ${dragOverColumn === column.id ? styles.columnDragOver : ""}`}
            >
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>{column.name}</span>
                <div className={styles.columnStats}>
                  <span className={styles.issueCount}>
                    {column.issues ? column.issues.length : 0}
                    {column.wipLimit != null ? ` / ${column.wipLimit}` : ""}
                  </span>
                  <button
                    onClick={() => setShowCreateIssue(column.id)}
                    className={styles.addBtn}
                    title="Add issue"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.issueList}>
                {column.issues && column.issues.length > 0 ? (
                  column.issues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue, column.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (draggedIssue === null) setSelectedIssue(issue.id);
                      }}
                      className={styles.issueCard}
                      style={{
                        borderLeftColor: getPriorityColor(issue.priority),
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
    </div>
  );
}
