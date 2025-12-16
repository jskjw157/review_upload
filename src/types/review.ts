export interface ReviewInput {
  productId: string;
  score: number;
  text: string;
}

export interface BulkUploadResult {
  fileName: string;
  successCount: number;
  failureCount: number;
}

export interface HistoryEntry {
  type: '단건 업로드' | '일괄 업로드';
  status: string;
  timestamp: string;
}
