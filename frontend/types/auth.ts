export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentUser = {
  UserName: string;
  UserId: number;
  CompanyId: number | null;
  IsSuperAdmin: boolean;
  IsActive: boolean;
  RecordDate: string | null;
};