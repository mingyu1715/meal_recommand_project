# NutriAI 통합 프론트/백엔드

AI 추천 백엔드(`web_backend/`)와 정적 프론트엔드(루트의 HTML 파일)를 한 번에 실행해 식단 추천·계획·피드백을 테스트할 수 있는 프로젝트입니다. 대시보드에서 추천을 생성해 계획에 담고, My Plan 화면에서 날짜별 일정을 관리하며, 모든 데이터는 Express/Prisma 백엔드와 연동됩니다.

## 폴더 구조

```
web_project/
├─ dashborad.html ······················· 추천/대시보드 화면
├─ myplan.html ·························· 일정/영양 요약 화면
├─ login.html, legistration.html ······· 로그인/가입
├─ detail.html, feedback.html, userprofile.html
├─ js/ ·································· 프론트 전역 스크립트
└─ web_backend/ ························ Express + Prisma 서버
```

## 빠른 시작

### 1. 환경 변수 준비

```bash
cp web_backend/.env.example web_backend/.env
# OPENAI_GPT_KEY, PORT 등을 필요에 맞게 수정
```

### 2. 의존성 설치 및 DB 초기화

```bash
cd web_backend
npm install
npx prisma migrate dev
npm run prisma:generate
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 기동되면 `http://localhost:4000` 에서 정적 파일과 API를 동시에 제공합니다.

### 4. 주요 화면 주소

- 대시보드: `http://localhost:4000/dashborad.html`
- 로그인/가입: `/login.html`, `/legistration.html`
- 식단 계획: `/myplan.html`
- 사용자 프로필: `/userprofile.html`
- 추천 상세/피드백: `/detail.html`, `/feedback.html`

> 운영 환경에서는 정적 파일을 별도 호스팅하거나 CDN으로 서빙하는 것을 권장합니다.

## 핵심 기능 한눈에 보기

| 화면 | 내용 |
| --- | --- |
| **대시보드** (`dashborad.html`) | 무드/카테고리 칩 또는 “Get Recommendation” 버튼으로 AI 추천을 트리거. 각 추천은 이미지를 제거한 카드 형태로 표현되며, “Add to My Plan”을 누르면 원하는 끼니(B/L/D/Snack)에 배치할 수 있습니다. |
| **My Plan** (`myplan.html`) | 오늘 데이터를 기본으로 보여 주고, 좌/우 화살표로 날짜를 이동할 수 있습니다. 다른 날짜는 비어 있는 상태로만 표시해 히스토리를 쉽게 확인할 수 있습니다. 오늘 날짜에서는 직접 식단 이름을 입력해 AI가 영양정보를 추정한 뒤 플랜에 추가할 수 있으며, 각 항목은 “Remove” 버튼으로 삭제할 수 있습니다. |
| **Meal Detail** | 기본 이미지 없이 영양 정보, 서빙 정보, 태그만으로 간결하게 표시합니다. |
| **Feedback** | 최신 추천을 불러와 좋아요/별점/코멘트를 남길 수 있습니다. |
| **세션 관리** | JWT가 `localStorage`에 저장되며, 모든 페이지에서 `js/api.js`가 자동으로 Authorization 헤더를 붙입니다. 30분 동안 활동이 없으면 자동으로 로그아웃 됩니다. |

## 백엔드 하이라이트

- **Express + Prisma + SQLite** (필요 시 다른 DB로 전환 가능)
- **Auth**: JWT + bcrypt, 이메일 또는 닉네임으로 로그인
- **AI 추천**: OpenAI GPT-4o-mini를 사용해 추천/수동 입력 시 영양 추정. 키가 없더라도 내장된 fallback 데이터를 사용합니다.
- **API 레이어** (일부)  
  - `POST /api/recommendations` : 조건에 맞는 식단 추천 생성  
  - `PATCH /api/recommendations/:id` : 상태, 섭취 여부, 끼니(slot) 업데이트  
  - `POST /api/recommendations/manual` : 사용자가 입력한 메뉴명을 기반으로 플랜에 직접 추가  
  - `DELETE /api/recommendations/:id` : 플랜에서 삭제 (수동 입력 식단은 고아 데이터도 정리)  
  - `GET /api/dashboard` : 주간 영양 통계와 추천 요약

자세한 API 설명과 데이터 모델은 `web_backend/README.md`를 참고하세요.

## 개발 팁

- Prisma 스키마를 수정했다면 `npx prisma migrate dev` → `npm run prisma:generate` 순으로 실행해야 합니다.
- OpenAI 키를 설정하면 더 풍부한 추천/영양 추정이 가능하지만, 키가 없어도 기본 추천이 동작합니다.
- 프론트 스크립트는 모두 `js/` 폴더에 있으며, `js/api.js` 를 통해 백엔드와 통신합니다. 특정 페이지에만 필요한 로직은 각 HTML에서 개별 JS 파일을 로드하는 방식입니다.
- 자동 로그아웃(30분) 및 플랜/추천 상태는 전부 클라이언트에서 관리되므로 UX 튜닝 시 `js/session.js`, `js/dashboard.js`, `js/myplan.js`를 우선 확인하세요.

행복한 코딩 되세요! ✨
