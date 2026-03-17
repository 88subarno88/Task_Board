import { useState, useEffect } from "react";
import issueService from "../services/Issueservice";
import type { Issue } from "../types/issues";


interface IssueDetailProps {
  issueId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function IssueDetail(props: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("component loaded, loading issue:", props.issueId);
    loadIssue();
  }, [props.issueId]);

  const loadIssue = async () => {
    try {
      setLoading(true);
      const response = await issueService.getIssue(props.issueId);
      console.log("got issue data!", response.data);
      setIssue(response.data);
    } catch (err) {
      console.log("Failed to load issue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    let userIsSure = window.confirm(
      "Are you sure you want to delete this issue?",
    );

    if (userIsSure === false) {
      return;
    }

    try {
      console.log("deleting issue id:", props.issueId);
      await issueService.deleteIssue(props.issueId);

      props.onUpdate();

      props.onClose();
    } catch (err: any) {
      console.log("error deleting", err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to delete issue");
      }
    }
  };

  if (loading === true) {
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
        onClick={props.onClose}
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

  if (issue === null) {
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
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          width: "700px",
          maxWidth: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
            >
              {issue.type} • {issue.priority}
            </div>
            <h2 style={{ margin: 0 }}>{issue.title}</h2>
          </div>

          <button
            onClick={props.onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

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
          <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>
            {issue.description !== "" &&
            issue.description !== null &&
            issue.description !== undefined
              ? issue.description
              : "No description"}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}
              >
                Status
              </div>
              <div>{issue.status}</div>
            </div>

            <div>
              <div
                style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}
              >
                Reporter
              </div>
              <div>{issue.reporter ? issue.reporter.name : "Unknown"}</div>
            </div>

            <div>
              <div
                style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}
              >
                Assignee
              </div>
              <div>{issue.assignee ? issue.assignee.name : "Unassigned"}</div>
            </div>

            <div>
              <div
                style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}
              >
                Created
              </div>
              <div>{new Date(issue.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <button
            onClick={handleDelete}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete Issue
          </button>
        </div>
      </div>
    </div>
  );
}
