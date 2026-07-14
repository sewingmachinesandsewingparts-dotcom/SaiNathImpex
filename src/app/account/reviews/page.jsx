"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const starterReviews = [{ title: "Needle bar assembly", body: "Reliable and easy to install." }];

export default function AccountReviewsPage() {
  const [reviews] = useState(starterReviews);

  return (
    <AccountPageFrame
      title="Reviews"
      description="Customer reviews are shown here as a simple account section."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Reviews" }]}
    >
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.title} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{review.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
          </div>
        ))}
      </div>
    </AccountPageFrame>
  );
}
