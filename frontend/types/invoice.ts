export type InvoiceLine = {
  InvoiceLineId: number;
  InvoiceId: number;
  ProductId: number;
  ItemName: string | null;
  Quantity: number;
  Price: string;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
};

export type Invoice = {
  InvoiceId: number;
  CustomerId: number;
  InvoiceNumber: string;
  InvoiceDate: string | null;
  TotalAmount: string | null;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
  Lines: InvoiceLine[];
};

export type InvoiceLineCreate = {
  ProductId: number;
  Quantity: number;
  Price: number;
};

export type InvoiceCreate = {
  CustomerId: number;
  InvoiceNumber: string;
  InvoiceDate: string;
  Lines: InvoiceLineCreate[];
};