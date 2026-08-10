export type User = {
  UserId: number;
  UserName: string;
  CompanyId: number | null;
  IsSuperAdmin: boolean;
  IsActive: boolean;
  RecordDate: string | null;
};

export type UserCreate = {
  UserName: string;
  Password: string;
  CompanyId: number | null;
  IsSuperAdmin: boolean;
  IsActive: boolean;
};

export type UserUpdate = {
  UserName?: string;
  Password?: string;
  IsActive?: boolean;
};