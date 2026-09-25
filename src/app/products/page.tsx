import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="boot-loading">Loading your workspace...</div>}>
      <Dashboard />
    </Suspense>
  );
}
