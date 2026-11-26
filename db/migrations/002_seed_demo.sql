-- BoisChauff+ — données initiales.
-- IMPORTANT : les prix et frais de livraison ci-dessous sont des VALEURS DE DÉMONSTRATION.
-- Ils sont marqués is_demo_price / is_demo = true et affichés comme tels sur le site
-- tant que l'administrateur ne les a pas validés ou modifiés.
SET search_path TO boischauff;

INSERT INTO settings (key, value) VALUES
('company', '{
  "name": "BoisChauff+",
  "tagline": "Chaleur garantie, livraison assurée",
  "phone": "+229 01 97 52 30 45",
  "email": "smithfifame@gmail.com",
  "address": "",
  "delivery_area": "Livraison partout au Bénin et alentours",
  "logo_url": "",
  "primary_color": "#073B19",
  "primary_dark": "#052B12",
  "accent_color": "#F47A08",
  "gold_color": "#FFC928",
  "opening_hours": "",
  "social": {"facebook": "", "whatsapp": "", "youtube": "", "tiktok": "", "instagram": ""}
}'::jsonb),
('commerce', '{
  "currency": "EUR",
  "locale": "fr-FR",
  "tax_rate": 0,
  "tax_label": "TVA",
  "min_order_amount": 50,
  "guest_checkout": true,
  "show_demo_notice": true
}'::jsonb),
('receipt', '{
  "footer": "Merci pour votre confiance. Conservez ce reçu comme preuve de paiement.",
  "legal_mentions": ""
}'::jsonb),
('notifications', '{
  "order_email": "smithfifame@gmail.com"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Produits ------------------------------------------------------------
INSERT INTO products (slug, name, short_description, description, species, drying_level, moisture, recommended_use, features,
                      base_price_per_kg, sale_unit, min_qty_kg, max_qty_kg, qty_step_kg, stock_kg, is_featured, is_demo_price, badge, sort_order)
VALUES
('bois-mixte', 'Bois mixte', 'Chaleur idéale',
 'Un mélange équilibré d''essences dures et semi-dures, coupé et fendu, pour un usage quotidien économique. Il démarre facilement et offre une bonne tenue au feu.',
 'Mélange feuillus (dur & semi-dur)', 'Séché à l''air 12 à 18 mois', '< 25 %', 'Cheminée, poêle, cuisson au feu de bois',
 '["Bûches fendues de 33 cm","Bon rapport qualité / prix","Allumage facile"]'::jsonb,
 1.00, 'kg', 50, 20000, 1, NULL, true, true, 'Meilleure vente', 1),
('bois-dur', 'Bois dur', 'Longue durée',
 'Des essences denses sélectionnées pour leur pouvoir calorifique élevé et leur combustion lente. Idéal pour garder une chaleur stable pendant des heures.',
 'Feuillus durs (hêtre, charme, frêne)', 'Séché 18 à 24 mois', '< 20 %', 'Chauffage principal, poêle à bois, braises longues',
 '["Combustion lente","Pouvoir calorifique élevé","Peu de cendres"]'::jsonb,
 1.10, 'kg', 50, 20000, 1, NULL, true, true, '', 2),
('bois-de-chene', 'Bois de chêne', 'Puissance et tenue',
 'Le chêne est l''un des bois de chauffage les plus denses. Il produit une chaleur intense et durable, parfait pour les longues soirées et les gros volumes.',
 'Chêne', 'Séché 24 mois minimum', '< 20 %', 'Chauffage intensif, insert, grandes cheminées',
 '["Très haute densité","Braises durables","Idéal grands volumes"]'::jsonb,
 1.25, 'kg', 50, 20000, 1, NULL, false, true, '', 3),
('bois-sec', 'Bois sec', 'Allumage facile',
 'Bois séché sous abri pour une humidité maîtrisée : flamme vive, peu de fumée et un rendement optimal dès l''allumage.',
 'Feuillus mélangés', 'Séché sous abri', '< 18 %', 'Poêle, barbecue, four à pain',
 '["Humidité contrôlée","Peu de fumée","Rendement optimal"]'::jsonb,
 1.15, 'kg', 50, 20000, 1, NULL, true, true, '', 4),
('bois-premium', 'Bois premium', 'Haute performance',
 'Notre sélection haut de gamme : bûches calibrées, essences nobles et séchage long pour une performance maximale et une propreté irréprochable.',
 'Chêne & hêtre sélectionnés', 'Séché 24 à 30 mois', '< 15 %', 'Inserts haut rendement, poêles modernes',
 '["Bûches calibrées","Séchage long","Rendement maximal"]'::jsonb,
 1.40, 'kg', 50, 20000, 1, 8000, true, true, 'Premium', 5),
('bois-allumage', 'Bois d''allumage', 'Démarrage rapide',
 'Petit bois fin et très sec pour démarrer vos feux en quelques secondes, sans produit chimique.',
 'Résineux et feuillus tendres', 'Très sec', '< 12 %', 'Allumage de cheminée, poêle, barbecue',
 '["Très sec","Sans produit chimique","Allumage instantané"]'::jsonb,
 2.00, 'kg', 25, 2000, 1, NULL, false, true, '', 6)
ON CONFLICT (slug) DO NOTHING;

-- Images (photos Unsplash, crédits enregistrés) ------------------------
INSERT INTO product_images (product_id, url, alt, credit, sort_order)
SELECT p.id, i.url, i.alt, i.credit, 0
FROM (VALUES
  ('bois-mixte',    'https://images.unsplash.com/photo-1571040195944-85a412548a43', 'Pile de bois mixte fendu', 'Andreas Pajuvirta / Unsplash'),
  ('bois-dur',      'https://images.unsplash.com/photo-1475500958746-c4562f6f40f0', 'Bûches de bois dur fendues', 'Kto.to. Radek / Unsplash'),
  ('bois-de-chene', 'https://images.unsplash.com/photo-1617410225897-c9d260e3055e', 'Bûches de chêne empilées', 'Hans / Unsplash'),
  ('bois-sec',      'https://images.unsplash.com/photo-1491831718109-ffc2cb30cc38', 'Bois sec stocké sous abri', 'Patrick Tomasso / Unsplash'),
  ('bois-premium',  'https://images.unsplash.com/photo-1761655622268-3707c5467749', 'Bûches premium calibrées', 'Clay Banks / Unsplash'),
  ('bois-allumage', 'https://images.unsplash.com/photo-1634672652995-ee7525bce595', 'Petit bois d''allumage', 'Patrick Robert Doyle / Unsplash')
) AS i(slug, url, alt, credit)
JOIN products p ON p.slug = i.slug
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- Tarifs dégressifs (démonstration) -----------------------------------
INSERT INTO price_rules (product_id, rule_type, label, min_qty_kg, price_per_kg)
SELECT p.id, 'tier', t.label, t.min_kg, round(p.base_price_per_kg * t.factor, 4)
FROM products p
CROSS JOIN (VALUES
  ('Dès 250 kg (-5 %)',   250,  0.95),
  ('Dès 500 kg (-10 %)',  500,  0.90),
  ('Dès 1 tonne (-15 %)', 1000, 0.85),
  ('Dès 2 tonnes (-20 %)',2000, 0.80)
) AS t(label, min_kg, factor)
WHERE p.slug <> 'bois-allumage'
  AND NOT EXISTS (SELECT 1 FROM price_rules r WHERE r.product_id = p.id);

INSERT INTO price_rules (product_id, rule_type, label, pack_qty_kg, pack_price)
SELECT p.id, 'pack', 'Sac de 50 kg', 50, 90.00
FROM products p
WHERE p.slug = 'bois-allumage'
  AND NOT EXISTS (SELECT 1 FROM price_rules r WHERE r.product_id = p.id);

-- Zones de livraison (démonstration) ----------------------------------
INSERT INTO delivery_zones (name, description, mode, fixed_fee, per_km_fee, distance_km, free_above, lead_time, is_demo, sort_order)
SELECT * FROM (VALUES
  ('Cotonou',                 'Tous quartiers de Cotonou',                'fixed',    15.00, 0.00,  0.0, 500.00::numeric, '24 à 48 h', true, 1),
  ('Abomey-Calavi',           'Calavi, Godomey, Togba',                   'fixed',    20.00, 0.00,  0.0, 800.00::numeric, '24 à 72 h', true, 2),
  ('Porto-Novo',              'Tarif selon la distance (≈ 35 km)',        'distance', 10.00, 0.60, 35.0, NULL::numeric,   '48 à 72 h', true, 3),
  ('Ouidah',                  'Tarif selon la distance (≈ 42 km)',        'distance', 10.00, 0.60, 42.0, NULL::numeric,   '48 à 72 h', true, 4),
  ('Retrait à l''entrepôt',   'Vous venez chercher votre bois',           'free',      0.00, 0.00,  0.0, NULL::numeric,   'Sur rendez-vous', true, 5),
  ('Autre localité (sur devis)', 'Bénin et pays voisins : frais calculés par notre équipe avant paiement', 'quote', 0.00, 0.00, 0.0, NULL::numeric, 'Selon destination', false, 99)
) AS z(name, description, mode, fixed_fee, per_km_fee, distance_km, free_above, lead_time, is_demo, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM delivery_zones);
