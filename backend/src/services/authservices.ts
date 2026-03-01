import prisma from '../config/database';
import { hashPassword, comparePasswords, validatePasswordStrength } from '../utils/password';
import { genAccessToken, genRefreshToken, validateRefreshToken } from '../utils/jwt';
import { RegisterDto, LoginDto, AuthResponse, TokenPair } from '../types/authtypes';
import { AppError } from '../middleware/errorHandler';

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const isValidPassword = (password: string) => {
  const isvalidpassword = validatePasswordStrength(password);
  if (!isvalidpassword.valid) {
    throw new AppError(400, isvalidpassword.message || 'Invalid password');
  }
};

const checkUserExists = async (email: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new AppError(400, 'A user associated with this email already exists.');
  }
};

const findUserWithMail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError(401, 'No user is associated with the email.');
  }
  return user;
};

export const registerasUser = async (data: RegisterDto): Promise<AuthResponse> => {
  const { email, password, name } = data;

  isValidPassword(password);
  await checkUserExists(email);

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      globalRole: 'USER',
    },
  });

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    globalRole: user.globalRole,
  };

  const accessToken = genAccessToken(tokenPayload);
  const refreshToken = genRefreshToken(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_IN_MS),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
    },
    accessToken,
  };
};

export const loginasUser = async (data: LoginDto): Promise<AuthResponse> => {
  const { email, password } = data;

  const user = await findUserWithMail(email);

  const isPasswordValid = await comparePasswords(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid  password');
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    globalRole: user.globalRole,
  };

  const accessToken = genAccessToken(tokenPayload);
  const refreshToken = genRefreshToken(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_IN_MS),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
    },
    accessToken,
  };
};

export const getUserprofile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      globalRole: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return user;
};

export const refreshUserToken = async (refreshTokenString: string): Promise<TokenPair> => {
  try {
    validateRefreshToken(refreshTokenString);
  } catch (error) {
    throw new AppError(401, 'Expired refresh token');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenString },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'Refresh token not found in database');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AppError(401, 'Refresh token expired');
  }

  const tokenPayload = {
    userId: storedToken.user.id,
    email: storedToken.user.email,
    globalRole: storedToken.user.globalRole,
  };

  const newAccessToken = genAccessToken(tokenPayload);
  const newRefreshToken = genRefreshToken(tokenPayload);

  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_IN_MS),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const Userlogout = async (refreshTokenString: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshTokenString },
  });
};
