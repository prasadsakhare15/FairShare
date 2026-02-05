import * as userRepository from '../repositories/userRepository.js';

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
