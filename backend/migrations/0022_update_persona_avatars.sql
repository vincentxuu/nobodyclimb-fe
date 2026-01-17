-- ═══════════════════════════════════════════════════════════
-- Migration: Update persona avatars to cartoon styles
-- Description: Replace human-like avatars with DiceBear cartoon styles
-- ═══════════════════════════════════════════════════════════

UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Jack&backgroundColor=b6e3f4' WHERE id = 'persona-jack';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Mia&backgroundColor=ffd5dc' WHERE id = 'persona-mia';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Kevin&backgroundColor=c0aede' WHERE id = 'persona-kevin';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/thumbs/svg?seed=Grace&backgroundColor=d1f4d1' WHERE id = 'persona-grace';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Wayne&backgroundColor=ffeaa7' WHERE id = 'persona-wayne';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Coral&backgroundColor=a8e6cf' WHERE id = 'persona-coral';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/identicon/svg?seed=Derek&backgroundColor=74b9ff' WHERE id = 'persona-derek';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/shapes/svg?seed=Lily&backgroundColor=ffdfbf' WHERE id = 'persona-lily';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Danny&backgroundColor=c0f4f4' WHERE id = 'persona-danny';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/thumbs/svg?seed=Linda&backgroundColor=ffeaa7' WHERE id = 'persona-linda';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben&backgroundColor=fab1a0' WHERE id = 'persona-ben';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wind&backgroundColor=a8e6cf' WHERE id = 'persona-wind';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/shapes/svg?seed=Vivian&backgroundColor=ffd3e0' WHERE id = 'persona-vivian';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Leo&backgroundColor=dfe6e9' WHERE id = 'persona-leo';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/thumbs/svg?seed=Christine&backgroundColor=d4f1f9' WHERE id = 'persona-christine';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/identicon/svg?seed=Stone&backgroundColor=dcd6f7' WHERE id = 'persona-stone';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Nina&backgroundColor=dcd6f7' WHERE id = 'persona-nina';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Roger&backgroundColor=ffeaa7' WHERE id = 'persona-roger';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/shapes/svg?seed=Amy&backgroundColor=fce4ec' WHERE id = 'persona-amy';
UPDATE biographies SET avatar_url = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Monkey&backgroundColor=ffe0b2' WHERE id = 'persona-monkey';
