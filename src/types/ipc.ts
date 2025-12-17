import { BulkServiceResponse, ReviewServiceResponse } from '../main/services/review';
import { AuthResult, OAuthConfig } from '../main/services/auth';
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
