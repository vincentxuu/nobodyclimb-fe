-- Seed data: Insert initial biography data
-- This matches the static data from src/data/biographyData.ts
-- Note: climbing_reason and advice fields have been deprecated and removed

INSERT INTO biographies (
  id, user_id, name, slug, title, bio, avatar_url, cover_image,
  climbing_start_year, frequent_locations, favorite_route_type,
  climbing_meaning, bucket_list,
  achievements, social_links, is_featured, is_public, published_at, created_at, updated_at
) VALUES
  ('bio_001', NULL, '謝璿', 'xie-xuan', NULL, NULL, '/photo/personleft.jpeg', '/photo/person-poto.jpg', '2022', '各大天然岩場、波浪岩館', '差一點快爬完但爬不完的都喜歡', '生活規律有目標、有運動、有社交', '大牆攀登', NULL, NULL, 1, 1, '2023-01-02', datetime('now'), datetime('now')),
  ('bio_002', NULL, '宜真', 'yi-zhen', NULL, NULL, '/photo/personmid.jpeg', '/photo/person-poto.jpg', '2022', '千光寺、關子嶺', '需要思考不能一次完攀的路線', '內心的寶藏，賦予了我生活上奇妙的意義，引向我遵循往前的動力', '出國上攀/抱石', NULL, NULL, 1, 1, '2023-01-02', datetime('now'), datetime('now')),
  ('bio_003', NULL, '小若', 'xiao-ruo', NULL, NULL, '/photo/personright.jpeg', '/photo/person-poto.jpg', '2022', '各大天然岩場、波浪岩館', '差一點快爬完但爬不完的都喜歡', '生活規律有目標、有運動、有社交', '大牆攀登', NULL, NULL, 1, 1, '2023-01-02', datetime('now'), datetime('now')),
  ('bio_004', NULL, '一路', 'yi-lu', NULL, NULL, '/photo/personleft.jpeg', '/photo/person-poto.jpg', '2022', '各大天然岩場、波浪岩館', '差一點快爬完但爬不完的都喜歡', '生活規律有目標、有運動、有社交', '大牆攀登', NULL, NULL, 0, 1, '2023-01-02', datetime('now'), datetime('now')),
  ('bio_005', NULL, '崇凡', 'chong-fan', NULL, NULL, '/photo/personmid.jpeg', '/photo/person-poto.jpg', '2022', '各大天然岩場、波浪岩館', '差一點快爬完但爬不完的都喜歡', '生活規律有目標、有運動、有社交', '大牆攀登', NULL, NULL, 0, 1, '2023-01-02', datetime('now'), datetime('now')),
  ('bio_006', NULL, '硬魚', 'ying-yu', NULL, NULL, '/photo/personright.jpeg', '/photo/person-poto.jpg', '2022', '各大天然岩場、波浪岩館', '差一點快爬完但爬不完的都喜歡', '生活規律有目標、有運動、有社交', '大牆攀登', NULL, NULL, 0, 1, '2023-01-02', datetime('now'), datetime('now'));
