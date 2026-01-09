# 數據庫遷移和種子數據

## 運行遷移（更新表結構）

### Preview 環境
```bash
cd backend
npx wrangler d1 execute nobodyclimb-db-preview --env preview --file=src/db/migrations/001_add_biography_fields.sql
```

### Production 環境
```bash
cd backend
npx wrangler d1 execute nobodyclimb-db --env production --file=src/db/migrations/001_add_biography_fields.sql
```

## 運行種子數據（插入初始數據）

### Preview 環境
```bash
cd backend
npx wrangler d1 execute nobodyclimb-db-preview --env preview --file=src/db/seeds/001_biography_seed.sql
```

### Production 環境
```bash
cd backend
npx wrangler d1 execute nobodyclimb-db --env production --file=src/db/seeds/001_biography_seed.sql
```

## 完整初始化（新環境）

如果是全新環境，先運行 schema.sql：
```bash
npx wrangler d1 execute nobodyclimb-db-preview --env preview --file=src/db/schema.sql
```

## 查看數據庫內容

```bash
npx wrangler d1 execute nobodyclimb-db-preview --env preview --command="SELECT * FROM biographies"
```
