import Groq from 'groq-sdk';
import { Deal, WorkOrder, AgentContext, AgentResponse, AgentMessage } from './types';
import { Analytics } from './analytics';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export class SkylarkAgent {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  /**
   * Define available tools for the agent
   */
  private getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'get_pipeline_overview',
          description: 'Get pipeline metrics including total value, deal count by stage and sector',
          parameters: {
            type: 'object' as const,
            properties: {
              filter_sector: {
                type: 'string',
                description: 'Optional: filter pipeline by sector (e.g., Energy, Infrastructure)',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_operational_health',
          description: 'Get operational metrics from work orders including active, completed, and delayed projects',
          parameters: {
            type: 'object' as const,
            properties: {
              filter_sector: {
                type: 'string',
                description: 'Optional: filter by sector',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_sector_analysis',
          description: 'Analyze performance across all sectors including pipeline and operations',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_customer_analysis',
          description: 'Analyze customers by their pipeline value and operational performance',
          parameters: {
            type: 'object' as const,
            properties: {
              top_n: {
                type: 'number',
                description: 'Number of top customers to return (default: 10)',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_top_deals',
          description: 'Get the largest deals by value',
          parameters: {
            type: 'object' as const,
            properties: {
              count: {
                type: 'number',
                description: 'Number of top deals to return (default: 5)',
              },
              filter_sector: {
                type: 'string',
                description: 'Optional: filter by sector',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_data_quality_report',
          description: 'Get data quality metrics and issues',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_revenue_overview',
          description:
            'Get estimated revenue, since neither board has a ground-truth revenue field. ' +
            'Estimated as (completed work orders) x (average value of Won deals). Always ' +
            'present this to the user as an estimate, not a measured number.',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_leadership_update',
          description:
            'Generate a structured executive/leadership update in one call: pipeline summary, ' +
            'estimated revenue, operational health, top sectors, top risks, and data quality notes. ' +
            'Use this when the user asks for a "leadership update", "executive summary", "status update", ' +
            'or "weekly/monthly summary" instead of calling the individual metric tools separately.',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: [],
          },
        },
      },
    ];
  }

  /**
   * Execute tool calls
   */
  private executeTool(toolName: string, toolInput: Record<string, any>): string {
    try {
      switch (toolName) {
        case 'get_pipeline_overview': {
          const metrics = this.context.pipelineMetrics!;
          let result = `Total Pipeline: ${Analytics.formatCurrency(metrics.totalValue)} across ${metrics.dealCount} deals\n\n`;
          result += 'By Stage:\n';
          Object.entries(metrics.byStage).forEach(([stage, data]) => {
            result += `  ${stage}: ${data.count} deals, ${Analytics.formatCurrency(data.value)}\n`;
          });

          if (toolInput.filter_sector) {
            const sectorData = metrics.bySector[toolInput.filter_sector];
            if (sectorData) {
              result += `\n${toolInput.filter_sector}: ${sectorData.count} deals, ${Analytics.formatCurrency(sectorData.value)}\n`;
            }
          }

          return result;
        }

        case 'get_operational_health': {
          const metrics = this.context.operationalMetrics!;
          let result = `Active Projects: ${metrics.activeProjects}\n`;
          result += `Completed Projects: ${metrics.completedProjects}\n`;
          result += `Delayed Projects: ${metrics.delayedProjects}\n\n`;
          result += 'By Status:\n';
          Object.entries(metrics.projectsByStatus).forEach(([status, count]) => {
            result += `  ${status}: ${count}\n`;
          });
          return result;
        }

        case 'get_sector_analysis': {
          const analysis = Analytics.analyzeSectorPerformance(
            this.context.deals,
            this.context.workOrders
          );
          let result = 'Sector Performance Analysis:\n\n';
          analysis.slice(0, 10).forEach(sector => {
            result += `${sector.sector}:\n`;
            result += `  Pipeline: ${Analytics.formatCurrency(sector.pipelineValue)} (${sector.dealCount} deals)\n`;
            result += `  Operations: ${sector.activeProjects} active, ${sector.completedProjects} completed, ${sector.delayedProjects} delayed\n`;
            result += `  Health Score: ${sector.healthScore.toFixed(0)}/100\n\n`;
          });
          return result;
        }

        case 'get_customer_analysis': {
          const topN = toolInput.top_n || 10;
          const analysis = Analytics.analyzeCustomerQuality(
            this.context.deals,
            this.context.workOrders
          );
          let result = `Top ${topN} Customers by Pipeline Value:\n\n`;
          analysis.slice(0, topN).forEach(cust => {
            result += `${cust.customer}:\n`;
            result += `  Pipeline: ${Analytics.formatCurrency(cust.pipelineValue)} (${cust.dealCount} deals)\n`;
            result += `  Projects: ${cust.activeProjects} active, ${cust.completedProjects} completed, ${cust.delayedProjects} delayed\n`;
            result += `  Performance: ${cust.performanceScore.toFixed(0)}/100\n\n`;
          });
          return result;
        }

        case 'get_top_deals': {
          const count = toolInput.count || 5;
          const deals = this.context.deals
            .filter(d => d.value > 0)
            .filter(d => !toolInput.filter_sector || d.sector === toolInput.filter_sector)
            .sort((a, b) => b.value - a.value)
            .slice(0, count);

          let result = `Top ${count} Deals:\n\n`;
          deals.forEach((deal, i) => {
            result += `${i + 1}. ${deal.customer} - ${deal.sector}\n`;
            result += `   Value: ${Analytics.formatCurrency(deal.value)}\n`;
            result += `   Stage: ${deal.stage}\n`;
            result += `   Expected Close: ${Analytics.formatDate(deal.expectedClose)}\n\n`;
          });
          return result || 'No deals found.';
        }

        case 'get_data_quality_report': {
          const dq = this.context.dataQuality;
          let result = `Data Quality Report:\n`;
          result += `Total Records: ${dq.totalRecords}\n`;
          result += `Valid Records: ${dq.validRecords}\n`;
          result += `Issues: ${dq.invalidRecords} records with missing fields\n`;
          result += `Missing Dates: ${dq.missingDateCount}\n`;
          result += `Missing Values: ${dq.missingValueCount}\n\n`;
          if (dq.notes.length > 0) {
            result += 'Notes:\n';
            dq.notes.forEach(note => (result += `- ${note}\n`));
          }
          return result;
        }

        case 'get_revenue_overview': {
          const revenue = Analytics.calculateRevenue(this.context.deals, this.context.workOrders);
          let result = `Estimated Revenue: ${Analytics.formatCurrency(revenue.totalRevenue)} `;
          result += `(ESTIMATE ONLY — neither board has a real revenue field; `;
          result += `computed as ${revenue.completedProjects} completed work orders x avg Won deal value `;
          result += `of ${Analytics.formatCurrency(revenue.avgDealValueUsed)})\n\n`;
          result += 'By Sector:\n';
          Object.entries(revenue.bySector).forEach(([sector, value]) => {
            result += `  ${sector}: ${Analytics.formatCurrency(value)}\n`;
          });
          result += '\nBy Customer (top 5):\n';
          Object.entries(revenue.byCustomer)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([customer, value]) => {
              result += `  ${customer}: ${Analytics.formatCurrency(value)}\n`;
            });
          return result;
        }

        case 'generate_leadership_update': {
          const pipeline = this.context.pipelineMetrics!;
          const operational = this.context.operationalMetrics!;
          const revenue = Analytics.calculateRevenue(this.context.deals, this.context.workOrders);
          const sectors = Analytics.analyzeSectorPerformance(this.context.deals, this.context.workOrders);
          const dq = this.context.dataQuality;

          let result = 'LEADERSHIP UPDATE\n\n';

          result += `Pipeline: ${Analytics.formatCurrency(pipeline.totalValue)} across ${pipeline.dealCount} deals\n`;
          result += `Estimated Revenue: ${Analytics.formatCurrency(revenue.totalRevenue)} from ${revenue.completedProjects} completed work orders (ESTIMATE — no ground-truth revenue field in the data)\n`;
          result += `Operations: ${operational.activeProjects} active, ${operational.completedProjects} completed, ${operational.delayedProjects} delayed\n\n`;

          result += 'Top Sectors by Pipeline Value:\n';
          sectors.slice(0, 3).forEach(sector => {
            result += `  ${sector.sector}: ${Analytics.formatCurrency(sector.pipelineValue)} pipeline, health score ${sector.healthScore.toFixed(0)}/100\n`;
          });

          result += '\nRisks to Monitor:\n';
          const delayedSectors = sectors.filter(s => s.delayedProjects > 0).sort((a, b) => b.delayedProjects - a.delayedProjects);
          if (delayedSectors.length > 0) {
            result += `  - ${delayedSectors[0].sector} has ${delayedSectors[0].delayedProjects} delayed project(s)\n`;
          }
          const topDealShare = pipeline.topDeals.length > 0 && pipeline.totalValue > 0
            ? (pipeline.topDeals[0].value / pipeline.totalValue) * 100
            : 0;
          if (topDealShare > 20) {
            result += `  - Concentration risk: top deal (${pipeline.topDeals[0].customer}) is ${topDealShare.toFixed(0)}% of total pipeline\n`;
          }
          if (delayedSectors.length === 0 && topDealShare <= 20) {
            result += '  - No major concentration or delay risks detected in current data\n';
          }

          result += '\nData Quality Notes:\n';
          result += `  ${dq.validRecords}/${dq.totalRecords} records valid`;
          if (dq.notes.length > 0) {
            result += '\n';
            dq.notes.forEach(note => (result += `  - ${note}\n`));
          } else {
            result += '\n';
          }

          return result;
        }

        default:
          return 'Tool not found.';
      }
    } catch (error) {
      return `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Query the agent with natural language.
   *
   * `history` is the prior turns of this conversation (user + assistant
   * messages, oldest first, NOT including the current `userQuery`). Passing
   * it lets the agent understand follow-ups ("what about just Energy?") and
   * lets a user actually answer a clarifying question the agent asked in the
   * previous turn, instead of every request being evaluated in isolation.
   */
  async query(userQuery: string, history: AgentMessage[] = []): Promise<AgentResponse> {
    const systemPrompt = `You are a business intelligence agent for Skylark Drones. Your role is to answer founder and executive questions about business performance.

Available data:
- Work Orders board: Project execution and operational data
- Deals board: Sales pipeline and opportunities

Your task:
1. Understand what the user is asking about (pipeline, operations, sectors, customers, revenue)
2. Use the appropriate tools to gather data — use generate_leadership_update for "leadership update" / "executive summary" / "status update" style requests instead of calling several individual tools yourself
3. Analyze the results
4. Provide clear, concise executive-level insights
5. Highlight risks and opportunities
6. Be transparent about data limitations, and treat revenue as an ESTIMATE (there is no ground-truth revenue field in this data)

Conversation context:
- You may be shown prior turns of this conversation before the current question. Use them: if you asked a clarifying question last turn, treat the user's new message as the answer to it, not a fresh unrelated query. If a follow-up refers to "that sector" or "those deals", resolve it from the prior turns.

Always:
- Use actual data from the tools, don't make up numbers
- Highlight data quality issues that affect your analysis
- Provide context and explain why findings matter
- Ask clarifying questions if the query is ambiguous (the user's next message will be their answer)
- Give actionable insights, not just raw numbers`;

    const GROQ_MODEL = 'openai/gpt-oss-20b';

    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.map(m => ({ role: m.role, content: m.content })),
      {
        role: 'user',
        content: userQuery,
      },
    ];

    // First API call to determine intent and required tools
    let response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools: this.getTools(),
      tool_choice: 'auto',
      max_tokens: 2048,
    });

    let assistantMessage = '';
    const toolResults: Array<{ toolName: string; result: string }> = [];

    // Process tool calls
    while (response.choices[0].finish_reason === 'tool_calls') {
      const toolCalls = response.choices[0].message.tool_calls || [];
      assistantMessage = response.choices[0].message.content || '';

      messages.push({
        role: 'assistant',
        content: assistantMessage,
        tool_calls: toolCalls,
      });

      // Execute each tool and collect results
      for (const toolCall of toolCalls) {
        const toolInput = JSON.parse(toolCall.function.arguments);
        const toolResult = this.executeTool(toolCall.function.name, toolInput);
        toolResults.push({ toolName: toolCall.function.name, result: toolResult });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Call API again with tool results
      response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        tools: this.getTools(),
        tool_choice: 'auto',
        max_tokens: 2048,
      });
    }

    // Final response
    const finalAnswer = response.choices[0].message.content || 'No response generated.';

    return {
      answer: finalAnswer,
      insights: this.extractInsights(finalAnswer),
      risks: this.extractRisks(finalAnswer),
      dataQualityCaveats: this.context.dataQuality.notes,
      sources: ['Work Orders Board', 'Deals Board'],
    };
  }

  /**
   * Extract insights from agent response
   */
  private extractInsights(response: string): string[] {
    const insights: string[] = [];
    const lines = response.split('\n');

    lines.forEach(line => {
      if (
        line.includes('shows') ||
        line.includes('indicates') ||
        line.includes('suggests') ||
        line.includes('accounts for') ||
        line.includes('represents')
      ) {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          insights.push(cleaned);
        }
      }
    });

    return insights.slice(0, 3);
  }

  /**
   * Extract risks from agent response
   */
  private extractRisks(response: string): string[] {
    const risks: string[] = [];
    const lines = response.split('\n');

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (
        lower.includes('risk') ||
        lower.includes('concern') ||
        lower.includes('delay') ||
        lower.includes('concentration') ||
        lower.includes('warning')
      ) {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          risks.push(cleaned);
        }
      }
    });

    return risks.slice(0, 3);
  }
}
