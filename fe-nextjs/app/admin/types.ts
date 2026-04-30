export type DashboardSummaryResponse = {
  message: string;
  data: {
    kpis: {
      total_donations: number;
      completion_rate: number;
      total_portions: number;
      avg_claim_minutes: number;
    };
    activity_feed: Array<{
      id: number;
      action: string;
      entity_type: string;
      entity_id: number | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>;
  };
};

export type UsersResponse = {
  message: string;
  data: {
    data: Array<{
      id: number;
      name: string;
      email: string;
      role: "donatur" | "penerima" | "admin";
      is_admin: boolean;
      is_active: boolean;
      city?: string | null;
      created_at: string;
    }>;
  };
};
