import api from './api'
import type { LoginData, RegisterData } from '../types/auth'

// login user
// returns the token and user info
export const login = async (data: LoginData) => {
  const res = await api.post('/auth/login', data)
  return res.data
}

// register new user
export const register = async (data: RegisterData) => {
  const res = await api.post('/auth/register', data)
  return res.data
}

// logout - clears token
export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (err) {
    // even if server fails, clear local token
    console.log('logout error', err)
  }
  localStorage.removeItem('accessToken')
}

// get current logged in user
export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}