import * as notificationRepository from '../repositories/notificationRepository.js';

export const createNotification = async (userId, title, message, metadata = null) => {
  return await notificationRepository.createNotification(userId, title, message, metadata);
};

export const getUserNotifications = async (userId, pagination) => {
  return await notificationRepository.getUserNotifications(userId, pagination.limit, pagination.offset);
};

export const getUnreadCount = async (userId) => {
  return await notificationRepository.getUnreadCount(userId);
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.markAsRead(notificationId, userId);
  if (!notification) {
    throw new Error('Notification not found or unauthorized');
  }
  return notification;
};

export const markAllAsRead = async (userId) => {
  return await notificationRepository.markAllAsRead(userId);
};
