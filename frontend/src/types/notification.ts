export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
  isRead: boolean;
  createdAt: string;
  user?: {
    name: string;
    avatarUrl?: string | null;
  };
};
