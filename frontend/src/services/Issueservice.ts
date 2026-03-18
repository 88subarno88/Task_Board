import api from "./api";

export interface CreateIssuePayload {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  boardId: string;
  columnId?: string;
  assigneeId?: string;
  dueDate?: string;
  parentId?: string;
}

export interface UpdateIssuePayload extends Partial<CreateIssuePayload> {
  // any specific  updates here
}

const issueService = {
  async getIssuesByBoard(boardId: string) {
    const { data } = await api.get("/issues", {
      params: { boardId },
    });
    return data;
  },
  async getIssueAuditLogs(issueId: string) {
    const { data } = await api.get(`/issues/${issueId}/audit`);
    return data;
  },

  async getIssue(issueId: string) {
    const { data } = await api.get(`/issues/${issueId}`);
    return data;
  },

  async createIssue(payload: CreateIssuePayload) {
    const { data } = await api.post("/issues", payload);
    return data;
  },

  async updateIssue(issueId: string, payload: UpdateIssuePayload) {
    const { data } = await api.put(`/issues/${issueId}`, payload);
    return data;
  },

  moveIssue: async (issueId: string, columnId: string) => {
    const response = await api.patch(`/issues/${issueId}/move`, {
      columnId,
    });
    return response.data;
  },

  async deleteIssue(issueId: string) {
    const { data } = await api.delete(`/issues/${issueId}`);
    return data;
  },
  
};

export default issueService;
