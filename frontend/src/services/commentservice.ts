import api from "./api";

export const commentService = {
  async getComments(issueId: string) {
    const response = await api.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  async addComment(issueId: string, content: string) {
    const response = await api.post(`/issues/${issueId}/comments`, {
      content,
    });
    return response.data;
  },

  async updateComment(commentId: string, content: string) {
    const response = await api.patch(`/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  async deleteComment(commentId: string) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};

export default commentService;
