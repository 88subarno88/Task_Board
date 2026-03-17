import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import boardService from "../services/boardservices";
import issueService from "../services/Issueservice";
import IssueForm from "../components/Issue";
import IssueDetail from "../components/issuedetail";

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

    let targetColumn = undefined;
    if (board && board.columns) {
      targetColumn = board.columns.find((c) => c.id === columnId);
    }

    if (targetColumn) {
      if (
        targetColumn.wipLimit !== null &&
        targetColumn.wipLimit !== undefined
      ) {
        let issuesInColumn = 0;
        if (targetColumn.issues) {
          issuesInColumn = targetColumn.issues.length;
        }
        if (issuesInColumn >= targetColumn.wipLimit) {
          alert(
            `Cannot move: ${targetColumn.name} has reached its WIP limit of ${targetColumn.wipLimit}`,
          );
          setDraggedIssue(null);
          return;
        }
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

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer", marginBottom: "20px" }}
        >
          ← Go Back
        </button>
        <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>
      </div>
    );
  }

  if (!board) {
    return <div style={{ padding: "20px" }}>Board not found!</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer", marginBottom: "10px" }}
        >
          Go Back
        </button>
        <h1 style={{ margin: 0 }}>{board.name}</h1>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div
        style={{
          display: "flex",
          gap: "15px",
          overflowX: "scroll",
          paddingBottom: "20px",
          alignItems: "flex-start",
        }}
      >
        {board.columns &&
          board.columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              style={{
                width: "280px",
                minWidth: "280px",
                background:
                  dragOverColumn === column.id ? "#e3f2fd" : "#ebecf0",
                borderRadius: "5px",
                padding: "10px",
                transition: "background-color 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <b style={{ textTransform: "uppercase", fontSize: "13px" }}>
                  {column.name}
                </b>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span>{column.issues ? column.issues.length : 0}</span>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "bold",
                    }}
                  >
                    {column.issues ? column.issues.length : 0}
                    {column.wipLimit !== null && column.wipLimit !== undefined
                      ? ` / ${column.wipLimit}`
                      : ""}
                  </span>
                  <button
                    onClick={() => setShowCreateIssue(column.id)}
                    style={{
                      padding: "2px 8px",
                      fontSize: "16px",
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    title="Add issue"
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ minHeight: "100px" }}>
                {column.issues && column.issues.length > 0 ? (
                  column.issues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue, column.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        if (draggedIssue === null) {
                          setSelectedIssue(issue.id);
                        }
                      }}
                      style={{
                        background: "white",
                        padding: "12px",
                        marginBottom: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        borderLeft: `4px solid ${getPriorityColor(issue.priority)}`,
                        boxShadow: "0 1px 0 rgba(9,30,66,.25)",
                        userSelect: "none",
                        cursor: "pointer",
                      }}
                    >
        
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "5px",
                        }}
                      >
                        {getTypeIcon(issue.type)} {issue.type || "TASK"}
                      </div>

                   
                      <div
                        style={{
                          fontWeight: "500",
                          marginBottom: "8px",
                          fontSize: "14px",
                        }}
                      >
                        {issue.title}
                      </div>

               
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {issue.assignee ? (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              backgroundColor: "#f0f0f0",
                              padding: "2px 6px",
                              borderRadius: "3px",
                            }}
                          >
                            {issue.assignee.name}
                          </div>
                        ) : (
                          <div style={{ fontSize: "11px", color: "#999" }}>
                            Unassigned
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "11px",
                            color: getPriorityColor(issue.priority),
                            fontWeight: "600",
                          }}
                        >
                          {issue.priority || "MEDIUM"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      color: "#5e6c84",
                      fontSize: "12px",
                      textAlign: "center",
                      padding: "10px",
                    }}
                  >
                    No issues here
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
      {showCreateIssue !== null && boardId !== undefined && (
        <IssueForm
          boardId={boardId}
          columnId={showCreateIssue}
          onClose={() => setShowCreateIssue(null)}
          onSuccess={() => {
            setShowCreateIssue(null);
            loadBoard();
          }}
        />
      )}
      {selectedIssue !== null && (
        <IssueDetail
          issueId={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {
            setSelectedIssue(null);
            loadBoard();
          }}
        />
      )}
      {movingIssue === true && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            Moving issue...
          </div>
        </div>
      )}
    </div>
  );
}
