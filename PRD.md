---

## 0. 제품 개요

세종(누나)·서울(나)·제천(부모님)처럼 도시가 흩어져 있어도 **10초 안에 핵심 안부**(안심/주의/SOS, 귀가/식사/수면 등)와 **약 복용 여부**를 가족끼리 공유해 **연락은 줄어도 안심은 커지는** 가족 공간을 제공합니다. 과도한 위치·생체 데이터 수집 없이, **내가 선택한 최소 정보**만 공유합니다.

**스택**: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Auth/DB/Realtime/Edge Functions/Scheduler) · Vercel(호스팅) · PWA(Service Worker/Offline/Push).

**핵심 가치**: 원터치·10초·프라이버시·부모 친화 UI.

---

## 1. 배경/문제 정의

- 가족이 각자 바빠 **카톡 빈도 감소 + 형식적 인사**만 반복되는 문제.
- 부모님 세대의 **약 복용/병원 일정**은 걱정 포인트지만, **매번 묻기 애매**함.
- **자동 위치 추적은 거부감** → 사용자가 능동적으로 **최소 정보만 발신**하고, 가족은 결과만 빠르게 확인.

### 문제 가설

1. **입력 마찰**이 높아 안부가 끊긴다 → **원터치/10초** 입력이 필요.
2. **프라이버시 우려**가 높아 방치한다 → **선택적 공유 + 데이터 최소화**가 필요.
3. **부모 UI 난이도**가 높다 → **큰 글자/큰 버튼/확인 단계**로 오조작 방지.

---

## 2. 목표/비목표

### 2.1 목표 (MVP)

- 초록/노랑/빨강 **안심 신호** + **원터치 5버튼**(출발/귀가/식사/취침/기상) **≤ 10초** 기록.
- **약 복용 공유**(이름·시간대·복용 버튼) + **본인 1회 부드러운 리마인드**.
- **가족 타임라인 + 오늘 요약 카드**(마지막 신호/개수/약 상태)로 부모 홈 한 화면 파악.
- **SOS(2단계 확인)** + 가족 상단 경고 배너/전화·문자 링크.
- **개인 설정**(공유 항목, 알림 시간, 큰 글자/고대비, 푸시 허용).
- **감정 공유(이모지+한 줄)** 하루 1회.

### 2.2 비목표 (MVP 제외)

- 자동 위치 추적/지도, 상세 병력·수치, 통화/채팅, 외부 의료 연동, 정교 일정 공유.

---

## 3. 타깃/페르소나

- **부모(50~60대)**: 큰 글자/큰 버튼, 오늘 가족 상태를 **한 화면**에서 파악.
- **자녀(20~30대)**: 바빠도 **원터치**로 신호만 빠르게 남김.
- **형제자매**: **필요 시만 개입** 가능한 맥락(주의/미복용 등)만 수신.

---

## 4. 사용자 스토리

1. 부모로서, 오늘 아침 약을 먹었음을 **버튼 한 번**으로 가족에게 알리고 싶다.
2. 자녀로서, 퇴근 후 집에 도착하면 **귀가 완료(초록)**를 1초 내 남기고 싶다.
3. 형제자매로서, 부모님이 **병원 다녀옴(노랑)**을 남기면 **보는 즉시 인지**하고 필요할 때만 전화하고 싶다.
4. 부모로서, 앱을 열자마자 **스크롤 없이** 오늘 상태 요약을 알고 싶다.
5. 자녀로서, **미복용**이면 부모 본인 스마트폰에만 **부드러운 알림 1회** 가길 원한다.
6. 모두, **감정 이모지+한 줄**로 정서적 연결을 부담 없이 유지하고 싶다.

---

## 5. 범위 (MVP 기능 명세)

### 5.1 안심 신호 (초록/노랑/빨강)

- 유형: `green(안심)/yellow(주의)/red(SOS)`
- 입력: 탭 → `confirm`(필요 시) → `posted` (≤5분 내 `undo` 가능)
- 라벨: 아이콘+텍스트(색맹 대비), 진동(haptic), 음성 피드백(브라우저 지원 시)
- 기록: `created_at` 자동, 사용자 노트 `note`(최대 30자) 선택

### 5.2 원터치 5버튼

- 출발/귀가/식사/취침/기상 → `signals`로 기록(태그 `tag`)
- 보조 토글: "살짝 피곤해요" → `yellow` 보조 플래그

### 5.3 약 복용 공유

- 약 `name` + 시간대 `times[ morning | noon | evening ]`
- **복용 버튼** → `med_logs` 기록(`time_slot`, `taken_at`)
- 리마인드: 설정 시간 +10분 **미복용** 시 **본인에게 1회** 푸시(또는 로컬) → 여전히 없으면 가족 **요약에 노랑 마커**(푸시X)

### 5.4 가족 타임라인 & 오늘 요약

- 타임라인: 시간순(아이콘·색·텍스트), 무한 스크롤(최근 90일)
- 요약 카드(부모 홈 상단): 구성원별 **마지막 신호/시간**, **G/Y/R 개수**, **약 상태(○/—)**

### 5.5 SOS(2단계)

- 1차 빨간 버튼 → 2차 팝업(문구/취소/전송)
- 전송 시 가족 상단 **고정 경고 배너** + 전화/문자 동작 링크

### 5.6 설정

- 공유 항목 토글(신호/약/감정), 알림 시간대, **큰 글자/고대비**, 푸시 허용

### 5.7 감정 공유

- 하루 1회, `emoji` + `text(≤30자)` → 타임라인 및 요약에 정서 점 표시

---

## 6. 정보 구조 & 내비게이션

- 하단 탭: **홈(타임라인)** · **+ (원터치)** · **내 정보(설정/약)**
- 부모 홈 변형: 상단 **오늘 요약 카드(가족별 큰 카드 3~4)** 고정, 하단 타임라인

---

## 7. UX·UI 가이드 (Tailwind 기준)

- 기본: `rounded-2xl`, `shadow-md`, `p-4/6`, `gap-3`
- 타이포: `text-base/large/xl/2xl`, 부모 모드 `text-[18~20px]` 기본
- 버튼: `h-14 min-w-[44px]` 터치 표준, `focus-visible:ring-2`
- 색: Green 500 / Amber 500 / Red 500 + 아이콘 병기
- i18n: 버튼 내 2줄 허용, `min-w`로 축약 방지, 토큰화된 카피 키

---

## 8. 데이터 모델 (Supabase · Postgres)

```sql
-- users
create table public.users (
  id uuid primary key default auth.uid(),
  email text unique,
  display_name text,
  avatar_url text,
  locale text default 'ko-KR',
  created_at timestamptz default now()
);

-- families
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- family_members
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('parent','child','sibling')),
  is_active boolean default true,
  unique(family_id, user_id)
);

-- signals
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text check (type in ('green','yellow','red')) not null,
  tag text check (tag in ('meal','home','leave','sleep','wake','sos') or tag is null),
  note text check (char_length(note) <= 60),
  created_at timestamptz default now(),
  undo_until timestamptz
);

-- medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  times text[] check (times <@ array['morning','noon','evening'])
);

-- med_logs
create table public.med_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete cascade,
  time_slot text check (time_slot in ('morning','noon','evening')),
  taken_at timestamptz default now()
);

-- reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  kind text check (kind in ('med','custom')),
  time_of_day time not null,
  days_mask int default 127, -- 비트마스크(월~일)
  enabled boolean default true
);

-- emotions
create table public.emotions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  emoji text, -- e.g. "😊"
  text text check (char_length(text) <= 60),
  created_at timestamptz default now()
);

-- invites
create table public.invites (
  code text primary key,
  family_id uuid references public.families(id) on delete cascade,
  created_by uuid references public.users(id),
  expires_at timestamptz,
  used_by uuid references public.users(id)
);

-- settings
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete cascade,
  share_signals boolean default true,
  share_meds boolean default true,
  share_emotion boolean default true,
  font_scale text default 'md', -- 'md' | 'lg' | 'xl'
  high_contrast boolean default false,
  push_opt_in boolean default false
);

-- devices
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  device_type text, -- 'ios'|'android'|'desktop'
  push_token text,
  created_at timestamptz default now(),
  last_seen_at timestamptz
);

-- sos_events
create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- indexes
create index on public.signals (family_id, created_at desc);
create index on public.med_logs (user_id, time_slot, taken_at desc);
create index on public.family_members (family_id, user_id);

```

### 8.1 RLS 정책(요약)

- 모든 테이블 **RLS ON**.
- `users`: `auth.uid() = id`만.
- `families/family_members`: 같은 `family_id` 구성원만 `select`.
- `signals/med_logs/emotions/sos_events`: 같은 `family_id`만 `select`; 작성자만 `insert/delete(undo window)`.
- `settings/devices/reminders/medications`: 본인 소유만 CRUD.

```sql
alter table public.signals enable row level security;
create policy select_family_signals on public.signals
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = signals.family_id and fm.user_id = auth.uid()
    )
  );
create policy insert_own_signals on public.signals
  for insert with check (user_id = auth.uid());

```

---

## 9. 실시간/알림/오프라인

- **Realtime**: `family:{id}` 채널로 `signals`, `med_logs`, `emotions` INSERT 구독 → UI 즉시 반영(목표 지연 <1.5s)
- **Web Push(VAPID)**: `devices.push_token` 저장; Edge Function에서 발송
- **리마인드**: Supabase **Scheduler**(5~10분해상도) → 미복용 시 **본인 1회 푸시**
- **오프라인 큐**: IndexedDB(`idb-keyval`)에 POST 보관 → **Background Sync(tag: 'sync:signal', 'sync:med')** 후 재전송
- **SW 캐시**: 앱 쉘/아이콘/폰트 캐시, API GET `stale-while-revalidate`

---

## 10. API 계약 (Edge Functions/Route Handlers)

### 10.1 인증/가족

- `POST /api/invite/accept` → `{ code }` → `family_members` upsert
- `GET /api/family/:id/timeline?cursor=` → `signals|med_logs|emotions` 혼합 피드(서버 정렬)

### 10.2 신호/약/감정/SOS

- `POST /api/signal` → `{ type: 'green'|'yellow'|'red', tag?, note? }` → `signals.insert`
- `POST /api/med/take` → `{ medicationId, time_slot }` → `med_logs.insert`
- `POST /api/emotion` → `{ emoji, text }` → `emotions.insert`
- `POST /api/sos` → `{ }` → `sos_events.insert` + 경고 브로드캐스트

### 10.3 디바이스/푸시

- `POST /api/devices/register` → `{ pushToken, device_type }`

**응답 예시**

```json
{ "ok": true, "id": "uuid", "created_at": "2025-10-27T08:10:00Z" }

```

---

## 11. 상태 머신

- **Signal**: `idle → confirming?(SOS만) → posting → posted (undo≤5m) → archived(>90d)`
- **Reminder**: `scheduled → due → notified(self) → snoozed? → resolved(taken) | escalated(yellow marker)`
- **SW Sync**: `queued → syncing → success | retry(backoff)`

---

## 12. 화면/플로우 (텍스트 와이어)

### 12.1 부모 홈

- [상단] 오늘 요약(가족 카드 3~4: 사진/이니셜, 마지막 신호·시간, G/Y/R, 약 상태)
- [중단] 경고 배너(SOS/주의)
- [하단] 타임라인(무한 스크롤)

### 12.2 자녀 홈 (+버튼)

- 원터치 5버튼(2x3 그리드) + "살짝 피곤해요" 토글
- 최근 내 기록(오늘)

### 12.3 약 관리

- 약 리스트(칩: 아침/점심/저녁) / 복용 버튼 / 기록

### 12.4 SOS

- 전체 레드 화면 → 2단계 확인 → 전송 → 상단 고정 배너

### 12.5 온보딩/초대

- 초대 코드 입력 → 가족 합류 → 푸시 허용 안내 → 큰 글자 모드 안내

---

## 13. 접근성/로컬라이제이션

- WCAG 대비(포커스 링, 색+아이콘 이중 표기, 라벨)
- **큰 글자 모드**: `html[data-font='lg'|'xl']`에 Tailwind 유틸 프록시
- 카피 토큰: `copy.signal.green`, `copy.med.reminder.self`
- 길이 변동 대비: 버튼 2줄, `min-w`·`truncate` 지양

---

## 14. 프라이버시/보안

- **데이터 최소화**: 약 이름·시간대·복용여부만. 병력/수치/자동 위치 **수집 안함**.
- 전송/저장 암호화: TLS, at-rest(클라우드 기본). 관리자 열람 기능 없음.
- 보존: 이벤트 90일(기본), 가족별 삭제/내려받기(후속 계획)
- RLS 전체 적용(상세는 §8.1)

---

## 15. 성능/품질 목표

- 입력 → 타임라인 반영 **p50 < 1.0s / p95 < 1.5s**(실시간)
- 홈 첫 페인트 **< 1.2s**(캐시 상태), 번들 **< 200KB gz**(RSC 분리)
- 버튼 입력 **3탭 이하**, 총 소요 **≤ 10초**

---

## 16. 계측(Analytics) & 모니터링

**이벤트 스키마**

- `signal_posted {type, tag, latency_ms, offline_queued}`
- `med_taken {time_slot, from_reminder, latency_min}`
- `sos_sent {confirmed, time_to_confirm_ms}`
- `emotion_posted {emoji}`
- `install_pwa {browser, result}`
- `push_permission {granted}`

**제품 지표**

- DAU/WAU, 1일 평균 탭 수(1~3회 목표)
- 부모 홈 요약 **스크롤 없이 이해 비율**(세션당 스크롤 0~1회)
- 미복용→복용 전환율 **+20%p**
- NPS/안심감 설문(7점 척도 +4점 이상 목표)

**에러/성능**

- Sentry: 네트워크 실패율, SW 큐 길이, P95 렌더

---

## 17. 기술 설계 (요약)

- Next.js 15 App Router + RSC, Client 컴포넌트는 상호작용 영역으로 최소화
- React 19 Actions/Transitions로 폼 제출·낙관적 UI
- Edge Runtime API(읽기) + Node Runtime API(푸시/서명)
- Tailwind 토큰(semantic 색/크기), 부모 모드 전역 data-attr로 스위칭
- Supabase Auth(매직 링크) + Realtime 채널(`family:{id}`)
- Scheduler로 리마인드, Edge Function으로 Web Push 발송
- SW: Cache-first 정적, SWR(GET), Background Sync(POST)

---

## 18. 테스트 계획

- **단위**: 신호 상태머신, 리마인드 계산, RLS 정책, SW 큐 재시도
- **통합**: 동시 접속 2인 이상 → 전파 지연 < 1.5s
- **e2e**: 원터치→타임라인, SOS 2단계, 미복용→노랑 마커 표시
- **접근성**: 키보드/리더, 콘트라스트, 포커스 이동

---

## 19. 릴리스/일정(4주)

- **1주차(10/27~11/02)**: 문제 정의·합의, 와이어/카피, 스키마·RLS 설계
- **2주차(11/03~11/09)**: Auth/가족 초대/타임라인/원터치/약/리마인드/Realtime/SW 큐
- **3주차(11/10~11/16)**: 접근성·부모 모드·SOS 2단계, 내부 베타(가족)
- **4주차(11/17~11/23)**: UX 마감·계측, 초대 코드 공개, 설치 가이드 3장, 7일 챌린지

---

## 20. 수용 기준 (Acceptance)

- 신호/안부/약/감정 **3탭 이내**, **≤10초** 내 완료
- 동일 가족 기기 간 실시간 반영 **p95 < 1.5s**
- 부모 홈 **무스크롤**로 오늘 요약 이해 가능
- 리마인드: 설정+10분 미입력 시 **본인 1회 푸시**, 가족 요약 **노랑 마커** 표시

---

## 21. 위험/대응

- iOS PWA 푸시 제한 → 설치 가이드, 로컬 알림·홈 화면 추가 유도
- 오조작 → 2단계 확인(SOS), 5분 내 Undo
- 프라이버시 민감 → 수집 최소화·RLS, 공유 항목 사용자 제어
- 네트워크 불안 → SW 오프라인 큐·백그라운드 재시도, 낙관적 UI

---

## 22. 디자인 토큰(예시)

```tsx
export const colors = {
  signal: { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' },
  text: { primary: '#111827', secondary: '#6b7280' },
  bg: { base: '#ffffff', subtle: '#f9fafb' }
};
export const radius = { lg: '1rem', xl: '1.25rem', '2xl': '1.5rem' };
export const spacing = { card: '1rem', section: '1.5rem' };

```

---

## 23. 컴포넌트 명세 (요약)

- `SignalButton(type, tag)`
- `UndoToast(onUndo)`
- `TimelineItem(kind: 'signal'|'med'|'emotion', ... )`
- `TodaySummaryCard(family)`
- `EmotionComposer()`
- `MedicationList()` / `TakePillButton(medId, time_slot)`
- `SOSButton()` / `SOSConfirmModal()`
- `SettingsForm()`

---

## 24. 오픈 질문(Open Questions)

1. 약 이름 공개 범위(가족 내 전원 vs 일부 공유) 세분화 필요성?
2. 감정 공유 공개 범위(모두 vs 선별) 옵션 도입 시 복잡도 증가 허용?
3. 이벤트 보존 기간 90일 → 180일로 늘릴지?

---

## 25. 브랜드/네이밍

- 한글: **울집**
- 영문: **Woolzip** (대안: **Ulzip**)
- 슬로건: **“하루 10초, 우리 가족 안심”**

---

## 26. 부록: 예시 RLS(추가)

```sql
alter table public.med_logs enable row level security;
create policy select_family_medlogs on public.med_logs
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = med_logs.family_id and fm.user_id = auth.uid()
    )
  );
create policy insert_own_medlogs on public.med_logs
  for insert with check (user_id = auth.uid());

```

---

*문서 버전: v0.9 · 2025-10-19*