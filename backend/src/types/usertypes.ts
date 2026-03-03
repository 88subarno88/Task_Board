export interface UpdateUserto {
  name?: string;
  avatarUrl?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  globalRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserroleto {
  userId: string;
  globalRole: 'GLOBAL_ADMIN' | 'USER';
}

export interface Userquery {
  page?: number;
  limit?: number;
  search?: string;
}
