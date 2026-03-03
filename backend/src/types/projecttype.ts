export interface NewProjectData {
  name: string;
  description: string;
}

export interface UpdateProjectInfo {
  name?: string;
  description?: string;
  archived?: boolean;
}

export interface AddUserToProject {
  userId: string;
  role: 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';
}

export interface ChangeMemberRole {
  role: 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';
}

export interface ProjectInfoResponse {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberDetailsResponse {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}
