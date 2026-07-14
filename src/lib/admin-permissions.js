export const ADMIN_MODULES = [
  "dashboard",
  "users",
  "products",
  "settings",
  "support",
  "analytics",
  "orders",
  "sales",
];

export const DEFAULT_ADMIN_PERMISSIONS = [
  "dashboard",
  "users",
  "products",
  "settings",
  "support",
  "analytics",
  "orders",
];

export function normalizePermissions(permissions = []) {
  const values = Array.isArray(permissions) ? permissions : [permissions];

  return [
    ...new Set(
      values
        .map((value) =>
          String(value || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
}

export function getUserPermissions(user) {
  if (!user) return [];

  if (user.role === "superadmin") {
    return [...ADMIN_MODULES];
  }

  if (user.role === "admin") {
    return normalizePermissions(user.permissions);
  }

  return [];
}

export function canAccessAdminModule(user, module) {
  if (!module) {
    return Boolean(user && ["admin", "superadmin"].includes(user.role));
  }

  const normalizedModule = String(module).trim().toLowerCase();
  if (!normalizedModule) {
    return false;
  }

  if (user?.role === "superadmin") {
    return true;
  }

  if (user?.role !== "admin") {
    return false;
  }

  return getUserPermissions(user).includes(normalizedModule);
}

export function getPermissionLabel(moduleName) {
  const labels = {
    dashboard: "Dashboard",
    users: "Users",
    products: "Products",
    settings: "Settings",
    support: "Support",
    analytics: "Analytics",
    orders: "Orders",
    sales: "Sales",
  };

  return labels[moduleName] || moduleName;
}
