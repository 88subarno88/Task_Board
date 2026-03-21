import api from "./api";

export interface CreateBoardPayload {
  name: string;
  projectId: string;
}

export interface UpdateBoardPayload {
  name?: string;
}

export interface UpdateColumnPayload {
  name?: string;
  wipLimit?: number | null;
}

const boardService = {
  async getBoardsByProject(projectId: string) {
    const { data } = await api.get("/boards", {
      params: { projectId },
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
    const { data } = await api.post("/boards", payload);
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
  async updateColumn(
    boardId: string,
    columnId: string,
    payload: UpdateColumnPayload
  ) {
    const { data } = await api.put(
      `/boards/${boardId}/columns/${columnId}`,
      payload
    );
    return data;
  },
  async getStoriesByProject(projectId: string) {
    // get all boards first then fetch stories from each
    const boardsRes = await api.get("/boards", { params: { projectId } });
    const boards = boardsRes.data.data || [];

    const allStories: any[] = [];
    for (const board of boards) {
      const issuesRes = await api.get("/issues", {
        params: { boardId: board.id },
      });
      const issues = issuesRes.data.data || [];
      const stories = issues.filter((i: any) => i.type === "STORY");
      allStories.push(...stories);
    }
    return allStories;
  },
};

export default boardService;
