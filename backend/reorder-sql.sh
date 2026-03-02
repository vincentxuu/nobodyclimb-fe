#!/bin/bash

INPUT="prod-backup.sql"
OUTPUT="prod-ordered.sql"

# 開頭的 PRAGMA
echo "PRAGMA defer_foreign_keys=TRUE;" > $OUTPUT
echo "PRAGMA foreign_keys=OFF;" >> $OUTPUT

# 1. 先建立 users 表（被很多表依賴）
sed -n '/CREATE TABLE IF NOT EXISTS "users"/,/);/p' $INPUT >> $OUTPUT

# 2. 提取所有其他 CREATE TABLE（除了 users）
grep -v "CREATE TABLE IF NOT EXISTS \"users\"" $INPUT | \
  sed -n '/^CREATE TABLE/,/);/p' >> $OUTPUT

# 3. 提取所有 INSERT 語句
grep "^INSERT INTO" $INPUT >> $OUTPUT

# 結尾
echo "PRAGMA foreign_keys=ON;" >> $OUTPUT

echo "Done! Created $OUTPUT"
