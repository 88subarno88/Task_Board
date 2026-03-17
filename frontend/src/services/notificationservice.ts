import api from "./api";

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    const response = await api.get(`/notifications?unreadOnly=${unreadOnly}`);
    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },
};

export default notificationService;
