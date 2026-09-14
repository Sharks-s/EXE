export type PointTransactionType =
  | "SESSION_REWARD"
  | "ACHIEVEMENT_REWARD"
  | "STREAK_REWARD"
  | "PET_PURCHASE"
  | "ADMIN_ADJUSTMENT";

export interface PointWallet {
  currentPoints: number;
  totalEarnedPoints: number;
  totalSpentPoints: number;
}

export interface PointTransaction {
  id: number;
  amount: number;
  type: PointTransactionType;
  reason: string;
  referenceId: string;
  createdAt: string;
}

export interface PointTransactionPage {
  items: PointTransaction[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}
