import * as ledgerRepository from '../repositories/ledgerRepository.js';
import * as groupRepository from '../repositories/groupRepository.js';

export const getGroupBalances = async (req, res, next) => {
  try {
    // Validate group membership
    const member = await groupRepository.isGroupMember(req.params.id, req.user.userId);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    const balances = await ledgerRepository.getGroupBalances(req.params.id);
    res.json(balances);
  } catch (error) {
    next(error);
  }
};
