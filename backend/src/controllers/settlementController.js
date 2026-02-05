import * as settlementService from '../services/settlementService.js';
import { validationResult } from 'express-validator';

export const createSettlement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { from_user_id, to_user_id, amount, payment_method, notes } = req.body;
    const settlementId = await settlementService.createSettlement(
      req.params.id,
      from_user_id,
      to_user_id,
      amount,
      payment_method,
      notes,
      req.user.userId
    );
    
    res.status(201).json({ id: settlementId, message: 'Settlement recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getGroupSettlements = async (req, res, next) => {
  try {
    const settlements = await settlementService.getGroupSettlements(req.params.id, req.user.userId);
    res.json(settlements);
  } catch (error) {
    next(error);
  }
};

export const getOptimizedSettlements = async (req, res, next) => {
  try {
    const suggestions = await settlementService.getOptimizedSettlements(req.params.id, req.user.userId);
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
};
