import api from './api';

export interface CreateBoardPayload {
  name: string;
  projectId: string;
}

export interface UpdateBoardPayload {
  name?: string;
}

const boardService = {
  async getBoardsByProject(projectId: string) {
    const { data } = await api.get('/boards', {
      params: { projectId }
    });
    return data;
  },

  async getBoard(boardId: string) {
    const { data } = await api.get(`/boards/${boardId}`);
    return data;
  },

  async getBoardWithIssues(boardId: string) {
    const { data } = await api.get(`/boards/${boardId}`);
    return data;
  },

  async createBoard(payload: CreateBoardPayload) {
    const { data } = await api.post('/boards', payload);
    return data;
  },

  async updateBoard(boardId: string, payload: UpdateBoardPayload) {
    const { data } = await api.put(`/boards/${boardId}`, payload);
    return data;
  },

  async deleteBoard(boardId: string) {
    const { data } = await api.delete(`/boards/${boardId}`);
    return data;
  },
};

export default boardService;
