import api from "./api";
export interface ProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload extends Partial<ProjectPayload> {
  isArchived?: boolean;
}

const projectService = {
  async getMyProjects(includeArchived = false) {
    const { data } = await api.get("/projects", {
      params: { includeArchived },
    });
    return data;
  },

  async getProject(projectId: string) {
    const { data } = await api.get(`/projects/${projectId}`);
    return data;
  },

  async createProject(payload: ProjectPayload) {
    const { data } = await api.post("/projects", payload);
    return data;
  },

  async updateProject(projectId: string, payload: UpdateProjectPayload) {
    const { data } = await api.put(`/projects/${projectId}`, payload);
    return data;
  },

  async deleteProject(projectId: string) {
    const { data } = await api.delete(`/projects/${projectId}`);
    return data;
  },

  async getMembers(projectId: string) {
    const { data } = await api.get(`/projects/${projectId}/members`);
    return data;
  },

  async addMember(projectId: string, userId: string, role: string) {
    const { data } = await api.post(`/projects/${projectId}/members`, {
      userId,
      role,
    });
    return data;
  },
  async searchUserByEmail(email: string) {
    const { data } = await api.get(`/users/search?email=${email}`);
    return data;
  },
  updateMemberRole: async (
    projectId: string,
    userId: string,
    newRole: string,
  ) => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, {
      role: newRole,
    });
    return response.data;
  },

  removeMember: async (projectId: string, userId: string) => {
    const response = await api.delete(
      `/projects/${projectId}/members/${userId}`,
    );
    return response.data;
  },
};

export default projectService;
