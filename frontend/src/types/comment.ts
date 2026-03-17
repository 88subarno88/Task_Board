// Comment types
export interface Comment {
  id: string;
  content: string;
  issueId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
