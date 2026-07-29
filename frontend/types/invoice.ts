export type InvoiceLine = {
  InvoiceLineId: number;
  InvoiceId: number;
  ProductId: number | null;
  ItemName: string;
  Quantity: number;
  Price: string;
  UserId: number | null;
  RecordDate: string;
};

export type Invoice = {
  InvoiceId: number;
  CustomerId: number | null;
  InvoiceNumber: string;
  InvoiceDate: string | null;
  TotalAmount: string | null;
  UserId: number | null;
  RecordDate: string;
  Lines: InvoiceLine[];
};