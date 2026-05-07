export type DonationMapStatus = "available" | "claimed";

export type DonationMapContext = "receiver" | "donatur" | "admin" | "public";

export type DonationMapFilters = {
  category_id: string;
  status: DonationMapStatus;
  q: string;
  context?: DonationMapContext;
};

export type DonationMapFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: number;
    title: string;
    description?: string | null;
    category_id?: number | null;
    category: string;
    portion: number;
    status: DonationMapStatus;
    expired_at: string | null;
    available_from?: string | null;
    thumbnail_url: string | null;
    donor_name: string;
    donor_city?: string | null;
    address?: string | null;
    detail_url: string;
  };
};

export type DonationMapFeatureCollection = {
  type: "FeatureCollection";
  features: DonationMapFeature[];
  meta?: {
    total_approved: number;
    without_coords: number;
  };
};
