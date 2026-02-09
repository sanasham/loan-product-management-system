export interface LoanProduct {
  ProductID: string;
  ProductName: string;
  LoanStartDate: Date | string;
  WithdrawnDate: Date | string | null;
  Pricing: number;
}

export interface LoanProductDB extends LoanProduct {
  IsActive: boolean;
  CreatedDate: Date;
  CreatedBy: string;
  UpdatedDate: Date | null;
  UpdatedBy: string | null;
}

export interface LoanProductHistory {
  HistoryID: number;
  ProductID: string;
  ProductName: string;
  OldPricing: number | null;
  NewPricing: number;
  OldWithdrawnDate: Date | null;
  NewWithdrawnDate: Date | null;
  ChangeType: 'INSERT' | 'UPDATE';
  ChangeDate: Date;
  ChangedBy: string;
}

export interface ProductChange {
  pricing?: {
    from: number;
    to: number;
  };
  withdrawnDate?: {
    from: Date | null;
    to: Date | null;
  };
}

export interface ProductWithChanges {
  productId: string;
  productName: string;
  changes: ProductChange;
}
