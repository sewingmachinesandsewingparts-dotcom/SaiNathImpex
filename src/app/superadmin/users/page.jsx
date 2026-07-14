"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterUsers = [
  { name: "Ava Singh", role: "Super admin" },
  { name: "Rohan Patel", role: "Admin" },
];

export default function SuperAdminUsersPage() {
  const [users] = useState(starterUsers);

  return (
    <AdminPageFrame title="Super admin users" subtitle="Cross-store admin user management">
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.name} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{user.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user.role}</p>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
