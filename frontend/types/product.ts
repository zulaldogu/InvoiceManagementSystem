export type Product = {
  ProductId: number;
  ProductCode: string | null;
  ProductName: string;
  UnitPrice: string;
  VatRate: string | null;
  CompanyId: number | null;
  UserId: number | null;
  RecordDate: string | null;
};

export type ProductCreate = {
  ProductCode: string | null;
  ProductName: string;
  UnitPrice: number;
  VatRate: number | null;
};

export type ProductUpdate = Partial<ProductCreate>;