"use client";

import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

import type { CurrentAuthorization } from "@/types/authorization";
import type { CurrentUser } from "@/types/auth";

type AuthorizationContextValue = {
  currentUser: CurrentUser;
  authorization: CurrentAuthorization;
  hasRole: (roleName: string) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
};

const AuthorizationContext =
  createContext<AuthorizationContextValue | null>(
    null,
  );

type AuthorizationProviderProps = {
  currentUser: CurrentUser;
  authorization: CurrentAuthorization;
  children: ReactNode;
};

export function AuthorizationProvider({
  currentUser,
  authorization,
  children,
}: AuthorizationProviderProps) {
  function hasRole(roleName: string) {
    return (
      currentUser.IsSuperAdmin ||
      authorization.Roles.includes("*") ||
      authorization.Roles.includes(roleName)
    );
  }

  function hasAllRoles(roleNames: string[]) {
    return roleNames.every((roleName) =>
      hasRole(roleName),
    );
  }

  return (
    <AuthorizationContext.Provider
      value={{
        currentUser,
        authorization,
        hasRole,
        hasAllRoles,
      }}
    >
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);

  if (!context) {
    throw new Error(
      "useAuthorization must be used inside AuthorizationProvider",
    );
  }

  return context;
}