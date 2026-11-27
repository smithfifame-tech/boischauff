-- GodenWood : nouvelle identité, connexion obligatoire, avis vérifiés, newsletter, codes postaux par zone.
SET search_path TO boischauff;

UPDATE settings SET value = jsonb_set(jsonb_set(value, '{name}', '"GodenWood"'), '{tagline}', '"Chauffez naturellement, vivez mieux"')
WHERE key = 'company' AND value->>'name' IN ('BoisChauff+', 'BoisChauff');

UPDATE settings SET value = value
  || '{"primary_color": "#1E140C", "primary_dark": "#0E0906", "accent_color": "#F5A623", "gold_color": "#FFC542"}'::jsonb
WHERE key = 'company' AND value->>'primary_color' = '#073B19';

-- Avant tout achat, le client doit être connecté.
UPDATE settings SET value = jsonb_set(value, '{guest_checkout}', 'false') WHERE key = 'commerce';

-- Détection automatique de la zone à partir du code postal.
ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS postal_prefixes text NOT NULL DEFAULT '';
UPDATE delivery_zones SET postal_prefixes = '75'           WHERE name = 'Paris (75)' AND postal_prefixes = '';
UPDATE delivery_zones SET postal_prefixes = '92,93,94'     WHERE name LIKE 'Petite couronne%' AND postal_prefixes = '';
UPDATE delivery_zones SET postal_prefixes = '77,78,91,95'  WHERE name LIKE 'Grande couronne%' AND postal_prefixes = '';
UPDATE delivery_zones SET postal_prefixes = 'FR'           WHERE name LIKE 'Province%' AND postal_prefixes = '';
UPDATE delivery_zones SET postal_prefixes = 'EU'           WHERE name LIKE 'Europe%' AND postal_prefixes = '';

-- Avis clients vérifiés (une commande payée = un avis, publié après modération).
CREATE TABLE IF NOT EXISTS reviews (
  id           bigserial PRIMARY KEY,
  order_id     bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id      bigint REFERENCES users(id) ON DELETE SET NULL,
  author_name  text NOT NULL,
  city         text NOT NULL DEFAULT '',
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_uq ON reviews (order_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status, created_at DESC);

-- Newsletter (consentement explicite, désinscription possible).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               bigserial PRIMARY KEY,
  email            text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz,
  unsubscribe_token text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_uq ON newsletter_subscribers (lower(email));
