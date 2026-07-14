"use client";

import dynamic from "next/dynamic";

const CrystalCursorDemo = dynamic(
  () => import("@/src/components/ui/demo"),
  { ssr: false }
);

export default function CrystalCursorPage() {
  return <CrystalCursorDemo />;
}
