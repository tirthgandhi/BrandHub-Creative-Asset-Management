import { api } from "./api";

export type DashboardStats = {
  role: "super_admin" | "project_manager" | "designer" | "client";
  metrics: {
    projects: number;
    media: number;
    assets: Record<"draft" | "in_review" | "changes_requested" | "approved", number>;
    requests: Record<"pending" | "processing" | "approved" | "rejected" | "cancelled", number>;
    pendingReviews: number;
    activeUsers?: number;
    clientsWithoutProject?: number;
    requiringAction?: number;
  };
  analytics: { projectStatuses: Record<"active" | "on_hold" | "completed" | "archived", number>; workload: Array<{ id: string; name: string; projects: number }> };
  recentActivity: Array<{ id: string; type: string; description: string; at: string; href: string }>;
};

export async function getDashboardStats() { return (await api.get<{ data: DashboardStats }>("/dashboard/stats")).data.data; }
