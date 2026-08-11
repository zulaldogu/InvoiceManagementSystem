export type CurrentAuthorization = {
  UserId: number;
  CompanyId: number | null;
  IsSuperAdmin: boolean;
  Profiles: string[];
  Roles: string[];
};

export type Role = {
  RoleId: number;
  RoleName: string;
  Description: string | null;
  CompanyId: number;
  UserId: number | null;
  RecordDate: string | null;
};

export type RoleCreate = {
  RoleName: string;
  Description: string | null;
  CompanyId: number;
};

export type RoleUpdate = {
  RoleName?: string;
  Description?: string | null;
};

export type Profile = {
  ProfileId: number;
  ProfileName: string;
  Description: string | null;
  CompanyId: number;
  UserId: number | null;
  RecordDate: string | null;
};

export type ProfileCreate = {
  ProfileName: string;
  Description: string | null;
  CompanyId: number;
};

export type ProfileUpdate = {
  ProfileName?: string;
  Description?: string | null;
};

export type ProfileRole = {
  ProfileRoleId: number;
  ProfileId: number;
  RoleId: number;
  CompanyId: number;
  UserId: number | null;
  RecordDate: string | null;
};

export type ProfileRoleCreate = {
  ProfileId: number;
  RoleId: number;
};

export type UserProfile = {
  UserProfileId: number;
  UserId: number;
  ProfileId: number;
  CompanyId: number;
  RecordDate: string | null;
};

export type UserProfileCreate = {
  UserId: number;
  ProfileId: number;
};