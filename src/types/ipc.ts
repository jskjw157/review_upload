import { BulkServiceResponse, ReviewServiceResponse } from '../main/services/review';
import { AuthResult, OAuthConfig, OAuthFlowConfig, OAuthFlowResult } from '../main/services/auth';
import { ReviewInput } from './review';

export interface AuthCodePayload {
  code: string;
  config: OAuthConfig;
}

export interface ReviewRequestPayload {
  input: ReviewInput;
  config: OAuthConfig;
}

export interface BulkUploadPayload {
  fileName: string;
  fileBuffer: ArrayBuffer;
  config: OAuthConfig;
}

export type AuthChannelResponse = AuthResult;
export type ReviewChannelResponse = ReviewServiceResponse;
export type BulkChannelResponse = BulkServiceResponse;

// Re-export OAuth flow types for use in IPC
export type { OAuthFlowConfig, OAuthFlowResult };
