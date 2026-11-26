-- BoisChauff+ — marché France & Europe
-- Remplace les zones de démonstration initiales par des zones France / Europe (tarifs de DÉMONSTRATION,
-- à valider dans l'administration) et enrichit les galeries photo des produits.
SET search_path TO boischauff;

UPDATE delivery_zones SET name = 'Paris (75)', description = 'Livraison dans tout Paris intra-muros',
  mode = 'fixed', fixed_fee = 29, per_km_fee = 0, distance_km = 0, free_above = 600, lead_time = '48 à 72 h', is_demo = true, sort_order = 1, updated_at = now()
WHERE name = 'Cotonou';

UPDATE delivery_zones SET name = 'Petite couronne (92, 93, 94)', description = 'Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne',
  mode = 'fixed', fixed_fee = 39, per_km_fee = 0, distance_km = 0, free_above = 800, lead_time = '48 à 72 h', is_demo = true, sort_order = 2, updated_at = now()
WHERE name = 'Abomey-Calavi';

UPDATE delivery_zones SET name = 'Grande couronne (77, 78, 91, 95)', description = 'Tarif selon la distance (≈ 50 km depuis le dépôt)',
  mode = 'distance', fixed_fee = 25, per_km_fee = 0.80, distance_km = 50, free_above = 1200, lead_time = '3 à 5 jours', is_demo = true, sort_order = 3, updated_at = now()
WHERE name = 'Porto-Novo';

UPDATE delivery_zones SET name = 'Province — France métropolitaine', description = 'Toutes régions de France métropolitaine (hors îles)',
  mode = 'fixed', fixed_fee = 89, per_km_fee = 0, distance_km = 0, free_above = 1500, lead_time = '5 à 10 jours', is_demo = true, sort_order = 4, updated_at = now()
WHERE name = 'Ouidah';

UPDATE delivery_zones SET description = 'Vous venez chercher votre bois au dépôt, sur rendez-vous', sort_order = 5, updated_at = now()
WHERE name = 'Retrait à l''entrepôt';

UPDATE delivery_zones SET name = 'Europe (Belgique, Luxembourg, Suisse, Allemagne…) — sur devis',
  description = 'Union européenne et pays voisins : frais calculés par notre équipe avant tout paiement', sort_order = 99, updated_at = now()
WHERE name = 'Autre localité (sur devis)';

-- Zone de livraison affichée dans le bandeau : uniquement si elle porte encore la valeur initiale
UPDATE settings SET value = jsonb_set(value, '{delivery_area}', '"Livraison partout en France et en Europe"'), updated_at = now()
WHERE key = 'company' AND value->>'delivery_area' ILIKE '%Bénin%';

-- Galeries : deux photos supplémentaires par produit
INSERT INTO product_images (product_id, url, alt, credit, sort_order)
SELECT p.id, i.url, i.alt, 'Unsplash', i.ord
FROM (VALUES
  ('bois-mixte',    'https://images.unsplash.com/photo-1583095117095-adaeabc401ab', 'Stère de bois mixte empilé', 1),
  ('bois-mixte',    'https://images.unsplash.com/photo-1485965089147-0f655dcf01b0', 'Grande pile de bûches', 2),
  ('bois-dur',      'https://images.unsplash.com/photo-1592751854100-135b9021364c', 'Bûches de bois dur', 1),
  ('bois-dur',      'https://images.unsplash.com/photo-1607371942037-e2d6d867b7cb', 'Bois dur fendu', 2),
  ('bois-de-chene', 'https://images.unsplash.com/photo-1553728880-5ed855a08f58', 'Chêne fendu', 1),
  ('bois-de-chene', 'https://images.unsplash.com/photo-1643299336738-e95c332a0457', 'Réserve de chêne pour l''hiver', 2),
  ('bois-sec',      'https://images.unsplash.com/photo-1483217067170-e62094708cd8', 'Bois sec près de la cheminée', 1),
  ('bois-sec',      'https://images.unsplash.com/photo-1416425816930-a02a589195d2', 'Bûches sèches', 2),
  ('bois-premium',  'https://images.unsplash.com/photo-1660570328508-34840e2a80d9', 'Bûches premium calibrées', 1),
  ('bois-premium',  'https://images.unsplash.com/photo-1648332202349-a1ca4f99ee0c', 'Flamme vive dans un poêle', 2),
  ('bois-allumage', 'https://images.unsplash.com/photo-1617615181070-ab4788da6d03', 'Petit bois sec', 1),
  ('bois-allumage', 'https://images.unsplash.com/photo-1590375096341-0c6b35a09d79', 'Allume-feu naturel', 2)
) AS i(slug, url, alt, ord)
JOIN products p ON p.slug = i.slug
WHERE NOT EXISTS (SELECT 1 FROM product_images x WHERE x.product_id = p.id AND x.url = i.url);
