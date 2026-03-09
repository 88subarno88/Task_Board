export interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  }