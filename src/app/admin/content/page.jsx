"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterContent = [
  { title: "Homepage hero", status: "Published" },
  { title: "Support page CTA", status: "Draft" },
];

export default function AdminContentPage() {
  const [content] = useState(starterContent);

  return (
    <AdminPageFrame title="Content" subtitle="Content management panel">
      <div className="space-y-3">
        {content.map((item) => (
          <div key={item.title} className="hairline rounded-3xl bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl">{item.title}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
