import * as userRepository from '../repositories/userRepository.js';
import * as ledgerRepository from '../repositories/ledgerRepository.js';

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
