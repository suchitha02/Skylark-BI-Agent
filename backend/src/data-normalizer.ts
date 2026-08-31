import { Deal, WorkOrder, MondayBoardItem, DataQualityReport } from './types';

const MISSING_VALUE_PATTERNS = ['', 'N/A', 'NA', 'null', 'none', 'unknown', '-', '?'];

export class DataNormalizer {
  /**
   * Check if a value represents a missing/null value
   */
  static isMissing(value: string | null | undefined): boolean {
    if (!value) return true;
    const normalized = value.toString().trim().toLowerCase();
    return MISSING_VALUE_PATTERNS.includes(normalized);
  }

  /**
   * Safe parse currency value (e.g., "₹8,50,000" or "$850000")
   */
  static parseCurrency(value: string | null | undefined): number | null {
    if (this.isMissing(value)) return null;
    
    try {
      // Remove currency symbols, commas, spaces
      const cleaned = (value || '')
        .replace(/[₹$€£¥]/g, '')
        .replace(/,/g, '')
        .trim();
      
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    } catch {
      return null;
    }
  }

  /**
   * Normalize text field (trim, lowercase for comparison, consistent casing)
   */
  static normalizeText(value: string | null | undefined): string | null {
    if (this.isMissing(value)) return null;
    return (value || '').trim();
  }

  /**
   * Normalize sector names to consistent values
   */
  static normalizeSector(value: string | null | undefined): string | null {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;

    const lower = normalized.toLowerCase();
    
    // Common sector aliases
    const sectorMap: Record<string, string> = {
      'energy': 'Energy',
      'infrastructure': 'Infrastructure',
      'drone': 'Drone',
      'surveillance': 'Surveillance',
      'delivery': 'Delivery',
      'agriculture': 'Agriculture',
      'construction': 'Construction',
      'mapping': 'Mapping',
    };

    for (const [key, canonical] of Object.entries(sectorMap)) {
      if (lower.includes(key)) {
        return canonical;
      }
    }

    return normalized;
  }

  /**
   * Normalize date from various formats
   */
  static parseDate(value: string | null | undefined): Date | null {
    if (this.isMissing(value)) return null;

    const cleaned = (value || '').trim();
    
    try {
      // Try ISO format first
      const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const date = new Date(isoMatch[0]);
        if (!isNaN(date.getTime())) return date;
      }

      // Try DD/MM/YYYY format
      const ddmmMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (ddmmMatch) {
        const [, day, month, year] = ddmmMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) return date;
      }

      // Try MMM DD, YYYY format
      const mmmMatch = cleaned.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (mmmMatch) {
        const date = new Date(mmmMatch[0]);
        if (!isNaN(date.getTime())) return date;
      }

      // Try JS date parser as fallback
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) return date;
    } catch {
      // Fall through to null
    }

    return null;
  }

  /**
   * Normalize status field
   */
  static normalizeStatus(value: string | null | undefined): string | null {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;

    const lower = normalized.toLowerCase();
    
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'prospecting': 'Prospecting',
      'negotiation': 'Negotiation',
      'won': 'Won',
      'lost': 'Lost',
      'closed': 'Closed',
      'active': 'Active',
      'completed': 'Completed',
      'delayed': 'Delayed',
      'on hold': 'On Hold',
      'pending': 'Pending',
      'in progress': 'In Progress',
    };

    for (const [key, canonical] of Object.entries(statusMap)) {
      if (lower.includes(key)) {
        return canonical;
      }
    }

    return normalized;
  }

  /**
   * Normalize customer name for cross-board matching
   */
  static normalizeCustomerName(value: string | null | undefined): string | null {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;

    // Remove common suffixes
    return normalized
      .replace(/\s+(inc|ltd|llc|corp|pvt)\s*\.?$/i, '')
      .replace(/\s+(pvt\.?\s*ltd|ltd\.)/i, '')
      .trim();
  }

  /**
   * Normalize a Work Order item from Monday.com
   */
  static normalizeWorkOrder(item: MondayBoardItem): WorkOrder | null {
    try {
      const qualityFlags: string[] = [];

      // Build a map of column values for easy access
      const columnMap: Record<string, string | null> = {};
      item.column_values.forEach(cv => {
        columnMap[cv.id] = cv.text || cv.value || null;
      });

      // Extract fields (column IDs may vary, try common patterns)
      const name = item.name;
      const customer = this.normalizeCustomerName(
        columnMap['customer'] || columnMap['name'] || name
      );
      const status = this.normalizeStatus(columnMap['status']);
      const sector = this.normalizeSector(columnMap['sector'] || columnMap['industry']);
      const startDate = this.parseDate(columnMap['start_date'] || columnMap['date1']);
      const endDate = this.parseDate(columnMap['end_date'] || columnMap['date2']);
      const completionDate = this.parseDate(columnMap['completion_date'] || columnMap['completed_at']);

      if (!customer) qualityFlags.push('missing_customer');
      if (!status) qualityFlags.push('missing_status');
      if (!sector) qualityFlags.push('missing_sector');
      if (!startDate) qualityFlags.push('missing_start_date');

      return {
        id: item.id,
        customer: customer || 'Unknown',
        sector: sector || 'Unknown',
        projectName: name,
        status: status || 'Unknown',
        startDate,
        endDate,
        completionDate,
        rawData: columnMap,
        qualityFlags,
      };
    } catch (error) {
      console.error('Failed to normalize work order:', error);
      return null;
    }
  }

  /**
   * Normalize a Deal item from Monday.com
   */
  static normalizeDeal(item: MondayBoardItem): Deal | null {
    try {
      const qualityFlags: string[] = [];

      const columnMap: Record<string, string | null> = {};
      item.column_values.forEach(cv => {
        columnMap[cv.id] = cv.text || cv.value || null;
      });

      const name = item.name;
      const customer = this.normalizeCustomerName(
        columnMap['customer'] || columnMap['name'] || name
      );
      const sector = this.normalizeSector(columnMap['sector'] || columnMap['industry']);
      const valueStr = columnMap['value'] || columnMap['amount'] || columnMap['deal_value'];
      const value = this.parseCurrency(valueStr);
      const stage = this.normalizeStatus(columnMap['stage'] || columnMap['status']);
      const expectedClose = this.parseDate(columnMap['expected_close'] || columnMap['close_date']);
      const createdDate = this.parseDate(columnMap['created'] || columnMap['created_at']);

      if (!customer) qualityFlags.push('missing_customer');
      if (value === null) qualityFlags.push('missing_value');
      if (!stage) qualityFlags.push('missing_stage');
      if (!expectedClose) qualityFlags.push('missing_close_date');

      return {
        id: item.id,
        customer: customer || 'Unknown',
        sector: sector || 'Unknown',
        value: value || 0,
        stage: stage || 'Unknown',
        expectedClose,
        createdDate,
        rawData: columnMap,
        qualityFlags,
      };
    } catch (error) {
      console.error('Failed to normalize deal:', error);
      return null;
    }
  }

  /**
   * Generate data quality report
   */
  static generateQualityReport(
    deals: Deal[],
    workOrders: WorkOrder[]
  ): DataQualityReport {
    const totalRecords = deals.length + workOrders.length;
    const invalidDeals = deals.filter(d => d.qualityFlags.length > 0).length;
    const invalidWorkOrders = workOrders.filter(wo => wo.qualityFlags.length > 0).length;
    const invalidRecords = invalidDeals + invalidWorkOrders;

    let missingDateCount = 0;
    let missingValueCount = 0;

    deals.forEach(d => {
      if (!d.expectedClose) missingDateCount++;
      if (d.value === 0) missingValueCount++;
    });

    workOrders.forEach(wo => {
      if (!wo.startDate) missingDateCount++;
      if (!wo.completionDate && wo.status === 'Completed') missingDateCount++;
    });

    const notes: string[] = [];
    if (invalidRecords > 0) {
      notes.push(`${invalidRecords} records have missing or inconsistent fields.`);
    }
    if (missingValueCount > 0) {
      notes.push(`${missingValueCount} deals have missing values (excluded from pipeline calculations).`);
    }
    if (missingDateCount > 0) {
      notes.push(`${missingDateCount} records have missing dates.`);
    }

    return {
      totalRecords,
      validRecords: totalRecords - invalidRecords,
      invalidRecords,
      missingDateCount,
      missingValueCount,
      textNormalizationIssues: 0,
      notes,
    };
  }
}
