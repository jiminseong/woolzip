# 울집(Woolzip)

가족이 흩어져 있어도 10초 안에 안심 신호·약 복용·감정을 공유하는 PWA입니다. 자동 위치 수집 없이, 사용자가 선택한 최소 정보만 공유합니다.

## 주요 기능
- 안심 신호: 초록/노랑/빨강 + 출발·귀가·식사·취침·기상 원터치 입력(5분 내 되돌리기).
- 약 복용 공유: 약 이름·시간대 등록 후 원탭 복용 기록, 미복용 표시, 리마인드(본인 1회).
- 타임라인/오늘 요약: 가족별 신호·약·감정·참여 이벤트를 한 화면에서 확인.
- 감정 공유: 하루 1회 이모지+한 줄.
- 푸시/오프라인: PWA + 웹 푸시(설치/권한 플로우), 기본 캐싱 및 오프라인 대응.

## 기술 스택
- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS
- Supabase (Auth/DB/Realtime/Edge Functions/Scheduler)
- PWA (Service Worker, Web Push), Vercel 호스팅

## 폴더 구조
- `app/` Next.js App Router 엔트리, API Route Handlers 포함
- `components/` UI 컴포넌트 모음
- `lib/` Supabase 클라이언트 등 공용 유틸
- `public/` manifest, 서비스워커, 아이콘
- `supabase/` 마이그레이션 및 설정
- `docs/` 사용자 가이드

## 시작하기
1) 의존성 설치  
```bash
npm install
```

2) 환경 변수 설정 (`.env.local`)  
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...          # 서버/Edge 사용
NEXT_PUBLIC_KAKAO_CLIENT_ID=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_KEY=...        # Web Push 공개키
VAPID_PRIVATE_KEY=...            # Web Push 비밀키
```

3) 개발 서버  
```bash
npm run dev
```

4) Supabase 동기화  
- `supabase db push`로 마이그레이션 적용  
- RLS/정책은 `supabase/migrations` 및 `scripts/rls-policies.sql` 참고

## 개발 가이드
- 타입/접근성: TypeScript strict, 라벨/aria, focus-visible 유지.
- UI 톤: Pretendard, 큰글자/고대비 지원(`html[data-font]`, `html[data-contrast]`).
- 클라이언트 최소화: RSC 기본, 상호작용 영역만 클라이언트 컴포넌트.
- API 계약: `POST /api/signal`, `POST /api/med/take`, `POST /api/emotion`, `POST /api/sos`, `POST /api/devices/register`, `POST /api/invite/accept`, `GET /api/family/:id/timeline`.

## PWA·푸시
- `public/manifest.webmanifest`, `public/sw.js`로 기본 앱 셸/아이콘 캐시.
- 설치 유도: `components/PWAInstallPrompt`에서 Android/데스크톱 A2HS, iOS 홈화면 추가 배너.
- 푸시 등록: `components/PushPermissionToggle` → `/api/devices/register`로 구독 저장.

## 약 복용 플로우
- 약 등록: 이름 + 시간대(아침/점심/저녁) 저장.
- 복용 기록: `TakePillButton` → `/api/med/take` → `med_logs` 적재, 오늘 중복 방지.
- 요약/타임라인: 복용 이벤트와 미복용 상태 표시.

## 배포
- Vercel 기준: 환경 변수 등록, `npm run build` → `npm run start`.
- PWA/푸시가 필요하므로 HTTPS 환경에서 동작 확인 필수.

## 추가 문서
- `docs/parents-guide.md` 부모님용 안내
- `docs/kids-guide.md` 자녀용 안내
- `OSS_NOTICE.md` 사용 OSS 안내
