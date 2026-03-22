// auth related types
// TODO: might need to add more fields later

export interface User {
    id: string
    name: string
    email: string
    globalRole: 'GLOBAL_ADMIN' | 'USER';
    avatarUrl?: string  // optional, not everyone has one
  }
  
  export interface LoginData {
    email: string
    password: string
  }
  
  export interface RegisterData {
    name: string
    email: string
    password: string
  }
  
  // what the server sends back after login
  export interface AuthResponse {
    success: boolean
    data?: {
      user: User
      accessToken: string
    }
    message?: string
  }