/**
 * Loan Product Types
 * Based on PCX.ListOfProducts table structure
 */

export interface LoanProduct {
  // Primary Identifier
  ProductID: string; // Maps to [MSP-LBG Product Code]

  // Product Basic Info
  'Launch Date'?: string | null;
  Brand?: string | null;
  'Withdraw Date'?: string | null;
  'Withdraw Code'?: string | null;
  'MSP-LBG Product Code'?: string | null;
  'Channel Type'?: string | null;
  'Customer Type'?: string | null;

  // Term and Type
  Term?: number | null;
  Type?: string | null;

  // BOE and Rate Tiers (8 tiers)
  'BOE1+/-'?: number | null;
  Rate1?: number | null;
  Until1?: string | null;

  'BOE2+/-'?: number | null;
  Rate2?: number | null;
  Until2?: string | null;

  'BOE3+/-'?: number | null;
  Rate3?: number | null;
  Until3?: string | null;

  'BOE4+/-'?: number | null;
  Rate4?: number | null;
  Until4?: string | null;

  'BOE5+/-'?: number | null;
  Rate5?: number | null;
  Until5?: string | null;

  'BOE6+/-'?: number | null;
  Rate6?: number | null;
  Until6?: string | null;

  'BOE7+/-'?: number | null;
  Rate7?: number | null;
  Until7?: string | null;

  'BOE8+/-'?: number | null;
  Rate8?: number | null;
  Until8?: string | null;

  // Fees
  'Product Fee (£)'?: number | null;
  'Product Fee (%)'?: number | null;

  // Loan Limits
  'Min Loan'?: number | null;
  'Max Loan'?: number | null;
  'Min LTV'?: number | null;
  'Max LTV'?: number | null;

  // Additional Information
  'Additional info'?: string | null;
  'Must Complete By'?: string | null;
  'Product Fee Acknum'?: string | null;
  'Repayment APR'?: number | null;
  'Scheme Type'?: string | null;
  'Portable Product'?: string | null;
  'Panel Number'?: number | null;
  'Payee Number'?: string | null;
  'Interest Calculation'?: string | null;
  'Link to HVR / HHVR'?: string | null;
  'Refund of Val'?: string | null;
  'Val Refund Acknum'?: string | null;
  'Free Val'?: string | null;
  'Free Conveyancing'?: string | null;
  'DAF to be waived'?: string | null;
  'HLC Free'?: string | null;

  // Cashback
  'Cashback (£)'?: number | null;
  'Cashback (%)'?: string | null;
  'Cashback Acknum'?: string | null;
  'Proc Fee Code'?: string | null;
  'Proc Fee Narrative'?: string | null;

  // Tied Text Fields
  'Tied Insurance Free Format Text'?: string | null;
  'Tied Non Insurance Free Format Text'?: string | null;
  'Tied Incentivised Free Format Text'?: string | null;
  Narrative?: string | null;

  // Credit and Scoring
  'Best Credit Score Applicable'?: string | null;
  'Worst Credit Score Applicable'?: string | null;
  'CarbonOffset (%)'?: string | null;
  Calculator?: string | null;
  Extras?: number | null;
  'BERR (Government Reporting)'?: string | null;

  // ERC (Early Repayment Charge) Rates (8 tiers)
  'ERC Rate1'?: number | null;
  'ERC Until1'?: string | null;
  'ERC Rate2'?: number | null;
  'ERC Until2'?: string | null;
  'ERC Rate3'?: number | null;
  'ERC Until3'?: string | null;
  'ERC Rate4'?: number | null;
  'ERC Until4'?: string | null;
  'ERC Rate5'?: number | null;
  'ERC Until5'?: string | null;
  'ERC Rate6'?: number | null;
  'ERC Until6'?: string | null;
  'ERC Rate7'?: number | null;
  'ERC Until7'?: string | null;
  'ERC Rate8'?: number | null;
  'ERC Until8'?: string | null;

  // Cashback Limits
  'Cashback Minimum Amount'?: number | null;
  'Cashback Maximum Amount'?: number | null;
  'Cashback Type'?: string | null;
  'Repayment Fees'?: string | null;

  // Portable Tied Text
  'Portable Tied Non Insurance Free Format Text'?: string | null;
  'Portable Tied Incentivised Free Format Text'?: string | null;

  // UFSS Product Codes
  'UFSS Interest Only Product Code (CGM)'?: string | null;
  'UFSS Repayment Product Code (CGM)'?: string | null;
  'UFSS Interest Only Product Code (MOR)'?: string | null;
  'UFSS Repayment Product Code (MOR)'?: string | null;
  'UFSS Interest Only Product Code (LBM)'?: string | null;
  'UFSS Repayment Product Code (LBM)'?: string | null;
  'UFSS Interest Only Product Code (BMG)'?: string | null;
  'UFSS Repayment Product Code (BMG)'?: string | null;

  // Account and Product Details
  'Account Type'?: string | null;
  'Current Product Cessation Type'?: string | null;
  'Risk Type'?: number | null;
  'Product String'?: string | null;
  'Withdrawn SOLAR code'?: string | null;
  'SOLAR CODE'?: string | null;
  'CHAPS Fee'?: number | null;
  'Channel Type / Category'?: string | null;
  'Core / Exclusive'?: string | null;
  'Offset Available'?: string | null;
  CI?: string | null;
  IO?: string | null;
  'ERC Term (Yrs)'?: number | null;
  'Individual LOP'?: string | null;
  'ERC Code'?: string | null;
  'Complete By'?: string | null;
  'MPET Valuation'?: string | null;
  'MPET Legal'?: string | null;
  Core?: string | null;
  IRLID?: string | null;
  'Interest Rate Code'?: string | null;
  'Mortgage Type'?: number | null;
}

/**
 * LoanProduct with database audit fields
 */
export interface LoanProductDB extends LoanProduct {
  IsActive: boolean;
  CreatedDate: Date;
  CreatedBy: string;
  UpdatedDate: Date | null;
  UpdatedBy: string | null;
}

/**
 * History record for audit trail
 */
export interface LoanProductHistory {
  HistoryID: number;
  ProductID: string;

  // Complete snapshots
  OldRecordJSON: string | null;
  NewRecordJSON: string;

  // Specific tracked changes (for quick queries)
  OldRate1: number | null;
  NewRate1: number | null;
  OldWithdrawDate: string | null;
  NewWithdrawDate: string | null;
  OldProductFee: number | null;
  NewProductFee: number | null;

  // Change metadata
  ChangeType: 'INSERT' | 'UPDATE';
  ChangeDescription: string | null;
  ChangeDate: Date;
  ChangedBy: string;
}

/**
 * Product changes for reconciliation
 */
export interface ProductChange {
  rate1?: {
    from: number;
    to: number;
  };
  withdrawDate?: {
    from: string | null;
    to: string | null;
  };
  productFee?: {
    from: number;
    to: number;
  };
  brand?: {
    from: string;
    to: string;
  };
  type?: {
    from: string;
    to: string;
  };
  otherChanges?: string[];
}

/**
 * Product with changes for reconciliation report
 */
export interface ProductWithChanges {
  productId: string;
  productName?: string;
  brand?: string;
  changes: ProductChange;
}

/**
 * Simplified product view for listing
 */
export interface LoanProductListItem {
  ProductID: string;
  'MSP-LBG Product Code'?: string;
  Brand?: string;
  Type?: string;
  Rate1?: number;
  'Launch Date'?: string;
  'Withdraw Date'?: string;
  'Product Fee (£)'?: number;
  IsActive: boolean;
  UpdatedDate?: Date;
  UpdatedBy?: string;
}

/**
 * Excel row interface for parsing
 */
export interface ExcelProductRow {
  'Launch Date'?: any;
  Brand?: any;
  'Withdraw Date'?: any;
  'Withdraw Code'?: any;
  'MSP-LBG Product Code'?: any;
  'Channel Type'?: any;
  'Customer Type'?: any;
  Term?: any;
  Type?: any;
  'BOE1+/-'?: any;
  Rate1?: any;
  Until1?: any;
  'BOE2+/-'?: any;
  Rate2?: any;
  Until2?: any;
  'BOE3+/-'?: any;
  Rate3?: any;
  Until3?: any;
  'BOE4+/-'?: any;
  Rate4?: any;
  Until4?: any;
  'BOE5+/-'?: any;
  Rate5?: any;
  Until5?: any;
  'BOE6+/-'?: any;
  Rate6?: any;
  Until6?: any;
  'BOE7+/-'?: any;
  Rate7?: any;
  Until7?: any;
  'BOE8+/-'?: any;
  Rate8?: any;
  Until8?: any;
  'Product Fee (£)'?: any;
  'Product Fee (%)'?: any;
  'Min Loan'?: any;
  'Max Loan'?: any;
  'Min LTV'?: any;
  'Max LTV'?: any;
  'Additional info'?: any;
  'Must Complete By'?: any;
  'Product Fee Acknum'?: any;
  'Repayment APR'?: any;
  'Scheme Type'?: any;
  'Portable Product'?: any;
  'Panel Number'?: any;
  'Payee Number'?: any;
  'Interest Calculation'?: any;
  'Link to HVR / HHVR'?: any;
  'Refund of Val'?: any;
  'Val Refund Acknum'?: any;
  'Free Val'?: any;
  'Free Conveyancing'?: any;
  'DAF to be waived'?: any;
  'HLC Free'?: any;
  'Cashback (£)'?: any;
  'Cashback (%)'?: any;
  'Cashback Acknum'?: any;
  'Proc Fee Code'?: any;
  'Proc Fee Narrative'?: any;
  'Tied Insurance Free Format Text'?: any;
  'Tied Non Insurance Free Format Text'?: any;
  'Tied Incentivised Free Format Text'?: any;
  Narrative?: any;
  'Best Credit Score Applicable'?: any;
  'Worst Credit Score Applicable'?: any;
  'CarbonOffset (%)'?: any;
  Calculator?: any;
  Extras?: any;
  'BERR (Government Reporting)'?: any;
  'ERC Rate1'?: any;
  'ERC Until1'?: any;
  'ERC Rate2'?: any;
  'ERC Until2'?: any;
  'ERC Rate3'?: any;
  'ERC Until3'?: any;
  'ERC Rate4'?: any;
  'ERC Until4'?: any;
  'ERC Rate5'?: any;
  'ERC Until5'?: any;
  'ERC Rate6'?: any;
  'ERC Until6'?: any;
  'ERC Rate7'?: any;
  'ERC Until7'?: any;
  'ERC Rate8'?: any;
  'ERC Until8'?: any;
  'Cashback Minimum Amount'?: any;
  'Cashback Maximum Amount'?: any;
  'Cashback Type'?: any;
  'Repayment Fees'?: any;
  'Portable Tied Non Insurance Free Format Text'?: any;
  'Portable Tied Incentivised Free Format Text'?: any;
  'UFSS Interest Only Product Code (CGM)'?: any;
  'UFSS Repayment Product Code (CGM)'?: any;
  'UFSS Interest Only Product Code (MOR)'?: any;
  'UFSS Repayment Product Code (MOR)'?: any;
  'UFSS Interest Only Product Code (LBM)'?: any;
  'UFSS Repayment Product Code (LBM)'?: any;
  'UFSS Interest Only Product Code (BMG)'?: any;
  'UFSS Repayment Product Code (BMG)'?: any;
  'Account Type'?: any;
  'Current Product Cessation Type'?: any;
  'Risk Type'?: any;
  'Product String'?: any;
  'Withdrawn SOLAR code'?: any;
  'SOLAR CODE'?: any;
  'CHAPS Fee'?: any;
  'Channel Type / Category'?: any;
  'Core / Exclusive'?: any;
  'Offset Available'?: any;
  CI?: any;
  IO?: any;
  'ERC Term (Yrs)'?: any;
  'Individual LOP'?: any;
  'ERC Code'?: any;
  'Complete By'?: any;
  'MPET Valuation'?: any;
  'MPET Legal'?: any;
  Core?: any;
  IRLID?: any;
  'Interest Rate Code'?: any;
  'Mortgage Type'?: any;
}

/**
 * Field mapping for Excel column names to database columns
 */
export const EXCEL_FIELD_MAPPING: Record<string, string> = {
  'Launch Date': 'Launch Date',
  Brand: 'Brand',
  'Withdraw Date': 'Withdraw Date',
  'Withdraw Code': 'Withdraw Code',
  'MSP-LBG Product Code': 'MSP-LBG Product Code',
  'Channel Type': 'Channel Type',
  'Customer Type': 'Customer Type',
  Term: 'Term',
  Type: 'Type',
  'BOE1+/-': 'BOE1+/-',
  Rate1: 'Rate1',
  Until1: 'Until1',
  // ... (add all other mappings)
};

/**
 * Validation rules for product fields
 */
export const VALIDATION_RULES = {
  ProductID: {
    required: true,
    maxLength: 50,
  },
  Rate1: {
    min: 0,
    max: 100,
  },
  'Product Fee (£)': {
    min: 0,
  },
  'Min Loan': {
    min: 0,
  },
  'Max Loan': {
    min: 0,
  },
  'Min LTV': {
    min: 0,
    max: 100,
  },
  'Max LTV': {
    min: 0,
    max: 100,
  },
};

/**
 * Helper function to get product display name
 */
export function getProductDisplayName(product: LoanProduct): string {
  return (
    product['MSP-LBG Product Code'] || product.ProductID || 'Unknown Product'
  );
}

/**
 * Helper function to check if product is active
 */
export function isProductActive(product: LoanProduct): boolean {
  const withdrawDate = product['Withdraw Date'];
  if (!withdrawDate || withdrawDate === '') {
    return true;
  }

  try {
    const date = new Date(withdrawDate);
    return date > new Date();
  } catch {
    return true; // If date parsing fails, assume active
  }
}

/**
 * Helper function to get primary rate
 */
export function getPrimaryRate(product: LoanProduct): number | null {
  return product['Rate1'] ?? null;
}

/**
 * Helper function to serialize product for JSON storage
 */
export function serializeProduct(product: LoanProduct): string {
  return JSON.stringify(product, null, 2);
}

/**
 * Helper function to deserialize product from JSON
 */
export function deserializeProduct(json: string): LoanProduct {
  return JSON.parse(json);
}
