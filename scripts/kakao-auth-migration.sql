-- 카카오 소셜 로그인을 위한 스키마 수정
-- Date: 2025-11-21

BEGIN;

-- 1. username을 nullable로 변경 (카카오 로그인에서는 선택사항)
ALTER TABLE public.users 
ALTER COLUMN username DROP NOT NULL;

-- 2. kakao_id 컬럼 추가 (카카오 고유 ID 저장)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS kakao_id text;

-- 3. kakao_id 유니크 제약조건 추가
ALTER TABLE public.users 
ADD CONSTRAINT users_kakao_id_unique UNIQUE (kakao_id);

-- 4. kakao_id 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_kakao_id 
ON public.users (kakao_id);

-- 5. 기존 username 제약조건을 nullable 허용으로 변경
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_username_unique;

ALTER TABLE public.users 
ADD CONSTRAINT users_username_unique UNIQUE (username);

COMMIT;