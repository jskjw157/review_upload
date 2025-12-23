# Cafe24 Review Manager - Development Tasks

**프로젝트:** Cafe24 Local Review Manager (Electron Desktop App)
**목표:** 카페24 쇼핑몰 리뷰 자동 업로드/관리 데스크탑 애플리케이션 개발
**기술 스택:** Electron, React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui

---

## Phase 1: 프로젝트 초기 설정

### 1.1 개발 환경 구축

- [x] Node.js v20 LTS 설치 확인
- [x] npm 패키지 매니저 설정
- [x] Git 저장소 초기화
- [x] `.gitignore` 파일 작성 (node_modules, dist, .env 등)
- [x] 프로젝트 디렉토리 구조 생성

### 1.2 Electron + Vite + TypeScript 설정

- [x] `package.json` 작성
  - [x] Electron, React, TypeScript 의존성 추가
  - [x] Vite, ts-node, concurrently 개발 의존성 추가
  - [x] npm scripts 정의 (dev, build, start)
- [x] TypeScript 설정 (`tsconfig.json`)
  - [x] strict 모드 활성화
  - [x] ESNext 모듈 시스템 설정
  - [x] Path alias 설정 (`@/*` → `src/renderer/*`)
- [x] Vite 설정
  - [x] `vite.renderer.config.ts` - Renderer 프로세스 빌드
  - [x] `vite.main.config.ts` - Main 프로세스 빌드
  - [x] React 플러그인 추가
  - [x] Path alias 설정 (TypeScript와 동기화)
- [x] Electron Forge 설정 (선택사항)
  - [x] Makers 설정 (Squirrel, Zip, Deb, RPM)
  - [x] Vite 플러그인 통합

### 1.3 프로젝트 구조 설정

```
src/
├── main/                   # Main Process
│   ├── main.ts            # 진입점
│   ├── preload.ts         # Preload script
│   └── services/          # 비즈니스 로직
│       ├── auth.ts        # 인증 서비스
│       └── review.ts      # 리뷰 서비스
├── renderer/              # Renderer Process
│   ├── App.tsx           # 루트 컴포넌트
│   ├── main.tsx          # 진입점
│   ├── components/       # React 컴포넌트
│   ├── hooks/            # Custom hooks
│   ├── lib/              # 유틸리티
│   └── styles/           # CSS/Tailwind
└── types/                # 공유 타입 정의
    ├── global.d.ts       # window 타입
    ├── ipc.ts            # IPC 타입
    └── review.ts         # 도메인 타입
```

- [x] 디렉토리 구조 생성
- [x] 각 디렉토리에 기본 파일 생성
- [x] 타입 정의 파일 작성

### 1.4 UI 프레임워크 설정

- [x] Tailwind CSS 설치 및 설정
  - [x] `tailwind.config.cjs` 작성
  - [x] `postcss.config.cjs` 작성
  - [x] 기본 스타일 파일 생성 (`src/renderer/styles/globals.css`)
- [x] shadcn/ui 설정
  - [x] `components.json` 설정
  - [x] 기본 컴포넌트 설치 (Button, Card, Input, Tabs 등)
  - [x] 유틸리티 함수 (`cn`) 설정
- [x] Lucide React 아이콘 설치

### 1.5 개발 환경 검증

- [x] `npm run dev` 실행 확인
  - [x] Vite 개발 서버 시작 (port 5173)
  - [x] Electron 앱 실행
  - [x] DevTools 자동 열림 확인
- [x] Hot reload 동작 확인
  - [x] Renderer 코드 변경 시 자동 새로고침
  - [x] Main 프로세스 변경 시 재시작 필요 (예상된 동작)
- [x] TypeScript 컴파일 에러 없음 확인
- [x] 기본 UI 렌더링 확인

---

## Phase 2: OAuth 2.0 인증 시스템 구현

### 2.1 Cafe24 앱 등록 및 설정

- [ ] Cafe24 파트너 센터 앱 등록
  - [ ] 앱 이름, 설명 작성
  - [ ] Client ID, Client Secret 발급
  - [ ] Redirect URI 설정 (예: `http://localhost:3000/callback`)
  - [ ] 필요한 스코프(권한) 선택
    - [ ] `mall.read_product` - 상품 조회
    - [ ] `mall.write_product` - 상품 수정
    - [ ] `mall.read_category` - 카테고리 조회
    - [ ] `mall.read_order` - 주문 조회
    - [ ] 기타 필요한 권한
- [ ] 환경 변수 관리 방안 결정
  - [ ] `.env` 파일 사용 (개발용)
  - [ ] `.env.example` 템플릿 생성
  - [ ] 프로덕션 빌드 시 설정 방법 문서화

### 2.2 Auth Service 구현 (Main Process)

**파일:** `src/main/services/auth.ts`

- [x] 타입 정의
  - [x] `OAuthConfig` - Mall ID, Client ID/Secret, Redirect URI
  - [x] `OAuthTokenSet` - Access/Refresh Token, Expiry
  - [x] `AuthResult` - 통합 응답 타입
- [x] 토큰 저장소 구현
  - [x] 저장 경로: `app.getPath('userData')/cafe24-oauth.json`
  - [x] `safeStorage` 사용한 Refresh Token 암호화
  - [x] `serializeTokenSet()` - 토큰 직렬화
  - [x] `readTokenFile()` - 토큰 파일 읽기 및 복호화
  - [x] `persistTokens()` - 토큰 파일 저장
- [x] OAuth 엔드포인트 함수
  - [x] `getTokenEndpoint()` - Mall ID 기반 토큰 URL 생성
  - [x] `exchangeAuthCode()` - 인증 코드로 토큰 교환
  - [x] `refreshAccessToken()` - Refresh Token으로 갱신
  - [x] `getValidAccessToken()` - 토큰 검증 및 자동 갱신
  - [x] `loadStoredTokens()` - 저장된 토큰 로드
- [x] 토큰 만료 체크 로직
  - [x] `isTokenExpired()` - 60초 skew 적용
- [x] 에러 핸들링
  - [x] 네트워크 오류 처리
  - [x] 유효하지 않은 코드/토큰 처리
  - [x] 파일 시스템 오류 처리

### 2.3 인증 IPC 채널 설정

**파일:** `src/types/ipc.ts`

- [x] IPC 페이로드 타입 정의
  - [x] `AuthCodePayload` - { code, config }
  - [x] `AuthChannelResponse` - AuthResult 타입
- [x] 타입 안전성 검증

**파일:** `src/main/main.ts`

- [x] IPC 핸들러 등록
  - [x] `auth:exchange` - 인증 코드 교환
  - [x] `auth:refresh` - 토큰 갱신
  - [x] `auth:load` - 저장된 토큰 로드

**파일:** `src/main/preload.ts`

- [x] contextBridge API 노출
  - [x] `exchangeAuthCode()`
  - [x] `refreshTokens()`
  - [x] `loadStoredTokens()`
- [x] 타입 정의 및 export

**파일:** `src/types/global.d.ts`

- [x] `window.reviewApi` 타입 정의
- [x] 모든 IPC 메서드 타입 선언

### 2.4 인증 UI 구현 (Renderer)

**파일:** `src/renderer/hooks/useAuth.ts`

- [x] 인증 상태 관리
  - [x] `isLoggedIn` - 로그인 상태
  - [x] `config` - OAuth 설정
  - [x] `statusMessage` - 사용자 메시지
- [x] 인증 함수
  - [x] `login()` - 로그인 플로우 시작
  - [x] `handleTokenExpired()` - 토큰 만료 처리
  - [x] `loadSavedTokens()` - 앱 시작 시 토큰 복원
- [x] 로컬 스토리지 또는 인메모리 설정 저장

**파일:** `src/renderer/components/Header.tsx`

- [x] 로그인 상태 표시
  - [x] 로그인 전: "로그인" 버튼
  - [x] 로그인 후: 상태 메시지 또는 사용자 정보
- [x] 로그인 버튼 클릭 핸들러
- [x] 상태 메시지 표시 영역

### 2.5 OAuth Authorization Flow 구현

- [x] 인증 URL 생성 로직
  - [x] `https://{mallId}.cafe24api.com/api/v2/oauth/authorize` 구성
  - [x] Query parameters: response_type, client_id, state, redirect_uri, scope
  - [x] CSRF 방지용 state 파라미터 생성 및 검증
- [x] 브라우저 창 열기
  - [x] Electron `shell.openExternal()` 사용
  - [x] 사용자 로그인 및 권한 승인
- [x] Callback 처리
  - [x] 로컬 HTTP 서버 실행 (port 3000)
  - [x] Authorization code 파싱
  - [x] State 검증 (timing-safe comparison)
  - [x] Main Process로 code 전달
  - [x] 토큰 교환 요청
- [x] 콜백 서버 정리
  - [x] 토큰 교환 완료 후 서버 종료
  - [x] 사용자에게 성공/실패 메시지 표시 (HTML)

**추가 파일:**
- [x] `src/main/services/oauth-server.ts`
  - [x] 로컬 콜백 서버 구현
  - [x] 코드 수신 및 state 검증
  - [x] 브라우저 응답 (한국어/영어 지원)

### 2.6 인증 플로우 테스트

- [ ] 수동 테스트
  - [ ] 처음 로그인 시나리오
    - [ ] 로그인 버튼 클릭
    - [ ] 브라우저 창 열림
    - [ ] Cafe24 로그인 및 권한 승인
    - [ ] 콜백 수신 및 토큰 저장
    - [ ] UI에 로그인 상태 반영
  - [ ] 앱 재시작 후 토큰 복원
    - [ ] 저장된 토큰 자동 로드
    - [ ] 로그인 상태 유지
  - [ ] 토큰 만료 시나리오
    - [ ] 만료된 토큰으로 API 호출
    - [ ] 자동 갱신 동작 확인
    - [ ] 갱신 실패 시 재로그인 요청
- [ ] 엣지 케이스 처리
  - [ ] 네트워크 오류 시 재시도
  - [ ] 유효하지 않은 인증 코드
  - [ ] 토큰 파일 손상 처리
  - [ ] Refresh Token 만료 (재로그인 필요)

---

## Phase 3: 리뷰 등록 기능 구현

### 3.1 Review Service 구현 (Main Process)

**파일:** `src/main/services/review.ts`

- [x] 타입 정의
  - [x] `ReviewServiceResponse` - 표준 응답 포맷
  - [x] `ReviewErrorCode` - 에러 코드 enum
- [x] API 유틸리티 함수
  - [x] `buildApiBase()` - Mall ID 기반 API URL
  - [x] `callApi()` - 토큰 포함 fetch wrapper
  - [x] `buildHistoryEntry()` - 히스토리 엔트리 생성
  - [x] `mapApiError()` - 에러 응답 매핑
- [x] 단건 리뷰 등록
  - [x] `submitSingleReview()` 구현
  - [x] 토큰 검증 (`ensureToken`)
  - [x] API 엔드포인트: `POST /admin/products/{product_no}/reviews`
  - [x] 요청 페이로드 구성 (product_no, rating, content)
  - [x] 401 에러 시 토큰 갱신 + 재시도
  - [x] 성공 시 히스토리 엔트리 반환
- [x] 에러 처리
  - [x] Cafe24 API 에러 파싱 (error, error_description)
  - [x] 네트워크 오류 처리
  - [x] `needsReauth` 플래그 설정

### 3.2 리뷰 IPC 채널 설정

**파일:** `src/types/review.ts`

- [x] 도메인 타입 정의
  - [x] `ReviewInput` - productId, score, text
  - [x] `HistoryEntry` - type, status, timestamp
  - [x] `BulkUploadResult` - fileName, successCount, failureCount

**파일:** `src/types/ipc.ts`

- [x] IPC 페이로드 추가
  - [x] `ReviewRequestPayload` - { input, config }
  - [x] `ReviewChannelResponse` - ReviewServiceResponse

**파일:** `src/main/main.ts`

- [x] IPC 핸들러 등록
  - [x] `review:submit` - 단건 리뷰 제출

**파일:** `src/main/preload.ts`

- [x] API 노출
  - [x] `submitReview()`

### 3.3 리뷰 등록 UI 구현

**파일:** `src/renderer/hooks/useReview.ts`

- [x] 리뷰 상태 관리
  - [x] `isSubmitting` - 제출 중 상태
  - [x] `message` - 결과 메시지
  - [x] `history` - 업로드 기록
- [x] 리뷰 제출 함수
  - [x] `submitReview(input)` 구현
  - [x] 로그인 확인
  - [x] IPC 호출
  - [x] 에러 처리 (토큰 만료 시 재로그인 유도)
  - [x] 히스토리 추가

**파일:** `src/renderer/components/ReviewForm.tsx`

- [x] 폼 필드
  - [x] 상품 ID 입력 (Input)
  - [x] 별점 선택 (Select: 1-5)
  - [x] 리뷰 텍스트 (Textarea)
- [x] 폼 검증
  - [x] 필수 필드 확인
  - [x] 별점 범위 체크
  - [x] 최소 텍스트 길이 (선택사항)
- [x] 제출 버튼
  - [x] 로딩 상태 표시 (disabled + spinner)
  - [x] 제출 후 폼 초기화
- [x] 메시지 표시
  - [x] 성공 메시지 (초록색)
  - [x] 에러 메시지 (빨간색)

**파일:** `src/renderer/components/HistoryPanel.tsx`

- [x] 업로드 기록 목록
  - [x] 타입 (단건/일괄)
  - [x] 상태 (성공/실패)
  - [x] 타임스탬프
- [x] 최근 10개 제한 (선택사항)
- [x] 스크롤 가능한 컨테이너

### 3.4 Cafe24 리뷰 API 연동 검증

- [ ] API 문서 확인
  - [ ] 리뷰 등록 엔드포인트 정확성 검증
  - [ ] 요청 페이로드 형식 확인
  - [ ] 응답 구조 파악
  - [ ] 필수/선택 필드 확인
- [ ] 실제 API 테스트
  - [ ] Postman/curl로 수동 테스트
  - [ ] 유효한 access_token 사용
  - [ ] 성공 응답 확인
  - [ ] 에러 응답 케이스 테스트
- [ ] 앱에서 E2E 테스트
  - [ ] 로그인 → 리뷰 작성 → 제출
  - [ ] Cafe24 관리자 페이지에서 리뷰 확인
  - [ ] 에러 케이스 (잘못된 상품 ID, 권한 없음 등)

### 3.5 리뷰 등록 기능 개선

- [ ] 상품 ID 자동완성/검색 (선택사항)
  - [ ] Cafe24 상품 목록 API 호출
  - [ ] 드롭다운으로 상품 선택
  - [ ] 상품명 표시
- [ ] 별점 UI 개선
  - [ ] 별 아이콘 클릭으로 선택
  - [ ] 호버 효과
- [ ] 리뷰 미리보기
  - [ ] 제출 전 내용 확인 모달
- [ ] 임시 저장 기능
  - [ ] 로컬 스토리지에 작성 중인 리뷰 저장
  - [ ] 앱 재시작 후 복원

---

## Phase 4: 일괄 업로드 기능 구현

### 4.1 파일 파싱 로직 구현

**파일:** `src/main/services/file-parser.ts` (신규)

- [ ] CSV 파싱
  - [ ] 라이브러리 선택 (예: `papaparse`, `csv-parser`)
  - [ ] 헤더 행 처리
  - [ ] 각 행을 `ReviewInput` 객체로 변환
  - [ ] 유효성 검증 (필수 필드, 데이터 타입)
- [ ] Excel 파싱 (선택사항)
  - [ ] 라이브러리 선택 (예: `xlsx`, `exceljs`)
  - [ ] 첫 번째 시트 읽기
  - [ ] CSV와 동일한 구조로 변환
- [ ] 파싱 에러 처리
  - [ ] 잘못된 형식
  - [ ] 누락된 필드
  - [ ] 행 번호 포함 에러 메시지

### 4.2 일괄 업로드 Service 구현

**파일:** `src/main/services/review.ts`

- [x] 일괄 업로드 함수
  - [x] `uploadBulkReviews(fileName, fileBuffer, config)` 구현
  - [x] 파일 파싱 (현재는 단순 FormData 전송)
  - [ ] 각 리뷰 순회하며 개별 API 호출 (대안 구현)
  - [ ] 진행률 이벤트 전송 (Main → Renderer)
  - [ ] 성공/실패 카운트 집계
  - [ ] Rate limiting 고려 (5 req/sec 제한)
- [x] 에러 처리
  - [x] 일부 실패 시에도 계속 진행
  - [x] 최종 결과 요약 반환

**진행률 이벤트 (선택사항):**

- [ ] IPC 이벤트 타입 정의 (`src/types/ipc.ts`)
  - [ ] `upload:progress` - { current, total, percentage }
  - [ ] `upload:item-complete` - { index, success, message }
- [ ] Main에서 Renderer로 전송
  - [ ] `mainWindow.webContents.send('upload:progress', ...)`
- [ ] Preload에서 리스너 노출
  - [ ] `onProgress(callback)` 함수
  - [ ] cleanup 함수 반환
- [ ] Renderer에서 수신
  - [ ] Progress bar 업데이트
  - [ ] 실시간 로그 표시

### 4.3 일괄 업로드 IPC 설정

**파일:** `src/types/ipc.ts`

- [x] 페이로드 정의
  - [x] `BulkUploadPayload` - { fileName, fileBuffer, config }
  - [x] `BulkChannelResponse` - BulkServiceResponse

**파일:** `src/main/main.ts`

- [x] IPC 핸들러
  - [x] `review:bulk` 등록

**파일:** `src/main/preload.ts`

- [x] API 노출
  - [x] `uploadBulk()`
- [ ] 진행률 이벤트 리스너 (선택사항)
  - [ ] `onUploadProgress()`

### 4.4 일괄 업로드 UI 구현

**파일:** `src/renderer/components/BulkUpload.tsx`

- [x] 파일 선택 UI
  - [x] File input (accept=".csv,.xlsx")
  - [x] 드래그 앤 드롭 영역 (선택사항)
  - [x] 선택된 파일명 표시
- [x] 업로드 버튼
  - [x] 파일 선택 전 비활성화
  - [x] 업로드 중 로딩 표시
- [x] 진행률 표시 (선택사항)
  - [ ] Progress bar
  - [ ] 현재/전체 카운트
  - [ ] 남은 시간 예측
- [x] 결과 표시
  - [x] 성공/실패 개수
  - [x] 에러 로그 (실패한 항목)

**파일:** `src/renderer/hooks/useReview.ts`

- [x] 일괄 업로드 함수
  - [x] `uploadBulk(file)` 구현
  - [x] File → ArrayBuffer 변환
  - [x] IPC 호출
  - [x] 진행률 업데이트 (선택사항)
  - [x] 결과 히스토리 추가

### 4.5 CSV/Excel 템플릿 제공

- [ ] 템플릿 파일 생성
  - [ ] `templates/review-template.csv` 생성
  - [ ] 헤더: `productId,score,text`
  - [ ] 샘플 데이터 2-3개 포함
  - [ ] Excel 템플릿 (선택사항)
- [ ] 템플릿 다운로드 기능
  - [ ] UI에 "템플릿 다운로드" 버튼 추가
  - [ ] IPC 채널: `file:download-template`
  - [ ] Main에서 템플릿 파일 경로 반환
  - [ ] Renderer에서 다운로드 트리거
- [ ] 사용 가이드
  - [ ] UI에 파일 형식 설명
  - [ ] 필수 컬럼 안내

### 4.6 일괄 업로드 테스트

- [ ] 소규모 테스트 (5-10개 리뷰)
  - [ ] CSV 파일 생성
  - [ ] 업로드 실행
  - [ ] 진행률 확인
  - [ ] 결과 검증 (Cafe24 관리자)
- [ ] 중규모 테스트 (50-100개)
  - [ ] Rate limiting 동작 확인
  - [ ] 진행률 정확성
  - [ ] 성능 측정
- [ ] 에러 케이스
  - [ ] 잘못된 CSV 형식
  - [ ] 존재하지 않는 상품 ID
  - [ ] 일부 행만 유효한 경우
  - [ ] 네트워크 오류 중간 발생

---

## Phase 5: UI/UX 개선

### 5.1 레이아웃 및 디자인

- [x] 반응형 레이아웃
  - [x] Desktop 우선 디자인
  - [x] 최소 창 크기 설정 (1280x800)
  - [x] 리사이즈 시 컴포넌트 배치 조정
- [x] 컴포넌트 배치
  - [x] Header - 로그인 상태, 타이틀
  - [x] Main Content - Tabs (단건/일괄)
  - [x] Sidebar - 정보 패널, 히스토리
  - [x] Footer - 버전 정보, 링크 (선택사항)
- [x] 색상 테마
  - [x] Tailwind 기본 색상 체계
  - [x] Primary, Secondary, Accent 색상 정의
  - [x] 다크/라이트 모드 준비 (선택사항)

### 5.2 사용성 개선

- [x] 입력 유효성 검사
  - [x] 실시간 필드 검증
  - [x] 에러 메시지 표시
  - [x] 제출 버튼 활성화/비활성화
- [x] 로딩 상태 표시
  - [x] 버튼 spinner
  - [x] 전체 화면 로딩 (선택사항)
  - [x] Skeleton 로더 (선택사항)
- [x] 피드백 메시지
  - [x] Toast 알림 (선택사항: `sonner`, `react-hot-toast`)
  - [x] 인라인 메시지 (성공/에러)
  - [x] 모달 다이얼로그 (중요 알림)
- [ ] 키보드 단축키 (선택사항)
  - [ ] Ctrl+Enter - 리뷰 제출
  - [ ] Ctrl+O - 파일 열기
  - [ ] Ctrl+, - 설정 열기

### 5.3 정보 패널 구현

**파일:** `src/renderer/components/InfoPanel.tsx`

- [x] 앱 정보
  - [x] 앱 이름, 버전
  - [x] 간단한 사용 방법
- [ ] API 상태 표시 (선택사항)
  - [ ] Rate limit 잔여량
  - [ ] 마지막 API 호출 시간
- [ ] 도움말 링크
  - [ ] Cafe24 개발자 문서
  - [ ] GitHub Repository (있는 경우)

### 5.4 히스토리 기능 개선

- [x] 히스토리 목록 UI
  - [x] 시간 역순 정렬
  - [x] 타입별 아이콘
  - [x] 상태별 색상
- [ ] 히스토리 필터링
  - [ ] 성공/실패 필터
  - [ ] 단건/일괄 필터
  - [ ] 날짜 범위 선택
- [ ] 히스토리 내보내기
  - [ ] CSV/JSON 다운로드
  - [ ] 클립보드 복사
- [ ] 히스토리 삭제
  - [ ] 개별 삭제
  - [ ] 전체 삭제 (확인 모달)

### 5.5 설정 화면 구현 (선택사항)

**파일:** `src/renderer/components/Settings.tsx`

- [ ] OAuth 설정
  - [ ] Mall ID, Client ID/Secret 입력
  - [ ] 저장 및 불러오기
  - [ ] 로그아웃 버튼
- [ ] 앱 설정
  - [ ] 테마 선택 (라이트/다크)
  - [ ] 언어 선택 (한국어/영어)
  - [ ] 자동 업데이트 확인
- [ ] 고급 설정
  - [ ] Rate limit 제한 커스터마이징
  - [ ] 로그 레벨
  - [ ] 데이터 디렉토리 경로

---

## Phase 6: 예외 처리 및 안정성 보완

### 6.1 네트워크 오류 처리

- [x] 재시도 로직
  - [x] 지수 백오프 (Exponential backoff)
  - [ ] 최대 재시도 횟수 설정 (예: 3회)
  - [ ] 재시도 가능한 에러 분류 (5xx, 타임아웃)
- [ ] 타임아웃 설정
  - [ ] fetch 요청에 timeout 추가
  - [ ] AbortController 사용
- [ ] 오프라인 감지
  - [ ] `navigator.onLine` 모니터링
  - [ ] 오프라인 시 사용자에게 알림
  - [ ] 온라인 복구 시 자동 재시도

### 6.2 토큰 관리 강화

- [x] 토큰 만료 자동 처리
  - [x] API 호출 전 토큰 검증
  - [x] 만료 시 자동 갱신
  - [x] 갱신 실패 시 재로그인 유도
- [ ] Refresh Token 만료 처리
  - [ ] Refresh 실패 시 명확한 에러 메시지
  - [ ] 사용자에게 재인증 요청
  - [ ] 저장된 토큰 삭제
- [ ] 동시 갱신 요청 방지
  - [ ] Mutex/Lock 패턴 적용
  - [ ] 한 번의 갱신만 실행, 나머지는 대기

### 6.3 Rate Limiting 처리

- [ ] 요청 큐 구현
  - [ ] 5 req/sec 제한 준수
  - [ ] 큐에 요청 추가
  - [ ] 순차적 처리 with delay
- [ ] 429 응답 처리
  - [ ] Retry-After 헤더 확인
  - [ ] 지정된 시간만큼 대기 후 재시도
- [ ] 사용자 피드백
  - [ ] Rate limit 초과 시 알림
  - [ ] 예상 대기 시간 표시

### 6.4 데이터 검증 및 에러 방지

- [ ] 입력 검증 강화
  - [ ] Renderer에서 1차 검증 (UX)
  - [ ] Main에서 2차 검증 (보안)
  - [ ] 정규식, 타입 체크
- [ ] Cafe24 API 응답 검증
  - [ ] 예상된 형식 확인
  - [ ] 필수 필드 존재 확인
  - [ ] 타입 안전성 (TypeScript guards)
- [ ] 파일 업로드 검증
  - [ ] 파일 크기 제한 (예: 10MB)
  - [ ] 파일 타입 확인 (MIME type)
  - [ ] 악성 코드 스캔 (선택사항)

### 6.5 로깅 및 모니터링

- [ ] 로깅 시스템 구현
  - [ ] 로그 레벨 (DEBUG, INFO, WARN, ERROR)
  - [ ] 파일 로깅 (`app.getPath('logs')`)
  - [ ] 로그 로테이션 (날짜별, 크기별)
- [ ] Main Process 로깅
  - [ ] API 요청/응답 로그
  - [ ] 에러 스택 트레이스
  - [ ] IPC 호출 로그 (개발용)
- [ ] Renderer Process 로깅
  - [ ] 사용자 액션 로그
  - [ ] UI 에러 로그
  - [ ] 성능 메트릭 (선택사항)
- [ ] 에러 리포팅
  - [ ] 에러 발생 시 자동 로그 저장
  - [ ] 사용자에게 로그 제출 옵션 제공
  - [ ] Sentry 등 에러 추적 서비스 연동 (선택사항)

### 6.6 메모리 및 리소스 관리

- [ ] IPC 리스너 정리
  - [ ] React useEffect cleanup
  - [ ] `removeAllListeners()` 호출
- [ ] 파일 핸들 관리
  - [ ] 스트림 닫기
  - [ ] 임시 파일 삭제
- [ ] 메모리 누수 방지
  - [ ] 큰 객체 참조 해제
  - [ ] 이벤트 리스너 정리
  - [ ] 타이머 해제 (setTimeout, setInterval)
- [ ] 창 닫기 처리
  - [ ] 진행 중인 작업 확인
  - [ ] 사용자에게 종료 확인
  - [ ] 리소스 정리 후 종료

---

## Phase 7: 테스트 및 품질 보증

### 7.1 단위 테스트

- [ ] 테스트 프레임워크 설정
  - [ ] Jest 또는 Vitest 설치
  - [ ] TypeScript 설정
  - [ ] 테스트 환경 구성 (Node, jsdom)
- [ ] Auth Service 테스트
  - [ ] 토큰 교환 함수
  - [ ] 토큰 갱신 로직
  - [ ] 토큰 만료 체크
  - [ ] 파일 저장/로드
- [ ] Review Service 테스트
  - [ ] API 호출 mocking (MSW 사용)
  - [ ] 성공 케이스
  - [ ] 에러 케이스 (401, 429, 500 등)
  - [ ] 재시도 로직
- [ ] 파일 파서 테스트
  - [ ] CSV 파싱 정확성
  - [ ] 유효하지 않은 데이터 처리
  - [ ] 엣지 케이스 (빈 파일, 헤더만 있는 경우)

### 7.2 통합 테스트

- [ ] IPC 통신 테스트
  - [ ] Mock Main/Renderer 프로세스
  - [ ] 채널별 요청/응답 검증
  - [ ] 에러 전파 확인
- [ ] E2E 플로우 테스트
  - [ ] 로그인 → 리뷰 작성 → 제출
  - [ ] 토큰 만료 → 자동 갱신
  - [ ] 일괄 업로드 전체 과정
- [ ] Playwright 또는 Spectron (선택사항)
  - [ ] Electron 앱 자동화 테스트
  - [ ] UI 인터랙션 시뮬레이션

### 7.3 수동 테스트 체크리스트

- [ ] 기능 테스트
  - [ ] ✅ 로그인 플로우
  - [ ] ✅ 단건 리뷰 등록
  - [ ] ✅ 일괄 업로드
  - [ ] ✅ 히스토리 기록
  - [ ] ✅ 설정 저장/불러오기
- [ ] 에러 시나리오
  - [ ] ❌ 네트워크 끊김
  - [ ] ❌ 유효하지 않은 토큰
  - [ ] ❌ 잘못된 API 응답
  - [ ] ❌ 파일 업로드 실패
- [ ] 사용성 테스트
  - [ ] 직관적인 UI
  - [ ] 명확한 에러 메시지
  - [ ] 적절한 로딩 표시
  - [ ] 키보드 탐색 (Tab, Enter)
- [ ] 성능 테스트
  - [ ] 앱 시작 시간 (< 3초)
  - [ ] 리뷰 제출 응답 시간
  - [ ] 100개 일괄 업로드 완료 시간
  - [ ] 메모리 사용량 모니터링

### 7.4 코드 품질 개선

- [ ] Linter 설정
  - [ ] ESLint 설치 및 설정
  - [ ] TypeScript rules
  - [ ] React rules
  - [ ] 자동 수정 스크립트 (`npm run lint:fix`)
- [ ] Formatter 설정
  - [ ] Prettier 설치
  - [ ] 설정 파일 (`.prettierrc`)
  - [ ] Pre-commit hook (Husky + lint-staged)
- [ ] 타입 커버리지
  - [ ] `any` 타입 제거
  - [ ] 모든 public API 타입 정의
  - [ ] strict 모드 유지
- [ ] 코드 리뷰
  - [ ] 주요 로직 검토
  - [ ] 보안 취약점 확인
  - [ ] 성능 최적화 기회
  - [ ] 코드 중복 제거

---

## Phase 8: 빌드 및 배포

### 8.1 프로덕션 빌드 설정

- [ ] 환경 변수 관리
  - [ ] `.env.production` 파일
  - [ ] 민감 정보 제외 (Client Secret 등)
  - [ ] 빌드 시 환경 변수 주입
- [ ] 빌드 스크립트 최적화
  - [ ] `npm run build` 검증
  - [ ] 소스맵 설정 (production: false)
  - [ ] 번들 크기 최적화
  - [ ] Code splitting (선택사항)
- [ ] 빌드 산출물 확인
  - [ ] `dist-electron/main.js` 생성
  - [ ] `dist/` 폴더 구조
  - [ ] 에셋 파일 포함 여부

### 8.2 Electron Builder 설정

- [ ] `electron-builder.yml` 작성 (또는 package.json 내 설정)
  - [ ] App ID, 이름, 버전
  - [ ] 빌드 파일 경로 (files, extraResources)
  - [ ] 아이콘 설정 (macOS: .icns, Windows: .ico)
- [ ] macOS 빌드
  - [ ] DMG 패키징
  - [ ] Code signing (선택사항: Apple Developer 계정 필요)
  - [ ] Notarization (선택사항)
- [ ] Windows 빌드
  - [ ] NSIS 또는 Squirrel installer
  - [ ] Code signing (선택사항: Certificate 필요)
  - [ ] 32bit/64bit 선택
- [ ] Linux 빌드 (선택사항)
  - [ ] AppImage
  - [ ] Deb/RPM 패키지

### 8.3 자동 업데이트 구현 (선택사항)

- [ ] electron-updater 설정
  - [ ] `autoUpdater` 모듈 설정
  - [ ] 업데이트 서버 URL
  - [ ] 버전 체크 로직
- [ ] 업데이트 UI
  - [ ] "업데이트 확인" 버튼
  - [ ] 다운로드 진행률
  - [ ] 재시작 확인 다이얼로그
- [ ] 릴리스 채널 (선택사항)
  - [ ] Stable, Beta, Alpha
  - [ ] 사용자 선택 가능

### 8.4 아이콘 및 브랜딩

- [ ] 앱 아이콘 디자인
  - [ ] 1024x1024 원본
  - [ ] macOS: .icns (다양한 크기)
  - [ ] Windows: .ico (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
  - [ ] Linux: .png
- [ ] 설치 배너 이미지 (선택사항)
  - [ ] Windows installer 배경
  - [ ] macOS DMG 배경
- [ ] About 화면
  - [ ] 앱 정보, 버전
  - [ ] 라이선스 정보
  - [ ] 제작자 정보

### 8.5 배포 준비

- [ ] 릴리스 노트 작성
  - [ ] 버전별 변경 사항
  - [ ] 알려진 이슈
  - [ ] 업그레이드 가이드
- [ ] 사용자 문서 작성
  - [ ] 설치 가이드
  - [ ] 사용 방법 (스크린샷 포함)
  - [ ] FAQ
  - [ ] 트러블슈팅
- [ ] 라이선스 파일
  - [ ] LICENSE.txt
  - [ ] 오픈소스 라이선스 고지 (NOTICES.txt)
- [ ] 배포 채널 준비
  - [ ] GitHub Releases
  - [ ] 자체 호스팅 서버 (선택사항)
  - [ ] CDN 설정 (선택사항)

### 8.6 CI/CD 파이프라인 (선택사항)

- [ ] GitHub Actions 설정
  - [ ] `.github/workflows/build.yml`
  - [ ] 커밋 시 자동 빌드
  - [ ] Pull Request 체크
- [ ] 자동 테스트 실행
  - [ ] 단위 테스트
  - [ ] Linter 체크
- [ ] 자동 배포
  - [ ] 태그 생성 시 릴리스 빌드
  - [ ] GitHub Releases 자동 생성
  - [ ] 업데이트 서버에 업로드

---

## Phase 9: 고급 기능 (선택사항)

### 9.1 이미지 업로드 지원

- [ ] UI 추가
  - [ ] 이미지 선택 버튼
  - [ ] 미리보기
  - [ ] 여러 이미지 선택 (최대 N개)
- [ ] 이미지 처리
  - [ ] 리사이징 (선택사항: sharp, jimp)
  - [ ] 압축
  - [ ] 포맷 변환 (WebP 등)
- [ ] API 연동
  - [ ] Multipart/form-data 요청
  - [ ] 이미지 업로드 엔드포인트
  - [ ] 진행률 표시

### 9.2 다크 모드 지원

- [ ] 테마 시스템 구현
  - [ ] Context API 또는 상태 관리
  - [ ] 로컬 스토리지 저장
- [ ] Tailwind 다크 모드 설정
  - [ ] `darkMode: 'class'` 설정
  - [ ] 모든 컴포넌트에 다크 변형 추가
- [ ] 테마 토글 버튼
  - [ ] Header에 아이콘 버튼
  - [ ] 시스템 테마 따라가기 (선택사항)

### 9.3 다국어 지원 (i18n)

- [ ] i18n 라이브러리 설치
  - [ ] react-i18next
  - [ ] 언어 파일 구조 (`locales/ko.json`, `locales/en.json`)
- [ ] 번역 추가
  - [ ] UI 텍스트
  - [ ] 에러 메시지
  - [ ] 알림 메시지
- [ ] 언어 선택 UI
  - [ ] 설정 화면에 드롭다운
  - [ ] 로컬 스토리지 저장

### 9.4 상품 검색 기능

- [ ] Cafe24 상품 API 연동
  - [ ] `GET /api/v2/admin/products` 호출
  - [ ] 검색어로 필터링
  - [ ] 페이지네이션
- [ ] 자동완성 UI
  - [ ] Combobox 컴포넌트 (shadcn/ui)
  - [ ] 입력 시 실시간 검색
  - [ ] 선택 시 상품 ID 자동 입력

### 9.5 리뷰 수정/삭제 기능

- [ ] 리뷰 목록 조회
  - [ ] API: `GET /api/v2/admin/reviews`
  - [ ] 페이지네이션, 필터링
- [ ] 리뷰 수정
  - [ ] API: `PUT /api/v2/admin/reviews/{review_no}`
  - [ ] 기존 내용 불러오기
  - [ ] 수정 폼
- [ ] 리뷰 삭제
  - [ ] API: `DELETE /api/v2/admin/reviews/{review_no}`
  - [ ] 확인 다이얼로그
  - [ ] 실행 취소 불가 경고

### 9.6 스케줄 업로드

- [ ] 스케줄러 구현
  - [ ] node-cron 라이브러리
  - [ ] 지정된 시간에 업로드 실행
- [ ] UI 추가
  - [ ] 날짜/시간 선택
  - [ ] 스케줄 목록 관리
  - [ ] 활성화/비활성화 토글
- [ ] 백그라운드 실행
  - [ ] Tray icon 표시
  - [ ] 창 닫아도 백그라운드 유지
  - [ ] 알림 (성공/실패)

---

## Phase 10: 유지보수 및 개선

### 10.1 사용자 피드백 수집

- [ ] 피드백 메커니즘
  - [ ] 앱 내 피드백 폼
  - [ ] 이메일 링크
  - [ ] GitHub Issues
- [ ] 분석 도구 (선택사항)
  - [ ] 익명 사용 통계
  - [ ] 에러 발생 빈도
  - [ ] 기능 사용률

### 10.2 버그 수정

- [ ] 버그 트래킹
  - [ ] GitHub Issues 사용
  - [ ] 우선순위 라벨링
- [ ] 정기 패치
  - [ ] 주요 버그는 즉시 수정
  - [ ] 마이너 이슈는 주기적 배포

### 10.3 성능 최적화

- [ ] 프로파일링
  - [ ] Chrome DevTools (Renderer)
  - [ ] Node.js profiler (Main)
  - [ ] 메모리 스냅샷
- [ ] 병목 구간 개선
  - [ ] API 호출 최적화
  - [ ] 불필요한 리렌더링 방지 (React.memo, useMemo)
  - [ ] 큰 파일 처리 스트리밍

### 10.4 보안 업데이트

- [ ] 의존성 업데이트
  - [ ] `npm audit` 정기 실행
  - [ ] 보안 취약점 패치
  - [ ] Electron 최신 버전 유지
- [ ] 보안 검토
  - [ ] OWASP 체크리스트
  - [ ] 침투 테스트 (선택사항)

### 10.5 기능 확장

- [ ] 사용자 요청 기능 추가
  - [ ] 우선순위 평가
  - [ ] 구현 계획 수립
  - [ ] 릴리스 로드맵 공개
- [ ] Cafe24 API 업데이트 대응
  - [ ] API 버전 모니터링
  - [ ] 신규 엔드포인트 활용
  - [ ] Deprecated 기능 대체

---

## 체크리스트 요약

### 필수 기능 (MVP)
- [x] Electron 앱 실행 환경 구축
- [x] OAuth 2.0 인증 및 토큰 관리
- [x] 단건 리뷰 등록
- [x] 일괄 업로드 (부분 구현)
- [x] 기본 UI (React + Tailwind + shadcn/ui)
- [x] 업로드 히스토리

### 중요 기능
- [ ] CSV/Excel 파일 파싱
- [ ] 진행률 표시
- [ ] Rate limiting 처리
- [ ] 에러 처리 및 재시도
- [ ] 로깅 시스템

### 선택 기능
- [ ] 이미지 업로드
- [ ] 다크 모드
- [ ] 다국어 지원
- [ ] 상품 검색 자동완성
- [ ] 리뷰 수정/삭제
- [ ] 스케줄 업로드
- [ ] 자동 업데이트

### 배포 준비
- [ ] 프로덕션 빌드
- [ ] macOS/Windows 인스톨러
- [ ] 사용자 문서
- [ ] 릴리스 노트

---

## 현재 진행 상태

✅ **완료:**
- Phase 1: 프로젝트 초기 설정 (100%)
- Phase 2: OAuth 인증 시스템 (100% - 2.1~2.5 전체 완료)
  - 2.1: Cafe24 앱 등록 및 설정 (환경변수 방식)
  - 2.2: Auth Service 구현 (토큰 관리, 자동 갱신)
  - 2.3: 인증 IPC 채널 설정
  - 2.4: 인증 UI 구현 (Header, useAuth hook)
  - 2.5: OAuth Authorization Flow 구현 (브라우저 + 콜백 서버)
- Phase 3: 단건 리뷰 등록 (80% - API 검증 필요)
- Phase 4: 일괄 업로드 (60% - 파일 파싱 미구현)
- Phase 5: UI/UX 기본 구조 (70%)

🚧 **진행 중:**
- Phase 2.6: OAuth Authorization Flow 테스트 및 edge case 처리
- Phase 4: 파일 파싱 로직
- Phase 5: 히스토리 기능 개선
- Phase 6: 에러 처리 강화

📋 **대기 중:**
- Phase 7-10: 테스트, 빌드, 고advanced 기능, 유지보수

**다음 단계 권장:**
1. OAuth 실제 플로우 테스트 (Cafe24 앱 등록 필요)
2. Cafe24 API 연동 E2E 테스트
3. CSV 파싱 로직 구현 (Phase 4)
4. Rate limiting 및 네트워크 오류 처리 (Phase 6)
5. 프로덕션 빌드 준비 (Phase 8)
