import * as userRepository from '../repositories/userRepository.js';
import * as ledgerRepository from '../repositories/ledgerRepository.js';
import bcrypt from 'bcrypt';

export const getProfile = async (req, res, next) => {
  try {
    const user = await userRepository.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const updated = await userRepository.updateUser(req.user.userId, name.trim());
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await userRepository.getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(req.user.userId, newHash);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBalanceSummary = async (req, res, next) => {
  try {
    const summary = await ledgerRepository.getUserBalanceSummary(req.user.userId);
    res.json({
      youOwe: parseFloat(summary.you_owe ?? 0),
      youAreOwed: parseFloat(summary.you_are_owed ?? 0),
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const users = await userRepository.searchUsers(q.trim(), req.user.userId);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

