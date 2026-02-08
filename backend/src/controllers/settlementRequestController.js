import * as settlementRequestService from '../services/settlementRequestService.js';
import { validationResult } from 'express-validator';

export const createRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from_user_id, to_user_id, amount, payment_method, notes } = req.body;
    const requestId = await settlementRequestService.createRequest(
      req.params.id,
      from_user_id,
      to_user_id,
      amount,
      req.user.userId,
      payment_method,
      notes
    );

    res.status(201).json({ id: requestId, message: 'Settlement request sent. The other party will need to approve it.' });
  } catch (error) {
    next(error);
  }
};

export const getGroupRequests = async (req, res, next) => {
  try {
    const result = await settlementRequestService.getGroupRequests(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    await settlementRequestService.approveRequest(req.params.id, req.params.requestId, req.user.userId);
    res.json({ message: 'Settlement approved and verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    await settlementRequestService.rejectRequest(req.params.id, req.params.requestId, req.user.userId);
    res.json({ message: 'Settlement request rejected' });
  } catch (error) {
    next(error);
  }
};
