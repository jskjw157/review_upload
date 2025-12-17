import { HistoryEntry, ReviewInput, BulkUploadResult } from '../../types/review';
import { OAuthConfig, getValidAccessToken, refreshAccessToken } from './auth';

export type ReviewErrorCode = 'TOKEN_EXPIRED' | 'API_ERROR' | 'NETWORK_ERROR' | 'CONFIG_ERROR';

export interface ReviewServiceResponse {
  success: boolean;
  message: string;
  historyEntry?: HistoryEntry;
  needsReauth?: boolean;
  errorCode?: ReviewErrorCode;
}

export interface BulkServiceResponse extends ReviewServiceResponse {
  result?: BulkUploadResult;
}

interface Cafe24ErrorPayload {
  error?: string;
  error_description?: string;
}

function buildApiBase(mallId: string): string {
  return `https://${mallId}.cafe24api.com/api/v2`; 
}

async function callApi(
  url: string,
  method: 'POST',
  token: string,
  body: BodyInit,
  contentType?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return fetch(url, {
    method,
    headers,
    body,
  });
}

function buildHistoryEntry(type: HistoryEntry['type'], status: string): HistoryEntry {
  return {
    type,
    status,
    timestamp: new Date().toLocaleString(),
  };
}

function mapApiError(message: string, needsReauth = false, errorCode: ReviewErrorCode = 'API_ERROR'): ReviewServiceResponse {
  return {
    success: false,
    message,
    errorCode,
    needsReauth,
  };
}

const ensureToken = (config: OAuthConfig) => getValidAccessToken(config);

export async function submitSingleReview(
  input: ReviewInput,
  config: OAuthConfig,
): Promise<ReviewServiceResponse> {
  const tokenResult = await ensureToken(config);

  if (!tokenResult.success || !tokenResult.tokens) {
    return mapApiError(tokenResult.message, true, 'TOKEN_EXPIRED');
  }

  const { tokens } = tokenResult;
  const apiBase = buildApiBase(config.mallId);
  const endpoint = `${apiBase}/admin/products/${encodeURIComponent(input.productId)}/reviews`;

  const payload = JSON.stringify({
    product_no: input.productId,
    rating: input.score,
    content: input.text,
  });

  try {
    const response = await callApi(endpoint, 'POST', tokens.accessToken, payload, 'application/json');

    if (response.status === 401) {
      const refreshed = await refreshAccessToken(config);
      if (refreshed.success && refreshed.tokens) {
        const retry = await callApi(endpoint, 'POST', refreshed.tokens.accessToken, payload, 'application/json');
        if (retry.ok) {
          return {
            success: true,
            message: '리뷰 등록 완료',
            historyEntry: buildHistoryEntry('단건 업로드', `성공 (평점 ${input.score})`),
          };
        }
      }
      return mapApiError('토큰이 만료되었습니다. 다시 로그인하세요.', true, 'TOKEN_EXPIRED');
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Cafe24ErrorPayload;
      const detail = errorBody.error_description ?? errorBody.error ?? response.statusText;
      return mapApiError(`API 오류: ${detail}`);
    }

    return {
      success: true,
      message: '리뷰 등록 완료',
      historyEntry: buildHistoryEntry('단건 업로드', `성공 (평점 ${input.score})`),
    };
  } catch (error) {
    console.error('[review] submitSingleReview error', error);
    return mapApiError('네트워크 오류로 요청에 실패했습니다.', false, 'NETWORK_ERROR');
  }
}

export async function uploadBulkReviews(
  fileName: string,
  fileBuffer: ArrayBuffer,
  config: OAuthConfig,
): Promise<BulkServiceResponse> {
  const tokenResult = await ensureToken(config);

  if (!tokenResult.success || !tokenResult.tokens) {
    return mapApiError(tokenResult.message, true, 'TOKEN_EXPIRED');
  }

  const { tokens } = tokenResult;
  const apiBase = buildApiBase(config.mallId);
  const endpoint = `${apiBase}/admin/product-reviews/bulk`;

  const buildFormData = () => {
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    return formData;
  };

  try {
    const response = await callApi(endpoint, 'POST', tokens.accessToken, buildFormData());

    if (response.status === 401) {
      const refreshed = await refreshAccessToken(config);
      if (refreshed.success && refreshed.tokens) {
        const retry = await callApi(endpoint, 'POST', refreshed.tokens.accessToken, buildFormData());
        if (retry.ok) {
          const result: BulkUploadResult = { fileName, successCount: 0, failureCount: 0 };
          return {
            success: true,
            message: '일괄 업로드 완료',
            result,
            historyEntry: buildHistoryEntry('일괄 업로드', '완료'),
          };
        }
      }
      return mapApiError('토큰이 만료되었습니다. 다시 로그인하세요.', true, 'TOKEN_EXPIRED');
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Cafe24ErrorPayload;
      const detail = errorBody.error_description ?? errorBody.error ?? response.statusText;
      return mapApiError(`API 오류: ${detail}`);
    }

    const parsed = (await response.json().catch(() => ({}))) as Partial<BulkUploadResult>;
    const result: BulkUploadResult = {
      fileName: parsed.fileName ?? fileName,
      successCount: parsed.successCount ?? 0,
      failureCount: parsed.failureCount ?? 0,
    };

    return {
      success: true,
      message: '일괄 업로드 완료',
      result,
      historyEntry: buildHistoryEntry('일괄 업로드', '완료'),
    };
  } catch (error) {
    console.error('[review] uploadBulkReviews error', error);
    return mapApiError('네트워크 오류로 요청에 실패했습니다.', false, 'NETWORK_ERROR');
  }
}
