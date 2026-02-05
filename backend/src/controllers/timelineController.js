import * as timelineService from '../services/timelineService.js';

export const getGroupTimeline = async (req, res, next) => {
  try {
    const timeline = await timelineService.getGroupTimeline(req.params.id, req.user.userId);
    res.json(timeline);
  } catch (error) {
    next(error);
  }
};
