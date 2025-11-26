-- ダミーの企業プロフィールを作成（ログインはできませんが、表示用に使います）
INSERT INTO profiles (id, username, user_type, avatar_type)
VALUES 
('00000000-0000-0000-0000-000000000001', '株式会社アグリライフ', 'company', 'character_murabito_middle_man_blue.svg'),
('00000000-0000-0000-0000-000000000002', '陶芸工房 匠', 'company', 'character_murabito_senior_man_blue.svg'),
('00000000-0000-0000-0000-000000000003', 'サンライズカフェ', 'company', 'character_murabito_young_man_blue.svg')
ON CONFLICT (id) DO NOTHING;

-- 既存の案件データを日本語化し、ダミー企業に紐付け直す
UPDATE jobs 
SET 
    title = '有機野菜の収穫体験',
    description = '旬の野菜の収穫をお手伝いください！有機栽培の方法について学びながら、新鮮な野菜を収穫して持ち帰ることができます。初心者大歓迎です。',
    location = '緑の谷農園（長野県）',
    reward = '採れたて野菜バスケット',
    company_id = '00000000-0000-0000-0000-000000000001'
WHERE title LIKE '%Organic Farming%';

UPDATE jobs 
SET 
    title = '伝統陶芸ワークショップ',
    description = '熟練の職人から陶芸の基礎を学びましょう。自分だけの湯呑みや茶碗を作ることができます。焼き上がり後、郵送にてお届けします。',
    location = '職人通り 匠工房',
    reward = '自作の陶器',
    company_id = '00000000-0000-0000-0000-000000000002'
WHERE title LIKE '%Pottery%';

UPDATE jobs 
SET 
    title = 'コミュニティカフェの1日店長体験',
    description = '地元の人々が集まるカフェで、接客やコーヒー淹れを体験してみませんか？常連さんとの会話を楽しみながら、カフェ運営の裏側を知ることができます。',
    location = 'サンライズカフェ（駅前）',
    reward = 'ランチ＆コーヒー無料',
    company_id = '00000000-0000-0000-0000-000000000003'
WHERE title LIKE '%Community Cafe%';
