export type Issue = {
  id: string;
  title: string;
  type: "STORY" | "TASK" | "BUG";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description?: string;
  status: string;
  boardId: string;
  columnId: string;
  parentId?: string | null;
  dueDate?: string | null;
  createdAt: string;

  reporter?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };

  children?: Issue[];
};
