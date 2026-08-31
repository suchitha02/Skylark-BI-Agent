// Mirrors backend/src/types.ts AgentResponse shape returned by POST /api/query
export interface ChartSeries {
  type: 'bar' | 'pie';
  title: string;
  data: Array<{ name: string; value: number }>;
}

export interface AgentResponse {
  answer: string;
  metrics?: Record<string, any>;
  insights: string[];
  risks: string[];
  dataQualityCaveats: string[];
  sources: string[];
  charts?: ChartSeries[];
  followUpQuestions?: string[];
}
