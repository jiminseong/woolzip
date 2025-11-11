# GITHUB_CONVENTION.md – 울집(Woolzip) GitHub 운영 규칙

리포지토리 전역에 적용되는 브랜치/커밋/PR/릴리스 규칙입니다. 제품/코드 지침은 `AGENTS.md`를 따르세요.

## 1) 브랜치 전략
- 기본 브랜치: `main`(보호). 배포 기준입니다.
- 작업 브랜치: `type/scope/short-topic`
  - 예: `feat/ui/signal-button`, `fix/api/sos-confirm`, `chore/infra/supabase`
- 긴급 수정: `hotfix/vX.Y.Z-short` → PR 후 태깅.

## 2) 이슈 규칙
- 제목: `[scope] one-line summary` (영문/국문 자유)
- 스코프 예: `ui`, `api`, `sw`, `db`, `a11y`, `perf`, `sec`, `docs`.
- 라벨 세트: `feature`, `bug`, `a11y`, `performance`, `security`, `privacy`, `data`, `docs`, `design`, `good-first-issue`.
- 본문 포함: 문제/배경, 수용 기준(AC), PRD 참조 섹션, 위험/리스크, 스크린샷 또는 와이어.

## 3) 커밋 메시지(Conventional Commits)
- 형식: `type(scope): summary`
- type: `feat|fix|chore|refactor|docs|test|perf|build|ci|revert`
- scope 예: `app|api|sw|db|ui|a11y|perf|sec|copy|i18n`
- 본문에 동기/변경 포인트·브레이킹 체인지(`BREAKING CHANGE:`) 명시.

## 4) Pull Request 규칙
- 제목: `type(scope): summary` (가능하면 커밋 형식 유지)
- Draft로 시작해도 좋지만, 리뷰 준비되면 Ready로 전환.
- 설명 템플릿(필수 항목):
  - 문제/목표: 왜 이 변경이 필요한가
  - 변경 요약: 핵심 변경 사항(파일/컴포넌트/엔드포인트)
  - PRD 참조: 관련 섹션(예: §10 API, §11 상태 머신)
  - 스키마/RLS 변경 여부: 쿼리/DDL 스니펫 또는 링크
  - 스크린샷/동영상: UI, 실시간/오프라인 흐름 증빙
  - 테스트 계획: 단위/통합/e2e 및 결과 요약
  - 성능 체크: 번들 영향, 실시간 지연, 네트워크 왕복 수
  - 접근성 체크: 포커스/대비/리더
  - 보안/프라이버시 체크: 민감정보 노출 여부, RLS 준수
- 리뷰 승인: 최소 1명 승인. 스키마/PRD/AGENTS 변경은 2명 권장.
- 작은 PR 권장(기능 단위). 대형 변경은 기능 깃발/점진적 병합.

### PR 체크리스트(붙여넣어 사용)
- [ ] PRD 섹션 링크 포함
- [ ] 타입 안전(Strict TS), 클라이언트 코드 최소화
- [ ] API 입력 스키마 검증 및 에러 코드 적절
- [ ] RLS 전제 만족 및 권한 테스트
- [ ] 접근성·부모 모드 확인
- [ ] 성능 예산 준수(번들/지연)
- [ ] 테스트(단위/통합/e2e) 추가/수정
- [ ] 스크린샷/영상 첨부(해당 시)

## 5) 릴리스/버저닝
- 태그: `vX.Y.Z` (SemVer)
- 노트: GitHub Releases에 하이라이트(Feat/Fix/Refactor/Docs/Breaking)와 마이그레이션 가이드.
- 핫픽스: `hotfix/` 브랜치 → PR → 태깅 → 핫픽스 노트.

## 6) CI 기본 원칙
- 머지 전 통과 항목: 타입체크, 빌드, 테스트, 린트.
- 보안: 시크릿은 GitHub Secrets 사용. 커밋에 시크릿/토큰 금지.

## 7) 보호 리소스
- 다음 파일 변경은 PR 설명에 명시하고 추가 리뷰 확보:
  - `PRD.md`, `AGENTS.md`, `GITHUB_CONVENTION.md`, `.github/*`

## 8) 변경 로그
- Conventional Commits 기반 자동 릴리스 노트 권장. 별도 `CHANGELOG.md`를 유지할 경우 릴리스 시점에 동기화.

## 9) 코드/카피 언어
- 코드/식별자/주석: 영어 우선. UI 카피는 i18n 토큰(한국어 기본), 실제 문자열은 리소스에서 관리.

---
문서/규칙이 상충할 경우: 제품 동작(AGENTS.md) > 운영 규칙(본 문서) 순으로 해석합니다.

