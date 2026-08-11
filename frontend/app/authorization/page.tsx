"use client";

import { useCallback, useEffect, useState } from "react";

import AuthorizationRecordModal from "@/components/authorization-record-modal";
import { apiRequest } from "@/lib/api";
import type {
  Profile,
  ProfileRole,
  Role,
  UserProfile,
} from "@/types/authorization";
import type { CurrentUser } from "@/types/auth";
import type { Company } from "@/types/company";
import type { User } from "@/types/user";

type ModalState =
  | {
      kind: "role";
      record: Role | null;
    }
  | {
      kind: "profile";
      record: Profile | null;
    }
  | null;

export default function AuthorizationPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileRoles, setProfileRoles] =
    useState<ProfileRole[]>([]);
  const [userProfiles, setUserProfiles] =
    useState<UserProfile[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] =
    useState(0);
  const [selectedProfileId, setSelectedProfileId] =
    useState(0);
  const [modalState, setModalState] =
    useState<ModalState>(null);
  const [busyKey, setBusyKey] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadManagementData = useCallback(async () => {
    const [
      companyData,
      userData,
      roleData,
      profileData,
      profileRoleData,
      userProfileData,
    ] = await Promise.all([
      apiRequest<Company[]>("/companies/"),
      apiRequest<User[]>("/users/"),
      apiRequest<Role[]>("/roles/"),
      apiRequest<Profile[]>("/profiles/"),
      apiRequest<ProfileRole[]>("/profile-roles/"),
      apiRequest<UserProfile[]>("/user-profiles/"),
    ]);

    setCompanies(companyData);
    setUsers(userData);
    setRoles(roleData);
    setProfiles(profileData);
    setProfileRoles(profileRoleData);
    setUserProfiles(userProfileData);

    setSelectedCompanyId((currentCompanyId) => {
      const currentCompanyStillExists = companyData.some(
        (company) =>
          company.CompanyId === currentCompanyId,
      );

      if (currentCompanyStillExists) {
        return currentCompanyId;
      }

      return (
        companyData.find((company) => company.IsActive)
          ?.CompanyId ??
        companyData[0]?.CompanyId ??
        0
      );
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPage() {
      try {
        const user =
          await apiRequest<CurrentUser>("/auth/me");

        if (!isActive) {
          return;
        }

        setCurrentUser(user);

        if (user.IsSuperAdmin) {
          await loadManagementData();
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Yetkilendirme bilgileri yüklenemedi.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isActive = false;
    };
  }, [loadManagementData]);

  const companyRoles = roles.filter(
    (role) => role.CompanyId === selectedCompanyId,
  );

  const companyProfiles = profiles.filter(
    (profile) =>
      profile.CompanyId === selectedCompanyId,
  );

  const companyUsers = users.filter(
    (user) =>
      user.CompanyId === selectedCompanyId &&
      !user.IsSuperAdmin,
  );

    const effectiveSelectedProfileId =
    companyProfiles.some(
      (profile) =>
        profile.ProfileId === selectedProfileId,
    )
      ? selectedProfileId
      : companyProfiles[0]?.ProfileId ?? 0;

  const selectedProfile =
    companyProfiles.find(
      (profile) =>
        profile.ProfileId ===
        effectiveSelectedProfileId,
    ) ?? null;

  function getCompanyName(companyId: number) {
    return (
      companies.find(
        (company) => company.CompanyId === companyId,
      )?.CompanyName ?? `Firma #${companyId}`
    );
  }

  async function refreshAfterRecordChange(
    message: string,
  ) {
    await loadManagementData();
    setError(null);
    setNotice(message);
  }

  async function handleDeleteRole(role: Role) {
    const confirmed = window.confirm(
      `"${role.RoleName}" rolünü silmek istediğinizden emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyKey(`delete-role-${role.RoleId}`);
    setError(null);
    setNotice(null);

    try {
      await apiRequest<void>(
        `/roles/${role.RoleId}`,
        {
          method: "DELETE",
        },
      );

      await refreshAfterRecordChange(
        "Rol başarıyla silindi.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Rol silinemedi.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteProfile(
    profile: Profile,
  ) {
    const confirmed = window.confirm(
      `"${profile.ProfileName}" profilini silmek istediğinizden emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyKey(
      `delete-profile-${profile.ProfileId}`,
    );
    setError(null);
    setNotice(null);

    try {
      await apiRequest<void>(
        `/profiles/${profile.ProfileId}`,
        {
          method: "DELETE",
        },
      );

      await refreshAfterRecordChange(
        "Profil başarıyla silindi.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Profil silinemedi.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRoleAssignment(
    role: Role,
  ) {
    if (!selectedProfile) {
      return;
    }

    const relation = profileRoles.find(
      (item) =>
        item.ProfileId === selectedProfile.ProfileId &&
        item.RoleId === role.RoleId,
    );

    const operationKey =
      `profile-${selectedProfile.ProfileId}-role-${role.RoleId}`;

    setBusyKey(operationKey);
    setError(null);
    setNotice(null);

    try {
      if (relation) {
        await apiRequest<{ message: string }>(
          `/profile-roles/${relation.ProfileRoleId}`,
          {
            method: "DELETE",
          },
        );

        setProfileRoles((currentRelations) =>
          currentRelations.filter(
            (item) =>
              item.ProfileRoleId !==
              relation.ProfileRoleId,
          ),
        );

        setNotice("Rol profilden çıkarıldı.");
      } else {
        const createdRelation =
          await apiRequest<ProfileRole>(
            "/profile-roles/",
            {
              method: "POST",
              body: JSON.stringify({
                ProfileId:
                  selectedProfile.ProfileId,
                RoleId: role.RoleId,
              }),
            },
          );

        setProfileRoles((currentRelations) => [
          ...currentRelations,
          createdRelation,
        ]);

        setNotice("Rol profile eklendi.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Rol ataması değiştirilemedi.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUserAssignment(
    user: User,
  ) {
    if (!selectedProfile) {
      return;
    }

    const relation = userProfiles.find(
      (item) =>
        item.UserId === user.UserId &&
        item.ProfileId ===
          selectedProfile.ProfileId,
    );

    const operationKey =
      `user-${user.UserId}-profile-${selectedProfile.ProfileId}`;

    setBusyKey(operationKey);
    setError(null);
    setNotice(null);

    try {
      if (relation) {
        await apiRequest<{ message: string }>(
          `/user-profiles/${relation.UserProfileId}`,
          {
            method: "DELETE",
          },
        );

        setUserProfiles((currentRelations) =>
          currentRelations.filter(
            (item) =>
              item.UserProfileId !==
              relation.UserProfileId,
          ),
        );

        setNotice(
          "Profil kullanıcıdan çıkarıldı.",
        );
      } else {
        const createdRelation =
          await apiRequest<UserProfile>(
            "/user-profiles/",
            {
              method: "POST",
              body: JSON.stringify({
                UserId: user.UserId,
                ProfileId:
                  selectedProfile.ProfileId,
              }),
            },
          );

        setUserProfiles((currentRelations) => [
          ...currentRelations,
          createdRelation,
        ]);

        setNotice("Profil kullanıcıya atandı.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kullanıcı profil ataması değiştirilemedi.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 lg:px-6 lg:py-7">
        <div className="mx-auto max-w-[1440px] rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
          Yetkilendirme bilgileri yükleniyor...
        </div>
      </main>
    );
  }

  if (!currentUser?.IsSuperAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 lg:px-6 lg:py-7">
        <div
          role="alert"
          className="mx-auto max-w-[900px] rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-danger"
        >
          <h1 className="text-xl font-semibold">
            Bu sayfaya erişim yetkiniz bulunmuyor
          </h1>

          <p className="mt-2 text-sm">
            Rol ve profil yönetimi yalnızca süper
            yöneticiler tarafından kullanılabilir.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 lg:px-6 lg:py-7">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Sistem yönetimi
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground lg:text-3xl">
            Rol ve Profil Yönetimi
          </h1>

          <p className="mt-2 text-sm text-text-muted lg:text-base">
            Firmalara ait rolleri, profilleri ve kullanıcı
            yetkilendirmelerini yönetin.
          </p>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-success">
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-5">
          <label
            htmlFor="authorization-company"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Yönetilecek firma
          </label>

          <select
            id="authorization-company"
            value={selectedCompanyId}
            onChange={(event) => {
              setSelectedCompanyId(
                Number(event.target.value),
              );
              setSelectedProfileId(0);
              setNotice(null);
              setError(null);
            }}
            className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            {companies.map((company) => (
              <option
                key={company.CompanyId}
                value={company.CompanyId}
              >
                {company.CompanyCode} —{" "}
                {company.CompanyName}
                {company.IsActive ? "" : " (Pasif)"}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-app-border bg-surface px-5 py-4">
            <p className="text-sm text-text-muted">
              Firma
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {selectedCompanyId
                ? getCompanyName(selectedCompanyId)
                : "Firma seçilmedi"}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-primary-soft px-5 py-4">
            <p className="text-sm text-primary">
              Rol sayısı
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-dark">
              {companyRoles.length}
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm text-success">
              Profil sayısı
            </p>
            <p className="mt-2 text-2xl font-semibold text-success">
              {companyProfiles.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-app-border bg-surface">
            <header className="flex items-center justify-between gap-4 border-b border-app-border px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Roller
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Tekil uygulama izinleri
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalState({
                    kind: "role",
                    record: null,
                  })
                }
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                + Yeni Rol
              </button>
            </header>

            {companyRoles.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-text-muted">
                Bu firmaya ait rol bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-app-border">
                {companyRoles.map((role) => (
                  <article
                    key={role.RoleId}
                    className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {role.RoleName}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        {role.Description ??
                          "Açıklama bulunmuyor."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalState({
                            kind: "role",
                            record: role,
                          })
                        }
                        className="rounded-md border border-app-border px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
                      >
                        Düzenle
                      </button>

                      <button
                        type="button"
                        disabled={
                          busyKey ===
                          `delete-role-${role.RoleId}`
                        }
                        onClick={() =>
                          handleDeleteRole(role)
                        }
                        className="rounded-md border border-app-border px-3 py-2 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-app-border bg-surface">
            <header className="flex items-center justify-between gap-4 border-b border-app-border px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Profiller
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Rol ve kullanıcı grupları
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalState({
                    kind: "profile",
                    record: null,
                  })
                }
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                + Yeni Profil
              </button>
            </header>

            {companyProfiles.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-text-muted">
                Bu firmaya ait profil bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-app-border">
                {companyProfiles.map((profile) => {
                const isSelected =
                    profile.ProfileId ===
                    effectiveSelectedProfileId;

                  return (
                    <article
                      key={profile.ProfileId}
                      className={`px-5 py-4 transition ${
                        isSelected
                          ? "bg-primary-soft"
                          : "hover:bg-surface-muted/60"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProfileId(
                              profile.ProfileId,
                            )
                          }
                          className="text-left"
                        >
                          <p className="font-semibold text-foreground">
                            {profile.ProfileName}
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            {profile.Description ??
                              "Açıklama bulunmuyor."}
                          </p>
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setModalState({
                                kind: "profile",
                                record: profile,
                              })
                            }
                            className="rounded-md border border-app-border bg-surface px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={
                              busyKey ===
                              `delete-profile-${profile.ProfileId}`
                            }
                            onClick={() =>
                              handleDeleteProfile(profile)
                            }
                            className="rounded-md border border-app-border bg-surface px-3 py-2 text-sm font-semibold text-danger transition hover:border-danger disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-app-border bg-surface">
          <header className="border-b border-app-border px-5 py-4">
            <h2 className="text-xl font-semibold text-foreground">
              Profil Atamaları
            </h2>

            <p className="mt-1 text-sm text-text-muted">
              {selectedProfile
                ? `${selectedProfile.ProfileName} profili için rol ve kullanıcı bağlantılarını yönetin.`
                : "Atamaları yönetmek için bir profil seçin."}
            </p>
          </header>

          {!selectedProfile ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted">
              Bu firmada seçilebilecek bir profil bulunmuyor.
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="border-b border-app-border p-5 lg:border-b-0 lg:border-r">
                <h3 className="font-semibold text-foreground">
                  Profile Bağlı Roller
                </h3>

                <div className="mt-4 space-y-3">
                  {companyRoles.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      Atanabilecek rol bulunmuyor.
                    </p>
                  ) : (
                    companyRoles.map((role) => {
                      const isAssigned =
                        profileRoles.some(
                          (item) =>
                            item.ProfileId ===
                              selectedProfile.ProfileId &&
                            item.RoleId === role.RoleId,
                        );

                      const operationKey =
                        `profile-${selectedProfile.ProfileId}-role-${role.RoleId}`;

                      return (
                        <button
                          key={role.RoleId}
                          type="button"
                          disabled={
                            busyKey === operationKey
                          }
                          onClick={() =>
                            handleRoleAssignment(role)
                          }
                          className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition ${
                            isAssigned
                              ? "border-primary bg-primary-soft text-primary-dark"
                              : "border-app-border text-text-muted hover:border-primary"
                          } disabled:opacity-50`}
                        >
                          <span className="font-semibold">
                            {role.RoleName}
                          </span>

                          <span>
                            {isAssigned
                              ? "Atandı"
                              : "Ata"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-foreground">
                  Profile Bağlı Kullanıcılar
                </h3>

                <div className="mt-4 space-y-3">
                  {companyUsers.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      Bu firmada kullanıcı bulunmuyor.
                    </p>
                  ) : (
                    companyUsers.map((user) => {
                      const isAssigned =
                        userProfiles.some(
                          (item) =>
                            item.UserId === user.UserId &&
                            item.ProfileId ===
                              selectedProfile.ProfileId,
                        );

                      const operationKey =
                        `user-${user.UserId}-profile-${selectedProfile.ProfileId}`;

                      return (
                        <button
                          key={user.UserId}
                          type="button"
                          disabled={
                            !user.IsActive ||
                            busyKey === operationKey
                          }
                          onClick={() =>
                            handleUserAssignment(user)
                          }
                          className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition ${
                            isAssigned
                              ? "border-green-300 bg-green-50 text-success"
                              : "border-app-border text-text-muted hover:border-primary"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <span>
                            <span className="block font-semibold text-foreground">
                              {user.UserName}
                            </span>
                            <span className="mt-1 block text-xs">
                              {user.IsActive
                                ? "Aktif kullanıcı"
                                : "Pasif kullanıcı"}
                            </span>
                          </span>

                          <span>
                            {isAssigned
                              ? "Atandı"
                              : "Ata"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </section>

      {modalState && (
        <AuthorizationRecordModal
          key={
            modalState.record
              ? "RoleId" in modalState.record
                ? `role-${modalState.record.RoleId}`
                : `profile-${modalState.record.ProfileId}`
              : `new-${modalState.kind}-${selectedCompanyId}`
          }
          kind={modalState.kind}
          record={modalState.record}
          companies={companies}
          onClose={() => setModalState(null)}
          onSaved={() =>
            refreshAfterRecordChange(
              modalState.record
                ? "Kayıt başarıyla güncellendi."
                : "Yeni kayıt başarıyla oluşturuldu.",
            )
          }
        />
      )}
    </main>
  );
}