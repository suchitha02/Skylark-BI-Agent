import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MondayClient } from './monday-client.ts';
import { DataNormalizer } from './data-normalizer.ts';
import { Analytics } from './analytics.ts';
import { SkylarkAgent } from './agent.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Skylark Drones Backend is running' });
});

// TEMPORARY diagnostic endpoint - remove after fixing column ID mapping.
// Returns raw column_values (with real Monday.com column ids) for one sample
// item from each board, so we can fix data-normalizer.ts's field lookups.
app.get('/api/debug/columns', async (req, res) => {
  try {
    const mondayClient = new MondayClient(
      process.env.MONDAY_API_KEY,
      process.env.WORK_ORDERS_BOARD_ID,
      process.env.DEALS_BOARD_ID
    );
    const [workOrders, deals] = await Promise.all([
      mondayClient.getWorkOrders(),
      mondayClient.getDeals(),
    ]);
    res.json({
      workOrderSample: workOrders[0] || null,
      dealSample: deals[0] || null,
      workOrderCount: workOrders.length,
      dealCount: deals.length,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Main query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required and must be non-empty' });
    }

    // Initialize Monday.com client
    const mondayApiKey = process.env.MONDAY_API_KEY;
    const workOrdersBoardId = process.env.WORK_ORDERS_BOARD_ID;
    const dealsBoardId = process.env.DEALS_BOARD_ID;

    if (!mondayApiKey || !workOrdersBoardId || !dealsBoardId) {
      return res.status(500).json({ error: 'Monday.com configuration missing' });
    }

    const mondayClient = new MondayClient(
      mondayApiKey,
      workOrdersBoardId,
      dealsBoardId
    );

    // Fetch data from Monday.com
    let workOrdersItems, dealsItems;

    try {
      workOrdersItems = await mondayClient.getWorkOrders();
      dealsItems = await mondayClient.getDeals();
    } catch (error) {
      console.error('Monday.com API error:', error);
      return res.status(503).json({
        error: 'Failed to retrieve data from Monday.com',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Normalize data
    const workOrders = workOrdersItems
      .map(item => DataNormalizer.normalizeWorkOrder(item))
      .filter(wo => wo !== null);

    const deals = dealsItems
      .map(item => DataNormalizer.normalizeDeal(item))
      .filter(d => d !== null);

    if (deals.length === 0 && workOrders.length === 0) {
      return res.status(404).json({ error: 'No data found in Monday.com boards' });
    }

    // Calculate metrics
    const pipelineMetrics = Analytics.calculatePipeline(deals);
    const operationalMetrics = Analytics.calculateOperational(workOrders);
    const dataQuality = DataNormalizer.generateQualityReport(deals, workOrders);

    // Build agent context
    const agentContext = {
      deals,
      workOrders,
      pipelineMetrics,
      operationalMetrics,
      revenueMetrics: null,
      dataQuality,
    };

    // Create and query agent
    const agent = new SkylarkAgent(agentContext);
    const response = await agent.query(query);

    return res.status(200).json(response);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Skylark Drones Backend running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Monday.com Board IDs: WO=${process.env.WORK_ORDERS_BOARD_ID}, Deals=${process.env.DEALS_BOARD_ID}`);
});
