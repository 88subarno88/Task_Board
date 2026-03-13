export type Issue = {
  id: string;
  title: string;
  type: string;
  priority: string;
  description?: string;
  status: string;
  createdAt: string;
  reporter?: { name: string };
  assignee?: { name: string };
};