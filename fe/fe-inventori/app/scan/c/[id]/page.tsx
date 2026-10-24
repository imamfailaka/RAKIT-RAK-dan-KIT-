import { Suspense } from "react";
import CategoryScanView from "@/components/CategoryScanView";
import Skeleton from "@/components/Skeleton";

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryScanView id={id} />;
}

export default function CategoryScanPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-md px-4 py-8"><Skeleton count={3} /></main>}>
      <Inner params={params} />
    </Suspense>
  );
}
