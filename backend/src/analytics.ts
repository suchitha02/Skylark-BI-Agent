import {
  Deal,
  WorkOrder,
  PipelineMetrics,
  RevenueMetrics,
  OperationalMetrics,
} from './types';

export class Analytics {
  /**
   * Calculate pipeline metrics from deals
   */
  static calculatePipeline(deals: Deal[]): PipelineMetrics {
    // Filter out deals with zero value for pipeline calculation
    const validDeals = deals.filter(d => d.value > 0);

    const byStage: Record<string, { count: number; value: number }> = {};
    const bySector: Record<string, { count: number; value: number }> = {};
    const byCustomer: Record<string, { count: number; value: number }> = {};
    let totalValue = 0;

    validDeals.forEach(deal => {
      totalValue += deal.value;

      // By stage
      if (!byStage[deal.stage]) {
        byStage[deal.stage] = { count: 0, value: 0 };
      }
      byStage[deal.stage].count++;
      byStage[deal.stage].value += deal.value;

      // By sector
      if (!bySector[deal.sector]) {
        bySector[deal.sector] = { count: 0, value: 0 };
      }
      bySector[deal.sector].count++;
      bySector[deal.sector].value += deal.value;

      // By customer
      if (!byCustomer[deal.customer]) {
        byCustomer[deal.customer] = { count: 0, value: 0 };
      }
      byCustomer[deal.customer].count++;
      byCustomer[deal.customer].value += deal.value;
    });

    // Top deals by value
    const topDeals = validDeals
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalValue,
      dealCount: validDeals.length,
      byStage,
      bySector,
      byCustomer,
      topDeals,
    };
  }

  /**
   * Calculate revenue metrics (estimated — the dataset has no ground-truth
   * revenue field on either board).
   *
   * Method: average value of "Won" deals (falling back to all valid deals if
   * there are no Won deals) is used as a per-project revenue estimate,
   * multiplied by the number of completed work orders. This ties the two
   * boards together deterministically instead of a hardcoded number, but it
   * is still an estimate and is flagged as such via `isEstimated`.
   */
  static calculateRevenue(
    deals: Deal[],
    workOrders: WorkOrder[]
  ): RevenueMetrics {
    const completedOrders = workOrders.filter(wo => wo.status === 'Completed');

    const wonDeals = deals.filter(d => d.value > 0 && d.stage === 'Won');
    const validDeals = deals.filter(d => d.value > 0);
    const basisDeals = wonDeals.length > 0 ? wonDeals : validDeals;

    const avgDealValueUsed =
      basisDeals.length > 0
        ? basisDeals.reduce((sum, d) => sum + d.value, 0) / basisDeals.length
        : 0;

    const byCustomer: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    let totalRevenue = 0;

    completedOrders.forEach(wo => {
      const revenue = avgDealValueUsed;

      totalRevenue += revenue;

      if (!byCustomer[wo.customer]) {
        byCustomer[wo.customer] = 0;
      }
      byCustomer[wo.customer] += revenue;

      if (!bySector[wo.sector]) {
        bySector[wo.sector] = 0;
      }
      bySector[wo.sector] += revenue;
    });

    return {
      totalRevenue,
      byCustomer,
      bySector,
      completedProjects: completedOrders.length,
      isEstimated: true,
      avgDealValueUsed,
    };
  }

  /**
   * Calculate operational metrics
   */
  static calculateOperational(workOrders: WorkOrder[]): OperationalMetrics {
    const projectsByStatus: Record<string, number> = {};
    const bySector: Record<
      string,
      { active: number; completed: number; delayed: number }
    > = {};

    let activeProjects = 0;
    let completedProjects = 0;
    let delayedProjects = 0;

    workOrders.forEach(wo => {
      // Count by status
      if (!projectsByStatus[wo.status]) {
        projectsByStatus[wo.status] = 0;
      }
      projectsByStatus[wo.status]++;

      // Count by sector
      if (!bySector[wo.sector]) {
        bySector[wo.sector] = { active: 0, completed: 0, delayed: 0 };
      }

      if (wo.status === 'Completed') {
        completedProjects++;
        bySector[wo.sector].completed++;
      } else if (wo.status === 'Delayed') {
        delayedProjects++;
        bySector[wo.sector].delayed++;
      } else if (wo.status === 'In Progress' || wo.status === 'Active') {
        activeProjects++;
        bySector[wo.sector].active++;
      }
    });

    return {
      activeProjects,
      completedProjects,
      delayedProjects,
      projectsByStatus,
      bySector,
    };
  }

  /**
   * Cross-board analysis: find high-value customers with poor operations
   */
  static analyzeCustomerQuality(
    deals: Deal[],
    workOrders: WorkOrder[]
  ): Array<{
    customer: string;
    pipelineValue: number;
    dealCount: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    performanceScore: number; // 0-100, higher is better
  }> {
    const pipelineMetrics = this.calculatePipeline(deals);

    const customerQuality: Record<
      string,
      {
        customer: string;
        pipelineValue: number;
        dealCount: number;
        activeProjects: number;
        completedProjects: number;
        delayedProjects: number;
      }
    > = {};

    // Build pipeline data by customer
    deals.forEach(deal => {
      if (!customerQuality[deal.customer]) {
        customerQuality[deal.customer] = {
          customer: deal.customer,
          pipelineValue: pipelineMetrics.byCustomer[deal.customer]?.value || 0,
          dealCount: pipelineMetrics.byCustomer[deal.customer]?.count || 0,
          activeProjects: 0,
          completedProjects: 0,
          delayedProjects: 0,
        };
      }
    });

    // Add operational data
    workOrders.forEach(wo => {
      if (!customerQuality[wo.customer]) {
        customerQuality[wo.customer] = {
          customer: wo.customer,
          pipelineValue: 0,
          dealCount: 0,
          activeProjects: 0,
          completedProjects: 0,
          delayedProjects: 0,
        };
      }

      if (wo.status === 'Completed') {
        customerQuality[wo.customer].completedProjects++;
      } else if (wo.status === 'Delayed') {
        customerQuality[wo.customer].delayedProjects++;
      } else {
        customerQuality[wo.customer].activeProjects++;
      }
    });

    // Calculate performance score
    return Object.values(customerQuality)
      .map(cq => {
        const totalProjects = cq.activeProjects + cq.completedProjects + cq.delayedProjects;
        let performanceScore = 100;

        if (totalProjects > 0) {
          // Penalize delayed projects
          performanceScore -= (cq.delayedProjects / totalProjects) * 50;
          // Reward completed projects
          performanceScore += (cq.completedProjects / totalProjects) * 30;
        }

        return {
          ...cq,
          performanceScore: Math.max(0, Math.min(100, performanceScore)),
        };
      })
      .sort((a, b) => b.pipelineValue - a.pipelineValue);
  }

  /**
   * Analyze sector performance
   */
  static analyzeSectorPerformance(
    deals: Deal[],
    workOrders: WorkOrder[]
  ): Array<{
    sector: string;
    pipelineValue: number;
    dealCount: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    healthScore: number; // 0-100
  }> {
    const pipelineMetrics = this.calculatePipeline(deals);
    const operationalMetrics = this.calculateOperational(workOrders);

    const sectors = new Set<string>();
    deals.forEach(d => sectors.add(d.sector));
    workOrders.forEach(wo => sectors.add(wo.sector));

    return Array.from(sectors)
      .map(sector => {
        const pipelineData = pipelineMetrics.bySector[sector] || {
          count: 0,
          value: 0,
        };
        const operationalData = operationalMetrics.bySector[sector] || {
          active: 0,
          completed: 0,
          delayed: 0,
        };

        const totalProjects =
          operationalData.active +
          operationalData.completed +
          operationalData.delayed;
        let healthScore = 50; // Start at neutral

        if (pipelineData.value > 0) {
          healthScore += 20; // Has pipeline
        }

        if (totalProjects > 0) {
          const completionRate = operationalData.completed / totalProjects;
          const delayRate = operationalData.delayed / totalProjects;
          healthScore += completionRate * 30; // Reward completion
          healthScore -= delayRate * 20; // Penalize delays
        }

        return {
          sector,
          pipelineValue: pipelineData.value,
          dealCount: pipelineData.count,
          activeProjects: operationalData.active,
          completedProjects: operationalData.completed,
          delayedProjects: operationalData.delayed,
          healthScore: Math.max(0, Math.min(100, healthScore)),
        };
      })
      .sort((a, b) => b.pipelineValue - a.pipelineValue);
  }

  /**
   * Format currency for display
   */
  static formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return `₹${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `₹${(value / 1_000).toFixed(0)}K`;
    }
    return `₹${value.toFixed(0)}`;
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
