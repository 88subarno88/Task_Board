import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import boardService from "../services/boardservices";

type Issue = {
  id: string;
  title: string;
  type?: string;
  assignee?: { name: string };
};

type Column = {
  id: string;
  name: string;
  issues?: Issue[];
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

  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) return;

      try {
        setLoading(true);
        const response = await boardService.getBoardWithIssues(boardId);
        const boardData = response.data ? response.data : response;
        console.log("got board data!", boardData);
        setBoard(boardData);
      } catch (err) {
        setError("Failed to load board... check console");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [boardId]);

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
              style={{
                width: "280px",
                minWidth: "280px",
                background: "#ebecf0",
                borderRadius: "5px",
                padding: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <b style={{ textTransform: "uppercase", fontSize: "13px" }}>
                  {column.name}
                </b>
                <span>{column.issues ? column.issues.length : 0}</span>
              </div>

              <div style={{ minHeight: "100px" }}>
                {column.issues && column.issues.length > 0 ? (
                  column.issues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => console.log("clicked issue", issue.id)}
                      style={{
                        background: "white",
                        padding: "10px",
                        marginBottom: "8px",
                        borderRadius: "3px",
                        boxShadow: "0 1px 0 rgba(9,30,66,.25)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "blue",
                          fontWeight: "bold",
                        }}
                      >
                        {issue.type ? issue.type.toUpperCase() : "TASK"}
                      </div>
                      <div style={{ margin: "5px 0" }}>{issue.title}</div>

                      {issue.assignee && (
                        <div style={{ fontSize: "11px", color: "#5e6c84" }}>
                          {issue.assignee.name}
                        </div>
                      )}
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
    </div>
  );
}
