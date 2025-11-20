-- Migration: Add username column to users table
-- Date: 2025-11-21
-- Description: 기존 email 기반 인증에서 username 기반 인증으로 변경

BEGIN;

-- 1. users 테이블에 username 컬럼 추가 (일단 nullable로)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username text;

-- 2. 기존 사용자들을 위한 임시 username 생성 (email의 @ 앞부분 사용)
UPDATE public.users 
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- 3. username을 NOT NULL 및 UNIQUE로 설정
ALTER TABLE public.users 
ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.users 
ADD CONSTRAINT users_username_unique UNIQUE (username);

-- 4. 인덱스 추가 (로그인 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_username 
ON public.users (username);

COMMIT;