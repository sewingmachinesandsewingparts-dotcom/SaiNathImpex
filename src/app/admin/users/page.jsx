"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { AdminShell } from "@/src/components/admin-shell";

function isAdminAuth(user) {
  return Boolean(user && ["admin", "superadmin"].includes(user.role));
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const auth = await axios.get("/api/auth");
        const user = auth.data?.user;

        if (!user) {
          throw new Error("You must sign in as an admin or superadmin to view this page.");
        }

        if (!isAdminAuth(user)) {
          throw new Error("Only admin or superadmin accounts can access this page.");
        }

        const res = await axios.get("/api/admin/users");
        if (isMounted) {
          setUsers(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load admin users:", err);
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || "Unable to load users.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminShell title="Users" subtitle="Manage user accounts">
      {loading ? (
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading users...
        </div>
      ) : error ? (
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-destructive">
          {error}
        </div>
      ) : (
        <div className="hairline bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3">User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-6 py-3 font-medium">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-ink grid place-items-center text-[10px] text-bone">
                          {u.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <div>{u.name}</div>
                        <div className="text-[11px] text-muted-foreground">{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded ${
                        u.role === "superadmin"
                          ? "bg-copper text-copper-foreground"
                          : u.role === "admin"
                          ? "bg-secondary"
                          : "bg-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`font-mono text-[10px] uppercase px-2 py-1 rounded ${u.status === "blocked" ? "bg-destructive text-destructive-foreground" : "bg-success text-bone"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{u.joined ? new Date(u.joined).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-3 text-right pr-6">
                    <Link href={`/admin/users/${u.id}`} className="font-mono text-[11px] uppercase tracking-[0.18em] text-copper hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
