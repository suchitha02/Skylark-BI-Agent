// Monday.com API response types
export interface MondayBoardItem {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    type: string;
    text?: string;
    value?: string;
  }>;
}

export interface MondayColumn {
  id: string;
  title: string;
}

export interface MondayBoardResponse {
  data: {
    boards: Array<{
      columns: MondayColumn[];
      items_page: {
        cursor: string | null;
        items: MondayBoardItem[];
      };
    }>;
  };
}

// Normalized internal data types
export interface Deal {
  id: string;
  customer: string;
  sector: string;
  value: number;
  stage: string;
  expectedClose: Date | null;
  createdDate: Date | null;
  rawData: Record<string, any>;
  qualityFlags: string[];
}

export interface WorkOrder {
  id: string;
  customer: string;
  sector: string;
  projectName: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  completionDate: Date | null;
  rawData: Record<string, any>;
  qualityFlags: string[];
}

// Business metrics
export interface PipelineMetrics {
  totalValue: number;
  dealCount: number;
  byStage: Record<string, { count: number; value: number }>;
  bySector: Record<string, { count: number; value: number }>;
  byCustomer: Record<string, { count: number; value: number }>;
  topDeals: Deal[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  byCustomer: Record<string, number>;
  bySector: Record<string, number>;
  completedProjects: number;
  // The dataset has no ground-truth "revenue" field. Revenue is estimated as
  // (completed work orders) x (average value of Won deals), so this must
  // always be presented to the user as an estimate, not a measured figure.
  isEstimated: boolean;
  avgDealValueUsed: number;
}

export interface OperationalMetrics {
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  projectsByStatus: Record<string, number>;
  bySector: Record<string, { active: number; completed: number; delayed: number }>;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingDateCount: number;
  missingValueCount: number;
  textNormalizationIssues: number;
  notes: string[];
}

export interface AgentContext {
  deals: Deal[];
  workOrders: WorkOrder[];
  pipelineMetrics: PipelineMetrics | null;
  revenueMetrics: RevenueMetrics | null;
  operationalMetrics: OperationalMetrics | null;
  dataQuality: DataQualityReport;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chart-ready series computed straight from the same Analytics/context data
// used to build the tool's text answer (not parsed back out of the LLM's
// prose), so the numbers plotted always match the numbers stated.
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
