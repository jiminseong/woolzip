# AGENTS.md – 울집(Woolzip) 에이전트 작업 가이드

이 문서는 본 리포지토리 전체 트리에 적용되는 작업 지침입니다. PRD.md를 구현하는 과정에서 일관된 설계, 코딩 스타일, 성능/접근성/보안 기준을 보장하기 위해 작성되었습니다. 더 구체적인 지침이 하위 디렉터리에 추가되면 그 지침이 우선합니다.

GitHub 브랜치/커밋/PR/릴리스 운영 규칙은 `GITHUB_CONVENTION.md`를 반드시 따르세요. 본 문서는 제품/코드 지침에 중점을 둡니다.

## 1) 제품 맥락 요약
- 목표: 가족 간 최소 정보(안심 신호·원터치 활동·약 복용·감정)를 10초 이내로 공유. 자동 위치 수집 없음, 프라이버시 우선.
- 핵심: 원터치·10초·프라이버시·부모 친화 UI. PWA + 실시간 반영 + 오프라인 큐 + 리마인드.
- 기술 스택: Next.js 15(App Router) · React 19 · TypeScript · Tailwind CSS · Supabase(Auth/DB/Realtime/Edge Functions/Scheduler) · Vercel · PWA(Service Worker/Offline/Push).

## 2) 폴더 구조(권장)
리포지토리 루트에 Next.js(App Router) 프로젝트를 둡니다.
- `app/` – App Router 엔트리. 서버 컴포넌트 기본, 상호작용 영역만 클라이언트 컴포넌트 사용.
  - `app/api/*` – Route Handlers(API). 읽기 API는 Edge Runtime, 푸시/서명 등은 Node Runtime.
  - `app/(home)/*` – 홈/요약/타임라인 화면.
  - `app/(me)/*` – 내 정보/설정/약 관리.
- `components/` – UI 컴포넌트. 아래 명세를 기본 파일명으로 사용.
- `lib/` – 런타임 공용 유틸. 예: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/realtime.ts`, `lib/idb.ts`, `lib/analytics.ts`.
- `styles/` – 글로벌 CSS(필요시). Tailwind 설정은 루트.
- `public/` – 아이콘/이미지/manifest.
- `workers/` – Service Worker 및 푸시 핸들러(번들링 전략에 맞게). 
- `scripts/` – 스키마/마이그레이션/도구 스크립트(선택).

## 3) 코딩 컨벤션
- TypeScript: `strict` 유지. 명시적 타입 우선. 널 안정성 신경 쓸 것.
- 파일/컴포넌트:
  - 컴포넌트 파일: PascalCase, 훅/유틸: camelCase, 폴더/경로: kebab-case.
  - 클라이언트 컴포넌트는 파일 상단 `'use client'` 명시. 상호작용·효과가 필요한 최소 영역에 한정.
  - 서버 전용 코드는 서버 경계 밖으로 새지 않도록 `lib/*`를 server/client로 분리.
- 스타일: Tailwind 유틸 우선. 의미(semantic) 토큰화를 선호. 예) `text-token-primary`, `bg-token-card` 등(구현은 Tailwind theme/플러그인으로 위임).
- 접근성: 포커스 링 유지(`focus-visible`), 색+아이콘 이중 표기, 라벨/aria 속성 필수. 부모 모드(큰 글자/고대비)를 `html[data-font]`, `html[data-contrast]`로 스위칭.
- 상태 머신: PRD §11 상태 전이를 준수. 부정확한 상태 전이는 테스트로 방지.
- 에러 처리: 사용자 피드백 우선(토스트/배너), 로깅은 Sentry 훅으로 집계.

## 4) 핵심 컴포넌트 명세(파일명 고정 권장)
- `components/SignalButton.tsx` – `props: { type: 'green'|'yellow'|'red', tag?: 'meal'|'home'|'leave'|'sleep'|'wake'|'sos', onPosted? }`
- `components/UndoToast.tsx` – `props: { onUndo: () => void, until?: Date }`
- `components/TimelineItem.tsx` – `props: { kind: 'signal'|'med'|'emotion', data: ... }`
- `components/TodaySummaryCard.tsx` – `props: { familyId: string }`
- `components/EmotionComposer.tsx`
- `components/MedicationList.tsx`
- `components/TakePillButton.tsx` – `props: { medicationId: string, time_slot: 'morning'|'noon'|'evening' }`
- `components/SOSButton.tsx` / `components/SOSConfirmModal.tsx`
- `components/SettingsForm.tsx`

구성/이름은 PRD §23을 그대로 반영합니다. 변경 시 PRD와 본 문서를 함께 업데이트하세요.

## 5) API/라우트 계약(반드시 준수)
Route Handlers는 다음 계약을 지킵니다(PRD §10).
- `POST /api/invite/accept` → `{ code }` → 가족 합류 upsert
- `GET /api/family/:id/timeline?cursor=` → 신호/약/감정 혼합 피드(서버 정렬)
- `POST /api/signal` → `{ type, tag?, note? }`
- `POST /api/med/take` → `{ medicationId, time_slot }`
- `POST /api/emotion` → `{ emoji, text }`
- `POST /api/sos` → `{}`
- `POST /api/devices/register` → `{ pushToken, device_type }`

규칙:
- 읽기 API는 Edge Runtime(캐시·SWR 고려), 푸시 발송/서명 등은 Node Runtime 사용.
- 표준 응답: `{ ok: boolean, id?: string, created_at?: string, error?: { code, message } }`.
- 모든 입력은 스키마 검증(Zod 등). 잘못된 입력은 400, 권한 문제는 403/401.

## 6) 데이터 모델·RLS·접근(필수 수칙)
- 테이블은 PRD §8 스키마를 준수. RLS는 §8.1의 정책을 최소 기준으로 유지.
- 쿼리 원칙:
  - 모든 `select/insert`는 세션 사용자(`auth.uid()`) 기준. `family_id` 교차 접근 금지.
  - `signals/med_logs/emotions/sos_events`는 동일 `family_id`에만 노출.
  - `settings/devices/reminders/medications`는 본인 소유만 CRUD.
- 인덱스는 제시된 것 유지/보강. 타임라인는 `(family_id, created_at desc)` 사용.
- Undo 윈도(≤5분)는 클라이언트·서버에서 모두 강제(서버에서 최종 검증).

## 7) 실시간·푸시·오프라인
- Realtime 채널: `family:{id}` 구독으로 `signals`, `med_logs`, `emotions` INSERT 반영. 목표 지연 p95 < 1.5s.
- Web Push: 디바이스 토큰은 `devices` 저장. 발송은 Edge Function/Node API에서 수행.
- 리마인드: Supabase Scheduler(5~10분 해상도). 미복용 시 본인 1회 푸시, 가족 요약에는 노랑 마커(푸시 없음).
- 오프라인: IndexedDB(idb-keyval)로 POST 큐잉. Background Sync tag: `sync:signal`, `sync:med`.
- 캐시: 앱 쉘/아이콘/폰트 캐시, API GET은 `stale-while-revalidate`.

## 8) UX·UI 지침(Tailwind 기준)
- 카드/레이아웃: `rounded-2xl`, `shadow-md`, `p-4/6`, `gap-3`.
- 타이포: 기본 `text-base/large/xl/2xl`. 부모 모드: `text-[18~20px]`.
- 버튼: `h-14 min-w-[44px]`, `focus-visible:ring-2`.
- 색: Green 500 / Amber 500 / Red 500 + 아이콘 병기(색맹 대비). 
- i18n: 버튼 2줄 허용, 축약 방지(`min-w` 확보). 카피는 토큰 키 기반.

## 9) 성능/품질 목표(프리 체크)
- 실시간 반영: 입력→타임라인 p50 < 1.0s / p95 < 1.5s.
- 초기 로드: 홈 FCP < 1.2s(캐시 시), 번들 < 200KB gz. RSC로 분할.
- 조작 수: 3탭 이내, 총 소요 ≤ 10초.

PR 전 자가 점검 체크리스트:
- [ ] 중량 컴포넌트 RSC 분리, 클라 코드 최소화
- [ ] 이미지/아이콘 최적화, 지연 로드
- [ ] 불필요한 Realtime 구독/리스너 해제
- [ ] API/DB 왕복 수 최소화, 배치/캐시 검토

## 10) 계측/로그
- Analytics 이벤트(필수):
  - `signal_posted {type, tag, latency_ms, offline_queued}`
  - `med_taken {time_slot, from_reminder, latency_min}`
  - `sos_sent {confirmed, time_to_confirm_ms}`
  - `emotion_posted {emoji}`
  - `install_pwa {browser, result}`
  - `push_permission {granted}`
- 에러/성능: Sentry에 네트워크 실패율, SW 큐 길이, P95 렌더 업로드.

## 11) 테스트 전략
- 단위: 신호 상태머신, 리마인드 계산, RLS 정책, SW 큐 재시도 로직.
- 통합: 2명 이상 동시 접속 시 실시간 전파 p95 < 1.5s 확인.
- e2e: 원터치→타임라인, SOS 2단계, 미복용→노랑 마커.
- 접근성: 키보드/리더, 콘트라스트, 포커스 이동 시나리오.

## 12) 보안/프라이버시 수칙
- 데이터 최소화 준수: 병력/수치/자동 위치 수집 금지. 약 이름·시간대·복용 여부만.
- 관리자 가시성 없음 전제. RLS 전제 위배되는 임시 백도어 금지.
- 전송/저장 암호화(TLS/at-rest). 로그에 민감 정보 기록 금지.
- 이벤트 보존 기본 90일. 변경 시 PRD·이 문서 동시 업데이트.

## 13) 로컬 실행(요약)
- 환경변수: Supabase URL/ANON KEY, VAPID 키, Sentry DSN(옵션).
- 의존성 설치: `pnpm i` 또는 `npm i`.
- 개발 서버: `pnpm dev`(Next 15).
- Supabase: 로컬 또는 프로젝트 키 사용. RLS 켜진 상태로 테스트 권장.

## 14) 작업·리뷰 흐름
자세한 운영 규칙은 `GITHUB_CONVENTION.md`를 따릅니다. 아래는 핵심 요약입니다.
- 작은 PR를 선호. UI/상태/서버를 나눠 단계적 제출.
- PR 설명에 관련 PRD 섹션 링크와 영향 범위를 명시.
- 토큰/카피/상태머신/스키마 변경 시 스냅샷·스크린샷·쿼리 예시 첨부.
- Realtime/오프라인·백그라운드 동작은 비디오·gif로 증빙.

## 15) 금지/주의
- 자동 위치 추적, 과도 데이터 수집, 침투적 알림(본인 1회 원칙 위반) 금지.
- 부모 모드에서 가독성 저하(작은 폰트/저대비) 금지.
- RLS 우회 로직/서버 비검증 입력 금지. 모든 입력은 검증/권한 확인 필수.

## 16) 오픈 이슈 동기화
PRD §24의 오픈 질문은 의사결정 후 본 문서와 스키마/설정을 동시 갱신하세요.
- 약 이름 공개 범위 세분화 필요시 `share_meds_scope` 등 설정 도입 검토.
- 감정 공개 범위 옵션은 UI 복잡도/가치 트레이드오프 분석 후 결정.
- 이벤트 보존기간 90→180일 변경 시 인덱스/스토리지 비용 점검.

---

최종 수정 시에는 PRD와 본 문서를 함께 유지보수해 일관성을 보장해주세요. 본 AGENTS.md는 리포 전역에 적용됩니다.
