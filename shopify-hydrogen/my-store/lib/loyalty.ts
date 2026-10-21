export type LoyaltyReward = {
  milestone: number;
  percentOff: number;
  label: string;
};

export type LoyaltyState = {
  orderCount: number;
  nextOrderNumber: number;
  nextMilestone: number;
  nextPercentOff: number;
  ordersToNextMilestone: number;
  progress: number;
  reward: LoyaltyReward | null;
  milestones: Array<{
    milestone: number;
    percentOff: number;
    unlocked: boolean;
    current: boolean;
  }>;
};

const STANDARD_STEP = 10;
const STANDARD_PERCENT = 50;
const PREMIUM_STEP = 100;
const PREMIUM_PERCENT = 75;

export function rewardPercentForOrder(orderNumber: number): number {
  if (!Number.isFinite(orderNumber) || orderNumber <= 0) return 0;
  if (orderNumber % PREMIUM_STEP === 0) return PREMIUM_PERCENT;
  if (orderNumber % STANDARD_STEP === 0) return STANDARD_PERCENT;
  return 0;
}

export function nextMilestoneOrder(orderCount: number): number {
  const completed = Math.max(0, Math.floor(orderCount));
  return Math.floor(completed / STANDARD_STEP) * STANDARD_STEP + STANDARD_STEP;
}

/**
 * Reward for the order the customer is about to place. The order that lands on
 * a multiple of 10 earns 50% off, the order that lands on a multiple of 100
 * earns 75% off.
 */
export function rewardForNextOrder(orderCount: number): LoyaltyReward | null {
  const orderNumber = Math.max(0, Math.floor(orderCount)) + 1;
  const percentOff = rewardPercentForOrder(orderNumber);
  if (!percentOff) return null;
  return {
    milestone: orderNumber,
    percentOff,
    label: `${percentOff}% off loyalty reward on order #${orderNumber}`,
  };
}

export function loyaltyState(orderCount: number): LoyaltyState {
  const completed = Math.max(0, Math.floor(orderCount));
  const nextMilestone = nextMilestoneOrder(completed);
  const nextOrderNumber = completed + 1;
  const ordersToNextMilestone = Math.max(0, nextMilestone - completed);
  const milestoneSpan = STANDARD_STEP;
  const progress = Math.min(
    1,
    Math.max(0, (completed - (nextMilestone - milestoneSpan)) / milestoneSpan),
  );

  const milestones: LoyaltyState["milestones"] = [];
  for (let milestone = STANDARD_STEP; milestone <= PREMIUM_STEP; milestone += STANDARD_STEP) {
    milestones.push({
      milestone,
      percentOff: rewardPercentForOrder(milestone),
      unlocked: completed >= milestone,
      current: milestone === nextMilestone,
    });
  }

  return {
    orderCount: completed,
    nextOrderNumber,
    nextMilestone,
    nextPercentOff: rewardPercentForOrder(nextMilestone),
    ordersToNextMilestone,
    progress,
    reward: rewardForNextOrder(completed),
    milestones,
  };
}

export function formatReward(reward: LoyaltyReward | null): string {
  if (!reward) return "";
  return `${reward.percentOff}% off`;
}
