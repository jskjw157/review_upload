import type { ReviewApi } from '../main/preload';

declare global {
  interface Window {
    reviewApi: ReviewApi;
  }
}

export {};
