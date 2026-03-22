import RichTextEditor from "./RichTextEditot";
import { useState, useEffect } from "react";
import issueService from "../services/Issueservice";
import projectService from "../services/projectservices";
import styles from "./cssmodules/issue.module.css";

interface IssueFormProps {
  projectId: string;
  boardId: string;
  columnId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IssueForm(props: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"TASK" | "BUG">("TASK");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");

  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentId, setParentId] = useState("");
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const boardData = await issueService.getIssuesByBoard(props.boardId);
        const stories = boardData.data.filter(
          (issue: any) => issue.type === "STORY",
        );
        setAvailableStories(stories);

        const projectData = await projectService.getProject(props.projectId);

        // ADD THIS CONSOLE LOG:
        console.log(" PROJECT DATA FETCHED:", projectData);
        const membersArray =
          projectData.data?.members ||
          projectData.data?.data?.members ||
          projectData.members ||
          [];

        setProjectMembers(membersArray.map((m: any) => m.user || m));
      } catch (err) {
        console.error("Failed to load form data", err);
      }
    };
    fetchData();
  }, [props.boardId, props.projectId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newIssueData = {
        title,
        description,
        type,
        priority,
        boardId: props.boardId,
        columnId: props.columnId,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        parentId: parentId ? parentId : undefined,
      };

      await issueService.createIssue(newIssueData);
      props.onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={props.onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>Create Issue</h2>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter issue title"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Type *</label>
            <select
              className={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="TASK">Task</option>
              <option value="BUG">Bug</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Priority</label>
            <select
              className={styles.input}
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {(type === "TASK" || type === "BUG") && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Parent Story</label>
              <select
                className={styles.input}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Assignee</label>
            <select
              className={styles.input}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Due Date</label>
            <input
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <RichTextEditor
              placeholder="Add a detailed description..."
              onChange={(html: string) => setDescription(html)}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
