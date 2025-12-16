interface HistoryEntry {
  type: string;
  status: string;
  timestamp: string;
}

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

elements.loginBtn.addEventListener('click', () => {
  appState.isLoggedIn = !appState.isLoggedIn;
  elements.loginStatus.textContent = appState.isLoggedIn ? '로그인 완료 (mock)' : '로그아웃 상태';
  elements.loginStatus.classList.toggle('active', appState.isLoggedIn);
});

function handleReviewSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const product = elements.productSelect.value;
  const score = elements.scoreInput.value;
  const text = elements.reviewText.value.trim();

  if (!product || !text) {
    elements.reviewLog.textContent = '상품과 리뷰 내용을 모두 입력하세요.';
    return;
  }

  elements.reviewLog.textContent = '리뷰 등록 요청 중…';
  setTimeout(() => {
    elements.reviewLog.textContent = '성공: 리뷰가 등록되었습니다. (Mock 응답)';
    appendHistory({
      type: '단건 업로드',
      status: `성공 (평점 ${score})`,
      timestamp: new Date().toLocaleString(),
    });
    elements.reviewForm.reset();
  }, 600);
}

function handleBulkSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const file = elements.bulkFileInput.files?.[0];

  if (!file) {
    elements.bulkLog.textContent = '업로드할 CSV 또는 XLSX 파일을 선택하세요.';
    return;
  }

  elements.bulkLog.textContent = `${file.name} 처리 중…`;
  setTimeout(() => {
    elements.bulkLog.textContent = '완료: 12건 업로드 성공, 1건 실패 (Mock)';
    appendHistory({
      type: '일괄 업로드',
      status: '완료',
      timestamp: new Date().toLocaleString(),
    });
    elements.bulkFileInput.value = '';
  }, 900);
}

elements.reviewForm.addEventListener('submit', handleReviewSubmit);
elements.bulkForm.addEventListener('submit', handleBulkSubmit);

renderHistory(appState.history);
