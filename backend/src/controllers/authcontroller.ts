import { Request, Response } from 'express';
import {
  registerasUser,
  loginasUser,
  refreshUserToken,
  Userlogout,
  getUserprofile,
} from '../services/authservices';
import { asyncHandler } from '../middleware/errorHandler';

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const register = asyncHandler(async (req: Request, res: Response) => {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;

  if (!email || !password || !name) {
    if (!email && !password && !name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill email, password, and name.',
      });
      return;
    } else if (!email && !password && name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill email and password.',
      });
      return;
    } else if (!email && password && !name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill email and name.',
      });
      return;
    } else if (email && !password && !name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill password and name.',
      });
      return;
    } else if (!email && password && name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill email.',
      });
      return;
    } else if (email && !password && name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill password.',
      });
      return;
    } else if (email && password && !name) {
      res.status(400).json({
        success: false,
        message: 'You forgot to fill name.',
      });
      return;
    }
  }

  const result = await registerasUser({ email, password, name });

  res.status(201).json({
    success: true,
    data: result,
    message: 'User registered successfully.',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    if (!email && password) {
      res.status(400).json({
        success: false,
        message: 'Email is also required to login.',
      });
      return;
    } else if (email && !password) {
      res.status(400).json({
        success: false,
        message: 'Password is also required to login.',
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        message: 'Email and password are required to login.',
      });
      return;
    }
  }

  const result = await loginasUser({ email, password });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Login successful!',
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  let refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'You do not have a refresh token. Please log in again.',
    });
    return;
  }

  const newTokens = await refreshUserToken(refreshToken);

  res.cookie('refreshToken', newTokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SEVEN_DAYS_IN_MS,
  });

  res.status(200).json({
    success: true,
    data: { accessToken: newTokens.accessToken },
    message: 'A fresh Token has generated.',
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    await Userlogout(refreshToken);
  }

  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
  });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'You arenot authenticated',
    });
    return;
  }

  const myUser = await getUserprofile(userId);

  res.status(200).json({
    success: true,
    data: myUser,
  });
});
