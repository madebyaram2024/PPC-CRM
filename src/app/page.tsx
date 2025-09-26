"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, FileText, Clock } from "lucide-react";
import { DashboardMetricCard } from "@/components/dashboard-metric-card";
import { RecentActivities } from "@/components/recent-activities";
import { DashboardSkeleton } from "@/components/skeleton-loading";
import { ErrorBoundary } from "@/components/error-boundary";
import { withRetry } from "@/lib/retry";
import { useUser } from "@/contexts/user-context";

interface DashboardData {
  totalCustomers: number;
  newProspects: number;
  pendingInvoices: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    user: {
      name: string | null;
    };
    customer?: {
      name: string;
    };
  }>;
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await withRetry(() => fetch("/api/dashboard"));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please check your internet connection and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Data Available</h2>
          <p className="text-muted-foreground">
            Dashboard data could not be loaded. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your business management dashboard
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Customers"
          value={data.totalCustomers}
          description="Active customers"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardMetricCard
          title="New Prospects"
          value={data.newProspects}
          description="Potential customers"
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardMetricCard
          title="Pending Invoices"
          value={data.pendingInvoices}
          description="Awaiting payment"
          icon={FileText}
          trend={{ value: 3, isPositive: false }}
        />
        <DashboardMetricCard
          title="Recent Activities"
          value={data.recentActivities.length}
          description="Last 24 hours"
          icon={Clock}
        />
      </div>

      <RecentActivities activities={data.recentActivities} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}