import axios from 'axios';
import { MondayBoardResponse, MondayBoardItem } from './types';

const MONDAY_API_URL = 'https://api.monday.com/v2';

export class MondayClient {
  private apiKey: string;
  private workOrdersBoardId: string;
  private dealsBoardId: string;

  constructor(
    apiKey: string,
    workOrdersBoardId: string,
    dealsBoardId: string
  ) {
    this.apiKey = apiKey;
    this.workOrdersBoardId = workOrdersBoardId;
    this.dealsBoardId = dealsBoardId;
  }

  /**
   * Fetch all items from a board with comprehensive column data
   */
  async getBoardItems(boardId: string): Promise<MondayBoardItem[]> {
    try {
      const query = `
        query {
          boards(ids: ${boardId}) {
            items_page(limit: 500) {
              cursor
              items {
                id
                name
                column_values {
                  id
                  type
                  text
                  value
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(
        MONDAY_API_URL,
        { query },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
            'API-Version': '2024-10',
          },
        }
      );

      if (response.data.errors) {
        console.error('Monday.com API error:', response.data.errors);
        throw new Error(`Monday.com API error: ${response.data.errors[0]?.message}`);
      }

      const board = response.data.data.boards[0];
      if (!board || !board.items_page) {
        return [];
      }

      // Note: items_page is capped at 500 items per page (Monday.com API limit).
      // Boards larger than that would need cursor-based pagination via next_items_page.
      return board.items_page.items;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch board ${boardId}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch Work Orders board
   */
  async getWorkOrders(): Promise<MondayBoardItem[]> {
    return this.getBoardItems(this.workOrdersBoardId);
  }

  /**
   * Fetch Deals board
   */
  async getDeals(): Promise<MondayBoardItem[]> {
    return this.getBoardItems(this.dealsBoardId);
  }

  /**
   * Get column value by column ID
   */
  static getColumnValue(item: MondayBoardItem, columnId: string): string | null {
    const column = item.column_values.find(cv => cv.id === columnId);
    return column?.text || column?.value || null;
  }
}
