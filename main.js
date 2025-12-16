const loginBtn = document.getElementById('login-btn');
const loginStatus = document.getElementById('login-status');
const reviewForm = document.getElementById('review-form');
const reviewLog = document.getElementById('review-log');
const bulkForm = document.getElementById('bulk-form');
const bulkLog = document.getElementById('bulk-log');
const historyList = document.getElementById('history-list');

let isLoggedIn = false;
let history = [];

function appendHistory(entry) {
  history.unshift(entry);
  historyList.innerHTML = '';
  history.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.type} · ${item.status} · ${item.timestamp}`;
    historyList.appendChild(li);
  });
}

loginBtn.addEventListener('click', () => {
  isLoggedIn = !isLoggedIn;
  loginStatus.textContent = isLoggedIn ? '로그인 완료 (mock)' : '로그아웃 상태';
  loginStatus.classList.toggle('active', isLoggedIn);
});

reviewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const product = document.getElementById('product-select').value;
  const score = document.getElementById('score').value;
  const text = document.getElementById('review-text').value.trim();

  if (!product || !text) {
    reviewLog.textContent = '상품과 리뷰 내용을 모두 입력하세요.';
    return;
  }

  reviewLog.textContent = '리뷰 등록 요청 중…';
  setTimeout(() => {
    reviewLog.textContent = '성공: 리뷰가 등록되었습니다. (Mock 응답)';
    appendHistory({
      type: '단건 업로드',
      status: '성공',
      timestamp: new Date().toLocaleString(),
    });
    reviewForm.reset();
  }, 600);
});

bulkForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('bulk-file');
  const file = fileInput.files?.[0];

  if (!file) {
    bulkLog.textContent = '업로드할 CSV 또는 XLSX 파일을 선택하세요.';
    return;
  }

  bulkLog.textContent = `${file.name} 처리 중…`;
  setTimeout(() => {
    bulkLog.textContent = '완료: 12건 업로드 성공, 1건 실패 (Mock)';
    appendHistory({
      type: '일괄 업로드',
      status: '완료',
      timestamp: new Date().toLocaleString(),
    });
    fileInput.value = '';
  }, 900);
});
