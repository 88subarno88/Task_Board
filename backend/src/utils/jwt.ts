import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  globalRole: string;
}

export const genAccessToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: config.jwtAccessExpiry as SignOptions['expiresIn'],
    });
  } catch (error) {
    throw new Error('Encountered an unexpected error while generating access token.');
  }
};

export const genRefreshToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiry as SignOptions['expiresIn'],
    });
  } catch (error) {
    throw new Error('Encountered an unexpected error while refreshing access token.');
  }
};

export const validateAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error('Your access token is expired.Please log in again.');
  }
};

export const validateRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error('Your refresh token maynot correct. Please log in again.');
  }
};

export const seeInsideToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};
