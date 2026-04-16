import * as timelineService from '../services/timelineService.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export const getGroupTimeline = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 50);
    const { rows, total } = await timelineService.getGroupTimeline(req.params.id, req.user.userId, { limit, offset });
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
};
