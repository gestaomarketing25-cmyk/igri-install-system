export type CableItem = { device: string; room: string };
export type AiRecommendation = {
  recommended_router_location: string;
  rationale: string;
  preferred_location: string;
  preference_conflict: string;
  preferred_height: string;
  tv_proximity_guidance: string;
  cabling_plan: Array<{ device: string; room: string; should_cable: boolean; reason: string }>;
  wifi_checks: string[];
  installer_notes: string[];
  risk_flags: string[];
};

export type Briefing = {
  id: string; protocol: string; client_name: string; phone?: string; address: string; plan: string;
  attendant_name?: string; property_type?: string; bedrooms?: string;
  environments: string[]; devices: string[]; priorities: string[]; activities: string[];
  concurrent_users?: string; router_preference?: string; cabling: CableItem[]; cable_difficulty: string[];
  iptv: Record<string, unknown>; observations?: string; internal_notes?: string;
  ai_recommendation: AiRecommendation; ai_source: string; status: string; assigned_technician?: string | null;
  created_at: string; updated_at: string;
};
