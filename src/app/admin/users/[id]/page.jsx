"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AdminShell } from "@/src/components/admin-shell";
import { Shield, User, CheckCircle, XCircle, Settings, Activity, ClipboardList } from "lucide-react";

const PERMISSION_LABELS = {
  dashboard: "Dashboard",
  users: "Users",
  products: "Products",
  settings: "Settings",
  support: "Support",
  analytics: "Analytics",
  orders: "Orders",
  sales: "Sales",
};

export default function AdminUserDetail({ params }) {
  const userId = params?.id;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [permissionsDraft, setPermissionsDraft] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`/api/admin/users/${encodeURIComponent(userId)}`)
      .then((res) => setUserData(res.data))
      .catch((err) => {
        console.error("Failed to load user detail:", err);
        setError(err?.response?.data?.message || "Unable to load user details.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    setPermissionsDraft(userData?.user?.permissions || []);
  }, [userData?.user?.permissions]);

  const updateUser = async (payload) => {
    try {
      setStatusMessage("Saving...");
      await axios.post("/api/admin/users", payload);
      setStatusMessage("Saved successfully.");
      await axios
        .get(`/api/admin/users/${encodeURIComponent(userId)}`)
        .then((res) => setUserData(res.data))
        .catch(() => {});
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setTimeout(() => setStatusMessage(""), 2500);
    }
  };

  if (loading) {
    return (
      <AdminShell title="User details" subtitle="Loading user data…">
        <div className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-20">
          Loading user details...
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="User details" subtitle="Unable to load user.">
        <div className="text-center font-mono text-xs uppercase tracking-widest text-destructive py-20">
          {error}
        </div>
      </AdminShell>
    );
  }

  const { user, orders, currentUser } = userData || {};
  const canEditPermissions = currentUser?.role === "superadmin";
  const canEditStatus = ["admin", "superadmin"].includes(currentUser?.role);
  const canEditRole = currentUser?.role === "superadmin";
  const targetCanHavePermissions = ["admin", "superadmin"].includes(user?.role);

  const handleStatusToggle = () => {
    updateUser({ email: user.email, action: "status", status: user.status === "blocked" ? "active" : "blocked" });
  };

  const handleRoleChange = (role) => {
    updateUser({ email: user.email, action: "role", role });
  };

  const handlePermissionToggle = (permission) => {
    setPermissionsDraft((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const handlePermissionsSave = () => {
    if (!user?.email) return;
    updateUser({ email: user.email, action: "permissions", permissions: permissionsDraft });
  };

  return (
    <AdminShell title="User details" subtitle={`Review ${user?.name || "user"}'s account`}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="hairline bg-card p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-ink grid place-items-center text-3xl text-bone">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase() || <User className="h-10 w-10" />
                )}
              </div>
              <div>
                <div className="text-3xl font-display">{user.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 bg-secondary rounded">
                    {user.role}
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded ${user.status === "blocked" ? "bg-destructive text-destructive-foreground" : "bg-success text-bone"}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="border border-border rounded p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Joined</div>
                <div className="mt-2 text-sm">{user.joined ? new Date(user.joined).toLocaleDateString() : "—"}</div>
              </div>
              <div className="border border-border rounded p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Last updated</div>
                <div className="mt-2 text-sm">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          </section>

          <section className="hairline bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="font-display text-xl">Account activity</div>
                <div className="text-sm text-muted-foreground">Recent actions and updates for this user account.</div>
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Total {user.activity?.length || 0}</div>
            </div>
            {user.activity?.length ? (
              <div className="space-y-3">
                {user.activity.slice(0, 8).map((entry, index) => (
                  <div key={`${entry.action}-${index}`} className="border border-border rounded p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Activity className="h-4 w-4 text-copper" />
                      <span>{entry.action.replace(/_/g, " ")}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{entry.details}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No account activity is available for this user.</div>
            )}
          </section>

          <section className="hairline bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList className="h-4 w-4 text-copper" />
              <div className="font-display text-xl">Order history</div>
            </div>
            {orders?.length ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded p-4">
                    <div className="flex items-center justify-between gap-3 text-sm font-medium">
                      <div>{order.id}</div>
                      <div className="text-muted-foreground">{order.status}</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {order.itemsCount} items · ₹{order.total.toFixed(2)}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {order.placedAt}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">This user has no completed orders.</div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="hairline bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-4 w-4 text-copper" />
              <div>
                <div className="font-display text-xl">Admin controls</div>
                <div className="text-sm text-muted-foreground">Manage role, status and permissions.</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                <button
                  disabled={!canEditStatus}
                  onClick={handleStatusToggle}
                  className="mt-2 w-full rounded-full border border-border bg-ink px-4 py-3 text-sm font-medium text-bone hover:border-copper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {user.status === "blocked" ? "Unblock user" : "Block user"}
                </button>
              </div>

              {canEditRole && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Role</div>
                  <div className="mt-2 grid gap-2">
                    {[
                      { value: "user", label: "User" },
                      { value: "admin", label: "Admin" },
                      { value: "superadmin", label: "Superadmin" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleRoleChange(option.value)}
                        className={`w-full rounded-full border px-4 py-3 text-sm font-medium text-left ${user.role === option.value ? "bg-copper text-copper-foreground" : "bg-ink text-bone hover:border-copper"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canEditPermissions && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Permissions</div>
                  {!targetCanHavePermissions ? (
                    <div className="mt-3 rounded border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                      Permissions are only assignable to admin accounts. Change the user role to Admin or Superadmin to grant module access.
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                          const enabled = permissionsDraft.includes(key);

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handlePermissionToggle(key)}
                              className={`rounded-full border px-3 py-2 text-left text-sm font-medium ${enabled ? "border-copper bg-copper text-copper-foreground" : "border-border bg-ink text-bone hover:border-copper"}`}
                            >
                              {enabled ? "✓" : "○"} {label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handlePermissionsSave}
                          className="flex-1 rounded-full bg-copper px-4 py-3 text-sm font-medium text-copper-foreground hover:bg-copper/90"
                        >
                          Save permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermissionsDraft(user.permissions || [])}
                          className="rounded-full border border-border bg-ink px-4 py-3 text-sm font-medium text-bone hover:border-copper"
                        >
                          Reset
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {statusMessage && (
                <div className="rounded border border-copper/50 bg-copper/5 p-3 text-sm text-copper">{statusMessage}</div>
              )}
            </div>
          </section>

          <section className="hairline bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-4 w-4 text-copper" />
              <div>
                <div className="font-display text-xl">Requester identity</div>
                <div className="text-sm text-muted-foreground">Your admin account</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              You are signed in as {currentUser?.id} ({currentUser?.role}).
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
