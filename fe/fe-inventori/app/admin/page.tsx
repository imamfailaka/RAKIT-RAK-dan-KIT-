"use client";

import DashboardView from "@/components/DashboardView";
import ErrorState from "@/components/ErrorState";
import SessionExpired from "@/components/SessionExpired";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { getAdminDashboard } from "@/services/dashboard";

export default function AdminHome() {
  // The timestamp is taken when the data arrives (client only), never during prerender.
  const { state, retry } = useAsync(async () => ({ data: await getAdminDashboard(), now: Date.now() }), "dashboard");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {state.status === "loading" && <Skeleton count={3} />}
      {state.status === "error" &&
        (state.error.kind === "session" ? <SessionExpired /> : <ErrorState message={state.error.message} onRetry={retry} />)}
      {state.status === "ready" && <DashboardView data={state.data.data} now={state.data.now} />}
    </div>
  );
}
