import * as notificationService from '../services/notificationService.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { rows, totalCount } = await notificationService.getUserNotifications(req.user.userId, { limit, offset });
    
    res.json(paginatedResponse(rows, totalCount, page, limit));
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.userId);
    res.json({ message: 'Marked as read', notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read', updatedCount: count });
  } catch (error) {
    next(error);
  }
};
