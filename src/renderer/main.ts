import { HistoryEntry, ReviewInput } from '../types/review';
import { submitReview, uploadBulk } from './services/mockReviewService';

interface AppState {
  isLoggedIn: boolean;
  history: HistoryEntry[];
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

function ensureForm(event: SubmitEvent): asserts event is SubmitEvent & { currentTarget: HTMLFormElement } {
  if (!(event.currentTarget instanceof HTMLFormElement)) {
    throw new Error('Unexpected form submission target');
  }
}

elements.loginBtn.addEventListener('click', () => {
  appState.isLoggedIn = !appState.isLoggedIn;
  elements.loginStatus.textContent = appState.isLoggedIn ? '로그인 완료 (mock)' : '로그아웃 상태';
  elements.loginStatus.classList.toggle('active', appState.isLoggedIn);
});

async function handleReviewSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  ensureForm(event);

  const productId = elements.productSelect.value;
  const score = parseScore(elements.scoreInput);
  const text = elements.reviewText.value.trim();

  if (!productId || !text || score === null) {
    elements.reviewLog.textContent = '상품, 평점, 리뷰 내용을 모두 입력하세요.';
    return;
  }

  const reviewInput: ReviewInput = {
    productId,
    score,
    text,
  };

  elements.reviewLog.textContent = '리뷰 등록 요청 중…';
  const response = await submitReview(reviewInput);
  elements.reviewLog.textContent = response.message;
  appendHistory(response.historyEntry);
  elements.reviewForm.reset();
}

async function handleBulkSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  ensureForm(event);

  const file = elements.bulkFileInput.files?.[0];

  if (!(file instanceof File)) {
    elements.bulkLog.textContent = '업로드할 CSV 또는 XLSX 파일을 선택하세요.';
    return;
  }

  elements.bulkLog.textContent = `${file.name} 처리 중…`;
  const response = await uploadBulk(file);
  elements.bulkLog.textContent = response.message;
  appendHistory(response.historyEntry);
  elements.bulkFileInput.value = '';
}

elements.reviewForm.addEventListener('submit', handleReviewSubmit);
elements.bulkForm.addEventListener('submit', handleBulkSubmit);

renderHistory(appState.history);
