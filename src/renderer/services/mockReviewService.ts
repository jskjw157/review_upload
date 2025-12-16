import { BulkUploadResult, HistoryEntry, ReviewInput } from '../../types/review';

export interface ReviewResponse {
  message: string;
  historyEntry: HistoryEntry;
}

export interface BulkUploadResponse {
  message: string;
  result: BulkUploadResult;
  historyEntry: HistoryEntry;
}

export function submitReview(input: ReviewInput): Promise<ReviewResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: '성공: 리뷰가 등록되었습니다. (Mock 응답)',
        historyEntry: {
          type: '단건 업로드',
          status: `성공 (평점 ${input.score})`,
          timestamp: new Date().toLocaleString(),
        },
      });
    }, 600);
  });
}

export function uploadBulk(file: File): Promise<BulkUploadResponse> {
  const result: BulkUploadResult = {
    fileName: file.name,
    successCount: 12,
    failureCount: 1,
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: `완료: ${result.successCount}건 업로드 성공, ${result.failureCount}건 실패 (Mock)`,
        result,
        historyEntry: {
          type: '일괄 업로드',
          status: '완료',
          timestamp: new Date().toLocaleString(),
        },
      });
    }, 900);
  });
}
