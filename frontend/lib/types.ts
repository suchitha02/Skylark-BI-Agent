// Mirrors backend/src/types.ts AgentResponse shape returned by POST /api/query
export interface AgentResponse {
  answer: string;
  metrics?: Record<string, any>;
  insights: string[];
  risks: string[];
  dataQualityCaveats: string[];
  sources: string[];
}
