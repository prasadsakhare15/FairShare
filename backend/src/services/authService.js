import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import * as userRepository from '../repositories/userRepository.js';

export const register = async (name, email, password) => {
  // Check if user exists
  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const userId = await userRepository.createUser(name, email, passwordHash);
  
  // Generate tokens
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });
  
  return {
    user: { id: userId, name, email },
    accessToken,
    refreshToken
  };
};

export const login = async (email, password) => {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  
  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  };
};

export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userRepository.getUserById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
