export type Company = {
  CompanyId: number;
  CompanyCode: string;
  CompanyName: string;
  TaxNumber: string | null;
  Address: string | null;
  EMail: string | null;
  IsActive: boolean;
  RecordDate: string | null;
};

export type CompanyCreate = {
  CompanyCode: string;
  CompanyName: string;
  TaxNumber: string | null;
  Address: string | null;
  EMail: string | null;
  IsActive: boolean;
};

export type CompanyUpdate = {
  CompanyCode?: string;
  CompanyName?: string;
  TaxNumber?: string | null;
  Address?: string | null;
  EMail?: string | null;
  IsActive?: boolean;
};