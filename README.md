# United Ad 프론트엔드

팀별 워크스페이스, 멤버 초대·관리, Meta 광고 자산과 네이버 스마트스토어 연결을 제공하는 React 애플리케이션입니다.
React 19, TypeScript, Vite, React Router, styled-components, Axios를 사용합니다.

## 실행

Node.js와 npm을 준비하고 `ad-frontend` 디렉터리에서 실행합니다.

```sh
npm ci
npm run dev
```

개발 서버 기본 주소는 `http://localhost:3400`입니다.
개발 설정은 `/api`와 `/open-api` 요청을 `http://localhost:8480`의 백엔드로 프록시합니다.
로그인·가입·워크스페이스 기능을 실제로 사용하려면 백엔드가 실행되어 있어야 합니다.

## 환경 변수

필요한 값은 프로젝트 루트의 `.env.local`에 설정합니다.

```dotenv
VITE_API_BASE_URL=
VITE_API_ORIGIN=http://localhost:8480
```

| 변수 | 용도 |
| --- | --- |
| `VITE_API_BASE_URL` | 일반 API 요청과 토큰 갱신의 기본 주소. 비워 두면 현재 origin의 상대 경로를 사용합니다. |
| `VITE_API_ORIGIN` | Meta 인증 시작 요청이 직접 호출할 API origin. 개발 기본값은 `http://localhost:8480`입니다. |

Meta 인증 시작 요청에는 쿠키를 포함하므로 서버의 CORS·쿠키·OAuth 콜백 설정도 필요합니다.
`VITE_` 변수는 브라우저 코드에 노출되므로 비밀 키를 넣지 않습니다.

## 주요 구조

```text
src/
  api/                 API 요청, 토큰 갱신, 오류 처리
  auth/                인증 컨텍스트와 세션
  components/          레이아웃, 인증 및 공통 UI
  hooks/               화면별 요청·폼·상태 관리
  pages/               랜딩, 로그인, 가입, 워크스페이스 화면
  styles/              공통 테마와 전역 스타일
  types/               API 및 도메인 타입
```

공개 페이지와 작업 화면은 서로 다른 레이아웃을 사용합니다.
Meta와 네이버 스마트스토어 연동을 제공하며 Threads·Coupang은 준비 중입니다.
네이버 검색광고, 상품·주문 처리는 현재 지원 범위에 포함하지 않습니다.
네이버 연결은 소유자가 커머스 API의 앱 ID·시크릿으로 진행합니다. `SELF`는 내스토어용이며 `SELLER`는 대상 판매자의 ID 또는 UID도 입력합니다.
네이버 일반 로그인용 자격 증명과 다르며, 브라우저 OAuth 콜백이 필요하지 않습니다. 연결 후 소유자·멤버가 한 번에 최대 100개 스마트스토어 채널을 선택·저장할 수 있습니다.
상세 화면·상태·요청은 각각 `NaverConnectionsPage.tsx`, `useNaverConnections.ts`, `api/naverConnections.ts`에서 관리합니다.
화면 목록과 UX/UI 변경 및 검증 범위는 [프론트엔드 UX/UI 분석 문서](docs/FRONTEND_UX_REVIEW.md)를 참고하세요.

## 검증과 빌드

```sh
npm run lint
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. `preview`는 로컬 빌드 확인용 서버입니다.
배포 서버에는 SPA 경로가 `index.html`로 연결되도록 fallback 설정을 적용하고 API 접근 경로를 별도로 구성해야 합니다.
브라우저 기반 UI 검증은 모킹한 API로 진행했으며 실제 서버·Meta OAuth·네이버 운영 계정 연결 검증과 구분합니다.
