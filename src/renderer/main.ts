import type { OAuthConfig } from '../main/services/auth';
import type { BulkChannelResponse, ReviewChannelResponse } from '../types/ipc';
import { HistoryEntry, ReviewInput } from '../types/review';

interface AppState {
  isLoggedIn: boolean;
  history: HistoryEntry[];
}

interface FormState {
  reviewLog: string;
  bulkLog: string;
}

interface UIElements {
  loginBtn: HTMLButtonElement;
  loginStatus: HTMLElement;
  reviewForm: HTMLFormElement;
  reviewLog: HTMLElement;
  bulkForm: HTMLFormElement;
  bulkLog: HTMLElement;
  historyList: HTMLUListElement;
  productSelect: HTMLSelectElement;
  scoreInput: HTMLInputElement;
  reviewText: HTMLTextAreaElement;
  bulkFileInput: HTMLInputElement;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

const elements: UIElements = {
  loginBtn: getElement<HTMLButtonElement>('login-btn'),
  loginStatus: getElement<HTMLElement>('login-status'),
  reviewForm: getElement<HTMLFormElement>('review-form'),
  reviewLog: getElement<HTMLElement>('review-log'),
  bulkForm: getElement<HTMLFormElement>('bulk-form'),
  bulkLog: getElement<HTMLElement>('bulk-log'),
  historyList: getElement<HTMLUListElement>('history-list'),
  productSelect: getElement<HTMLSelectElement>('product-select'),
  scoreInput: getElement<HTMLInputElement>('score'),
  reviewText: getElement<HTMLTextAreaElement>('review-text'),
  bulkFileInput: getElement<HTMLInputElement>('bulk-file'),
};

const appState: AppState = {
  isLoggedIn: false,
  history: [],
};

const formState: FormState = {
  reviewLog: '',
  bulkLog: '',
};

function hasAuthConfig(config: OAuthConfig): boolean {
  return Boolean(config.mallId && config.clientId && config.clientSecret && config.redirectUri);
}

function setLoginState(isLoggedIn: boolean, message: string): void {
  appState.isLoggedIn = isLoggedIn;
  elements.loginStatus.textContent = message;
  elements.loginStatus.classList.toggle('active', isLoggedIn);
}

const authConfig: OAuthConfig = {
  mallId: import.meta.env.VITE_CAFE24_MALL_ID ?? '',
  clientId: import.meta.env.VITE_CAFE24_CLIENT_ID ?? '',
  clientSecret: import.meta.env.VITE_CAFE24_CLIENT_SECRET ?? '',
  redirectUri: import.meta.env.VITE_CAFE24_REDIRECT_URI ?? '',
};

function renderHistory(entries: HistoryEntry[]): void {
  elements.historyList.innerHTML = '';

  if (entries.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.classList.add('muted');
    placeholder.textContent = '아직 업로드 기록이 없습니다.';
    elements.historyList.appendChild(placeholder);
    return;
  }

  entries.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.type} · ${item.status} · ${item.timestamp}`;
    elements.historyList.appendChild(li);
  });
}

function appendHistory(entry: HistoryEntry): void {
  appState.history.unshift(entry);
  renderHistory(appState.history);
}

function parseScore(input: HTMLInputElement): number | null {
  const value = Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber;
  return Number.isFinite(value) ? value : null;
}

function setReviewLog(message: string): void {
  formState.reviewLog = message;
  elements.reviewLog.textContent = message;
}

function setBulkLog(message: string): void {
  formState.bulkLog = message;
  elements.bulkLog.textContent = message;
}

function ensureForm(event: SubmitEvent): asserts event is SubmitEvent & { currentTarget: HTMLFormElement } {
  if (!(event.currentTarget instanceof HTMLFormElement)) {
    throw new Error('Unexpected form submission target');
  }
}

function handleAuthResult(result: Awaited<ReturnType<typeof window.reviewApi.exchangeAuthCode>>): void {
  if (result.success) {
    setLoginState(true, '로그인 완료 (토큰 저장됨)');
    return;
  }

  setLoginState(false, result.message);
}

async function restoreAuthState(): Promise<void> {
  const stored = await window.reviewApi.loadStoredTokens();
  if (stored.success) {
    setLoginState(true, '로그인 완료 (저장된 토큰)');
    return;
  }

  setLoginState(false, '로그아웃 상태');
}

elements.loginBtn.addEventListener('click', async () => {
  if (!hasAuthConfig(authConfig)) {
    setLoginState(false, '환경 변수에서 클라이언트 정보를 설정하세요.');
    return;
  }

  const code = window.prompt('카페24 인증 코드를 입력하세요.');

  if (!code) {
    setLoginState(false, '인증 코드가 필요합니다.');
    return;
  }

  setLoginState(false, '인증 코드 교환 중…');
  const result = await window.reviewApi.exchangeAuthCode({ code, config: authConfig });
  handleAuthResult(result);
});

async function handleReviewSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  ensureForm(event);

  const productId = elements.productSelect.value;
  const score = parseScore(elements.scoreInput);
  const text = elements.reviewText.value.trim();

  if (!productId || !text || score === null) {
    setReviewLog('상품, 평점, 리뷰 내용을 모두 입력하세요.');
    return;
  }

  const reviewInput: ReviewInput = {
    productId,
    score,
    text,
  };

  if (!appState.isLoggedIn) {
    setReviewLog('로그인이 필요합니다. OAuth 2.0 인증 후 다시 시도하세요.');
    return;
  }

  setReviewLog('리뷰 등록 요청 중…');
  const response: ReviewChannelResponse = await window.reviewApi.submitReview({
    input: reviewInput,
    config: authConfig,
  });

  setReviewLog(response.message);

  if (response.historyEntry) {
    appendHistory(response.historyEntry);
  }

  if (response.needsReauth) {
    setLoginState(false, '토큰이 만료되어 로그아웃되었습니다. 다시 로그인하세요.');
  }

  if (response.success) {
    elements.reviewForm.reset();
  }
}

async function handleBulkSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  ensureForm(event);

  const file = elements.bulkFileInput.files?.[0];

  if (!(file instanceof File)) {
    setBulkLog('업로드할 CSV 또는 XLSX 파일을 선택하세요.');
    return;
  }

  if (!appState.isLoggedIn) {
    setBulkLog('로그인이 필요합니다. OAuth 2.0 인증 후 다시 시도하세요.');
    return;
  }

  setBulkLog(`${file.name} 처리 중…`);

  const response: BulkChannelResponse = await window.reviewApi.uploadBulk({
    fileName: file.name,
    fileBuffer: await file.arrayBuffer(),
    config: authConfig,
  });

  setBulkLog(response.message);

  if (response.historyEntry) {
    appendHistory(response.historyEntry);
  }

  if (response.needsReauth) {
    setLoginState(false, '토큰이 만료되어 로그아웃되었습니다. 다시 로그인하세요.');
  }

  if (response.success) {
    elements.bulkFileInput.value = '';
  }
}

elements.reviewForm.addEventListener('submit', handleReviewSubmit);
elements.bulkForm.addEventListener('submit', handleBulkSubmit);

void restoreAuthState();
renderHistory(appState.history);
