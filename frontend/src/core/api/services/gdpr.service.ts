/**
 * GDPR Service
 * Handles GDPR requests, data export, and consent management
 */

import { apiClient } from '../index';
import type {
  GDPRRequest,
  CreateGDPRRequestRequest,
  GDPRRequestsQuery,
  DataExport,
  ConsentHistoryResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '../../contracts/types';

export type GDPRRequestResponse = ApiSuccessResponse<GDPRRequest> | ApiErrorResponse;
export type DataExportResponse = ApiSuccessResponse<DataExport> | ApiErrorResponse;
export type ConsentHistoryResponseTyped = ApiSuccessResponse<ConsentHistoryResponse> | ApiErrorResponse;
export type PaginatedGDPRRequestsResponse = PaginatedResponse<GDPRRequest>;

export class GdprService {
  private readonly basePath = '/api/gdpr';

  /**
   * Get GDPR requests with pagination and filtering
   */
  async getRequests(userId: string, query?: GDPRRequestsQuery): Promise<{ requests: GDPRRequest[]; total: number; totalPages: number }> {
    const response = await apiClient.get<PaginatedGDPRRequestsResponse>(
      `${this.basePath}/requests`,
      { ...query, userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch GDPR requests');
    }

    return {
      requests: response.data,
      total: response.meta.total,
      totalPages: response.meta.totalPages,
    };
  }

  /**
   * Get a single GDPR request by ID
   */
  async getRequest(requestId: string): Promise<GDPRRequest> {
    const response = await apiClient.get<GDPRRequestResponse>(
      `${this.basePath}/requests/${requestId}`
    );

    if (!response.success) {
      throw new Error('GDPR operation failed');
    }

    return response.data;
  }

  /**
   * Create a new GDPR request
   */
  async createRequest(data: CreateGDPRRequestRequest): Promise<GDPRRequest> {
    const response = await apiClient.post<GDPRRequestResponse>(
      `${this.basePath}/requests`,
      data
    );

    if (!response.success) {
      throw new Error('GDPR operation failed');
    }

    return response.data;
  }

  /**
   * Export all user data (GDPR access/portability)
   */
  async exportData(userId: string): Promise<DataExport> {
    const response = await apiClient.get<DataExportResponse>(
      `${this.basePath}/export/${userId}`
    );

    if (!response.success) {
      throw new Error('GDPR operation failed');
    }

    return response.data;
  }

  /**
   * Request export (alias for exportData)
   */
  async requestExport(data: { userId: string }): Promise<ApiSuccessResponse<DataExport> | ApiErrorResponse> {
    const response = await apiClient.post<DataExportResponse>(
      `${this.basePath}/export/${data.userId}`
    );

    return response;
  }

  /**
   * Request data erasure (GDPR right to be forgotten)
   */
  async requestErasure(userId: string): Promise<{ requestId: string; status: string; message: string }> {
    const response = await apiClient.post<ApiSuccessResponse<{ requestId: string; userId: string; requestType: string; status: string; message: string }>>(
      `${this.basePath}/erase/${userId}`
    );

    if (!response.success) {
      throw new Error('Failed to request account erasure');
    }

    return {
      requestId: response.data.requestId,
      status: response.data.status,
      message: response.data.message,
    };
  }

  /**
   * Get all consent history for a user
   */
  async getConsentHistory(userId: string): Promise<ConsentHistoryResponse> {
    const response = await apiClient.get<ConsentHistoryResponseTyped>(
      `${this.basePath}/consent/${userId}`
    );

    if (!response.success) {
      throw new Error('GDPR operation failed');
    }

    return response.data;
  }

  /**
   * Update consents
   */
  async updateConsents(data: { userId: string; consents: Record<string, boolean> }): Promise<void> {
    await apiClient.post(`${this.basePath}/consent/${data.userId}`, {
      consents: data.consents,
    });
  }
}

export const gdprService = new GdprService();
export default gdprService;
