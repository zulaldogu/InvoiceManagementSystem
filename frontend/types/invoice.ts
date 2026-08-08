export type InvoiceLine = {
  InvoiceLineId: number;
  InvoiceId: number;
  ProductId: number;
  ItemName: string | null;
  Quantity: number;
  Price: string;
  VatRate: string;
  ExciseTaxRate: string;
  Subtotal: string;
  VatAmount: string;
  ExciseTaxAmount: string;
  LineTotal: string;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
};

export type Invoice = {
  InvoiceId: number;
  CustomerId: number;
  InvoiceNumber: string;
  InvoiceDate: string | null;
  Subtotal: string;
  VatTotal: string;
  ExciseTaxTotal: string;
  TotalAmount: string;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
  Lines: InvoiceLine[];
};

export type InvoiceLineCreate = {
  ProductId: number;
  Quantity: number;
  Price?: number;
  VatRate?: number;
  ExciseTaxRate?: number;
};

export type InvoiceCreate = {
  CustomerId: number;
  InvoiceNumber: string;
  InvoiceDate: string;
  Lines: InvoiceLineCreate[];
};

export type InvoiceUpdate = {
  CustomerId?: number;
  InvoiceNumber?: string;
  InvoiceDate?: string;
};

export type InvoiceLineUpdate = {
  ProductId?: number;
  Quantity?: number;
  Price?: number;
  VatRate?: number;
  ExciseTaxRate?: number;
};