"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterCategories = [
  { name: "Needles", slug: "needles" },
  { name: "Bobbins", slug: "bobbins" },
  { name: "Feed systems", slug: "feed-systems" },
];

export default function AdminCategoriesPage() {
  const [categories] = useState(starterCategories);

  return (
    <AdminPageFrame title="Categories" subtitle="Category management panel">
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.slug} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{category.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Slug: {category.slug}</p>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
