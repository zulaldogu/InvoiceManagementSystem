export type Customer = {
  CustomerId: number;
  TaxNumber: string | null;
  Title: string;
  Address: string | null;
  EMail: string | null;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
};

export type CustomerCreate = {
  TaxNumber: string | null;
  Title: string;
  Address: string | null;
  EMail: string | null;
};

export type CustomerUpdate = Partial<CustomerCreate>;