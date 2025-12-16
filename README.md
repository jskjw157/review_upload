# review_upload

# 📌 데스크탑 리뷰 자동 등록 앱 기획서

**(Electron + Node.js + TypeScript 기반, 로컬 실행 전용)**

---

## 🧩 1. 앱 개요

**앱 이름:**

*Cafe24 Local Review Manager*

**앱 목적:**

카페24 쇼핑몰에 **자동으로 리뷰 업로드/관리** 기능을 제공하는 로컬 데스크탑 앱

→ 로컬에서 실행되며 인증부터 리뷰 등록까지 자동 처리

**대상 플랫폼:**

✔ macOS

✔ Windows

(Electron을 통해 공통 코드로 실행 가능) [위키백과](https://en.wikipedia.org/wiki/Electron_%28software_framework%29?utm_source=chatgpt.com)

---

## 🧠 2. 주요 기능

### 📌 1) 로그인 / 인증

- 카페24 **OAuth 2.0 인증**
- 액세스 토큰 획득 및 로컬 저장
- 토큰 만료 시 재발급 처리

### 📌 2) 리뷰 업로드

- 텍스트 리뷰 작성
- 별점(score)
- (추후 옵션) 사진 업로드

### 📌 3) 리뷰 목록 보기

- 업로드된 리뷰 리스트 표시
- 수정/삭제 옵션

### 📌 4) 자동 업로드 모드

- 폴더/CSV/엑셀 기반 리뷰 일괄 업로드
- 성공/실패 로그 보기

---

## 🎨 3. UI/UX 구조

```
▶ 로그인 화면
  └ API 인증 버튼
     → 로그인/토큰 저장

▶ 메인 화면
  ├ 리뷰 입력 폼
        • 상품 선택(dropdown)
        • 별점
        • 리뷰 텍스트
        • 이미지 첨부 버튼
  ├ 리뷰 업로드 버튼
  ├ 자동 업로드 탭
        • 파일 선택 (.csv, .xlsx)
        • 실행 버튼
  ├ 리뷰 기록 리스트

```

---

## 📦 4. 기술 스택

| 구성 요소 | 기술 |
| --- | --- |
| UI 프레임워크 | Electron + HTML/CSS/TypeScript |
| 백엔드 로직 | Node.js (TypeScript) |
| HTTP 통신 | `axios` |
| OAuth 인증 | Node 로컬 OAuth flow |
| 패키지 관리 | npm |
| 빌드 도구 | Electron Forge / Electron Builder |

# **개발 Task**

---

## **1. 기본 프로젝트 준비**

먼저 전체 구조를 준비해야 해.

### ➤ 프로젝트 초기화

Electron + Node.js + TypeScript 프로젝트를 생성해.

TypeScript 설정파일(tsconfig.json)을 만들고, Electron에서 TypeScript로 빌드가 되도록 설정해.

### ➤ 패키지 설치

필요한 라이브러리를 설치해.

예를 들면 Electron 자체, TypeScript, HTTP 요청 라이브러리(예: axios), 그리고 OAuth 처리를 도와줄 라이브러리를 설치해.

---

## **2. OAuth 인증 기능 구현**

카페24 API를 사용하려면 **OAuth 2.0으로 인증 토큰을 받아야 해**.

### ➤ 카페24 앱 등록

쇼핑몰 관리자에서 앱을 하나 등록하고, Client ID/Secret을 확보해. 이 정보가 나중에 OAuth 인증에 필요해. [Mindful Analytics](https://seheeopark.rbind.io/posts/how-to-use-cafe24-api/?utm_source=chatgpt.com)

### ➤ 인증 URL 생성

앱에서 인증을 시작하면 카페24의 OAuth 로그인 페이지를 브라우저로 띄워줘야 해. Electron에서 브라우저 창을 띄워 사용자로 하여금 로그인을 시도하게 하고, 인증 코드(authorize code)를 받아오는 방식이야.

### ➤ Access Token 교환

토큰 발급 엔드포인트로 인증 코드와 Client ID/Secret을 보내서 **access_token 및 refresh_token**을 받아와야 해.

### ➤ 토큰 저장 및 관리

발급받은 토큰은 로컬 파일에 저장해.

토큰이 만료되면 **refresh_token**을 사용해 갱신할 때도 로직을 만들자.

---

## **3. 리뷰 등록 기능 구현**

카페24 **Admin API**에는 리뷰를 등록할 수 있는 엔드포인트가 있어. [partners.cafe24.com](https://partners.cafe24.com/docs/en/api/admin/?utm_source=chatgpt.com)

아래 같은 흐름으로 구현해:

### ➤ 리뷰 등록 UI 만들기

앱 화면에 상품 선택, 별점 입력, 리뷰 텍스트 입력란 등을 구성해 주자.

### ➤ API 호출 구현

사용자가 리뷰를 작성하고 “등록” 버튼을 누르면, **Node.js 코드**에서 카페24 Admin API의 리뷰 등록 엔드포인트를 호출해.

API 호출 시에는 반드시 **access_token을 포함한 HTTP 요청**을 해야 해. [Cafe24 개발자](https://developers.cafe24.com/docs/api/?utm_source=chatgpt.com)

### ➤ 응답 처리

등록 성공 시 성공 메시지를 띄우고 실패하면 에러 내용을 표시하도록 처리해.

---

## **4. 리뷰 일괄 업로드 기능**

나중에 파일 기반으로 여러 리뷰를 한 번에 등록하고 싶을 수 있으니 기능을 만들 거야.

### ➤ 파일 선택 UI

사용자가 CSV 혹은 Excel 파일을 선택할 수 있는 UI를 만들어.

### ➤ 파일 파싱

선택한 파일을 읽어서, 각 행을 **리뷰 정보 객체**로 변환하는 로직을 추가해.

### ➤ 자동 업로드 루프

파싱된 리뷰들을 하나씩 API 호출로 보내면서 처리 상태를 실시간으로 로그처럼 표시해.

---

## **5. 로컬 저장 & 기록 보기**

로컬에서 동작하면서 리뷰 등록 결과나 인증 토큰 등을 유지해야 하므로 저장소를 마련하자.

### ➤ Config/Token 저장

Token, 앱 설정 등은 로컬 JSON 파일 또는 별도 파일로 저장해.

### ➤ 업로드 이력 저장

성공/실패한 리뷰들을 로컬에 저장해서 나중에 “리뷰 업로드 기록” 화면에서 확인할 수 있도록 해.

---

## **6. UI/UX 개선**

앱이 단순히 기능만 있는 것이 아니라, 실제 쓸 때 편하게 만들어야 해.

### ➤ 입력 유효성 확인

별점, 리뷰 텍스트 같은 필수 정보가 입력되지 않은 상태에서는 등록 버튼을 비활성화하거나 경고를 띄워줘.

### ➤ 스타일링

Electron의 HTML/CSS로 보기 좋게 스타일을 적용해.

### ➤ Dark/Light 모드 옵션

추가 옵션으로 모드를 바꿀 수 있게 만들어도 좋아.

---

## **7. 예외 처리 및 안정성 보완**

API 호출 중 에러가 발생할 수 있으니까 안정적으로 처리해야 해.

### ➤ 네트워크 오류 대응

서버에 요청이 실패할 때 재시도 로직 등을 넣어줘.

### ➤ 토큰 만료 대응

API 호출 시 “토큰 만료” 에러가 발생하면 자동으로 **refresh_token**을 사용해 토큰을 갱신하고 재요청하도록 하는 로직을 넣자.

---

## **8. 필요하면 이미지 업로드 옵션 추가 (추후항목)**

현재는 텍스트 + 별점 위주로 구현하겠지만, 나중에 이미지 첨부 리뷰도 추가하고 싶다면 API 문서에 따라 multipart/form-data 형식으로 업로드를 구현하면 돼. 이 부분은 선택 기능이야.

---

## **정리 — 작업 순서 흐름**

1. 프로젝트 생성 & Electron 실행 확인
2. OAuth 인증 구현
3. 리뷰 단건 등록 기능
4. 리뷰 일괄 업로드 기능
5. 결과 로그/기록 보기
6. UI/UX 개선
7. 예외 처리 보완
8. (선택) 이미지 업로드

---

## **참고**

✔ 카페24 Admin API는 **OAuth 2.0 인증 필수**이고, RESTful API로 JSON 요청/응답을 사용해. [Cafe24 개발자](https://developers.cafe24.com/docs/api/?utm_source=chatgpt.com)

✔ 리뷰 관련 API는 `POST /api/v2/admin/reviews` 같은 엔드포인트로 리뷰를 등록할 수 있어. [partners.cafe24.com](https://partners.cafe24.com/docs/en/api/admin/?utm_source=chatgpt.com)
