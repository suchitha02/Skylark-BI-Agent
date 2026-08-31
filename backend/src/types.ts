// Monday.com API response types
export interface MondayBoardItem {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    type: string;
    text?: string;
    value?: string;
    additional_info?: {
      currencyCode?: string;
    };
  }>;
}

export interface MondayBoardResponse {
  data: {
    boards: Array<{
      items: MondayBoardItem[];
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

export interface AgentResponse {
  answer: string;
  metrics?: Record<string, any>;
  insights: string[];
  risks: string[];
  dataQualityCaveats: string[];
  sources: string[];
}
