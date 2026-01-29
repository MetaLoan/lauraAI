-- 修复 birth_time 字段类型的 SQL 脚本
-- 使用方法: psql -h localhost -U postgres -d lauraai -f fix-birth-time.sql

-- 方法1: 直接修改字段类型（如果字段为空或可以转换）
ALTER TABLE users ALTER COLUMN birth_time TYPE time without time zone USING birth_time::text::time;

-- 如果方法1失败，使用方法2: 删除并重新创建字段
-- ALTER TABLE users DROP COLUMN IF EXISTS birth_time;
-- ALTER TABLE users ADD COLUMN birth_time time without time zone;
