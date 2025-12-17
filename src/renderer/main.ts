interface HistoryEntry {
  type: '단건 업로드' | '일괄 업로드';
  status: string;
  timestamp: string;
  detail?: string;
}

interface ReviewInput {
  product: string;
  score: number;
  text: string;
}

const historyEntries: HistoryEntry[] = [];
let isLoggedIn = false;

const query = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
};

const loginBtn = query<HTMLButtonElement>('login-btn');
const loginStatus = query<HTMLDivElement>('login-status');
const reviewForm = query<HTMLFormElement>('review-form');
const reviewLog = query<HTMLParagraphElement>('review-log');
const bulkForm = query<HTMLFormElement>('bulk-form');
const bulkLog = query<HTMLParagraphElement>('bulk-log');
const historyList = query<HTMLUListElement>('history-list');

const toTimestamp = (): string => new Date().toLocaleString();

const renderHistory = () => {
  historyList.innerHTML = '';
  historyEntries.forEach((item) => {
    const li = document.createElement('li');
    const detailText = item.detail ? ` · ${item.detail}` : '';
    li.textContent = `${item.type} · ${item.status} · ${item.timestamp}${detailText}`;
    historyList.appendChild(li);
  });
};

const appendHistory = (entry: HistoryEntry) => {
  historyEntries.unshift(entry);
  renderHistory();
};

const parseReviewInput = (): ReviewInput | null => {
  const product = query<HTMLSelectElement>('product-select').value;
  const scoreInput = query<HTMLInputElement>('score').value;
  const text = query<HTMLTextAreaElement>('review-text').value.trim();

  const score = Number(scoreInput);
  if (!product || !text || Number.isNaN(score)) {
    reviewLog.textContent = '상품, 리뷰 내용, 별점을 모두 입력하세요.';
    return null;
  }

  if (score < 1 || score > 5) {
    reviewLog.textContent = '별점은 1~5 사이여야 합니다.';
    return null;
  }

  return { product, score, text };
};

loginBtn.addEventListener('click', () => {
  isLoggedIn = !isLoggedIn;
  loginStatus.textContent = isLoggedIn ? '로그인 완료 (mock)' : '로그아웃 상태';
  loginStatus.classList.toggle('active', isLoggedIn);
});

reviewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const reviewInput = parseReviewInput();
  if (!reviewInput) {
    return;
  }

  reviewLog.textContent = `리뷰 등록 요청 중… (상품: ${reviewInput.product}, 별점: ${reviewInput.score})`;

  window.setTimeout(() => {
    reviewLog.textContent = '성공: 리뷰가 등록되었습니다. (Mock 응답)';
    appendHistory({
      type: '단건 업로드',
      status: '성공',
      timestamp: toTimestamp(),
      detail: reviewInput.product,
    });
    reviewForm.reset();
  }, 600);
});

bulkForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fileInput = query<HTMLInputElement>('bulk-file');
  const file = fileInput.files?.[0];

  if (!file) {
    bulkLog.textContent = '업로드할 CSV 또는 XLSX 파일을 선택하세요.';
    return;
  }

  bulkLog.textContent = `${file.name} 처리 중…`;

  window.setTimeout(() => {
    bulkLog.textContent = '완료: 12건 업로드 성공, 1건 실패 (Mock)';
    appendHistory({
      type: '일괄 업로드',
      status: '완료',
      timestamp: toTimestamp(),
      detail: file.name,
    });
    fileInput.value = '';
  }, 900);
});
