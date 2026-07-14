"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterTasks = [
  { label: "Manage tenant access", done: true },
  { label: "Review platform logs", done: false },
];

export default function SuperAdminPage() {
  const [tasks] = useState(starterTasks);

  return (
    <AdminPageFrame title="Super admin" subtitle="Platform-level control center">
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.label} className="hairline rounded-3xl bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl">{task.label}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                {task.done ? "Done" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
