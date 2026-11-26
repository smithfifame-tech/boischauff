-- BoisChauff+ — schéma PostgreSQL
-- Toutes les tables vivent dans le schéma dédié "boischauff".
CREATE SCHEMA IF NOT EXISTS boischauff;
SET search_path TO boischauff;

-- ---------------------------------------------------------------
-- Paramètres de l'entreprise (clé / valeur JSON)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Comptes
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             bigserial PRIMARY KEY,
  email          text NOT NULL,
  password_hash  text NOT NULL,
  first_name     text NOT NULL DEFAULT '',
  last_name      text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));

CREATE TABLE IF NOT EXISTS admins (
  id                    bigserial PRIMARY KEY,
  email                 text NOT NULL,
  password_hash         text NOT NULL,
  name                  text NOT NULL DEFAULT 'Administrateur',
  must_change_password  boolean NOT NULL DEFAULT true,
  last_login_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_uq ON admins (lower(email));

CREATE TABLE IF NOT EXISTS login_attempts (
  id          bigserial PRIMARY KEY,
  scope       text NOT NULL,              -- 'user' | 'admin'
  identifier  text NOT NULL,              -- e-mail en minuscules
  ip          text NOT NULL DEFAULT '',
  success     boolean NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_lookup ON login_attempts (scope, identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip ON login_attempts (ip, created_at DESC);

CREATE TABLE IF NOT EXISTS password_resets (
  id          bigserial PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                 bigserial PRIMARY KEY,
  slug               text NOT NULL UNIQUE,
  name               text NOT NULL,
  short_description  text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  species            text NOT NULL DEFAULT '',          -- essence de bois
  drying_level       text NOT NULL DEFAULT '',          -- niveau de séchage
  moisture           text NOT NULL DEFAULT '',          -- taux d'humidité
  recommended_use    text NOT NULL DEFAULT '',
  features           jsonb NOT NULL DEFAULT '[]'::jsonb, -- liste de caractéristiques
  base_price_per_kg  numeric(12,4) NOT NULL CHECK (base_price_per_kg >= 0),
  sale_unit          text NOT NULL DEFAULT 'kg',        -- unité de vente affichée
  allowed_units      text[] NOT NULL DEFAULT ARRAY['kg','t'],
  min_qty_kg         numeric(12,3) NOT NULL DEFAULT 50 CHECK (min_qty_kg > 0),
  max_qty_kg         numeric(12,3) CHECK (max_qty_kg IS NULL OR max_qty_kg >= min_qty_kg),
  qty_step_kg        numeric(12,3) NOT NULL DEFAULT 1 CHECK (qty_step_kg > 0),
  stock_kg           numeric(14,3),                     -- NULL = stock non suivi
  is_active          boolean NOT NULL DEFAULT true,
  is_featured        boolean NOT NULL DEFAULT false,
  is_demo_price      boolean NOT NULL DEFAULT true,     -- prix de démonstration à valider
  badge              text NOT NULL DEFAULT '',
  sort_order         int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_active_sort ON products (is_active, sort_order);

CREATE TABLE IF NOT EXISTS product_images (
  id          bigserial PRIMARY KEY,
  product_id  bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt         text NOT NULL DEFAULT '',
  credit      text NOT NULL DEFAULT '',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_product ON product_images (product_id, sort_order);

-- Règles de prix : paliers dégressifs (prix au kg à partir d'une quantité)
-- et forfaits (prix fixe pour une quantité exacte, ex. 50 kg, 100 kg, 1 tonne)
CREATE TABLE IF NOT EXISTS price_rules (
  id            bigserial PRIMARY KEY,
  product_id    bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rule_type     text NOT NULL CHECK (rule_type IN ('tier','pack')),
  label         text NOT NULL DEFAULT '',
  min_qty_kg    numeric(12,3),          -- palier : à partir de
  price_per_kg  numeric(12,4),          -- palier : prix au kg
  pack_qty_kg   numeric(12,3),          -- forfait : quantité exacte
  pack_price    numeric(12,2),          -- forfait : prix total
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (rule_type = 'tier' AND min_qty_kg IS NOT NULL AND price_per_kg IS NOT NULL AND price_per_kg >= 0)
    OR
    (rule_type = 'pack' AND pack_qty_kg IS NOT NULL AND pack_price IS NOT NULL AND pack_price >= 0)
  )
);
CREATE INDEX IF NOT EXISTS price_rules_product ON price_rules (product_id, rule_type);

-- ---------------------------------------------------------------
-- Livraison
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_zones (
  id                bigserial PRIMARY KEY,
  name              text NOT NULL,
  description       text NOT NULL DEFAULT '',
  mode              text NOT NULL CHECK (mode IN ('free','fixed','distance','quote')),
  fixed_fee         numeric(12,2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  per_km_fee        numeric(12,2) NOT NULL DEFAULT 0 CHECK (per_km_fee >= 0),
  distance_km       numeric(8,1)  NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  free_above        numeric(12,2),            -- livraison offerte au-delà de ce montant de bois
  min_order_amount  numeric(12,2),
  lead_time         text NOT NULL DEFAULT '',  -- délai indicatif
  is_active         boolean NOT NULL DEFAULT true,
  is_demo           boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Paniers (persistés côté serveur, liés à un cookie ou à un client)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id          bigserial PRIMARY KEY,
  token       text NOT NULL UNIQUE,
  user_id     bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cart_items (
  id          bigserial PRIMARY KEY,
  cart_id     bigint NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit        text NOT NULL CHECK (unit IN ('kg','t')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- ---------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                  bigserial PRIMARY KEY,
  order_number        text NOT NULL UNIQUE,
  quote_number        text NOT NULL UNIQUE,
  access_token        text NOT NULL,              -- lien privé client (invité)
  idempotency_key     text UNIQUE,                -- anti-doublon de soumission
  user_id             bigint REFERENCES users(id) ON DELETE SET NULL,
  status              text NOT NULL CHECK (status IN
                        ('awaiting_quote','pending_payment','paid','preparing','shipping','delivered','cancelled')),
  payment_status      text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN
                        ('unpaid','pending','paid','failed','refunded')),
  customer_first_name text NOT NULL,
  customer_last_name  text NOT NULL,
  customer_email      text NOT NULL,
  customer_phone      text NOT NULL,
  delivery_zone_id    bigint REFERENCES delivery_zones(id) ON DELETE SET NULL,
  delivery_zone_name  text NOT NULL DEFAULT '',
  delivery_mode       text NOT NULL DEFAULT 'quote',
  delivery_instructions text NOT NULL DEFAULT '',
  desired_delivery_date date,
  currency            text NOT NULL DEFAULT 'EUR',
  wood_subtotal       numeric(12,2) NOT NULL,
  volume_discount     numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee        numeric(12,2),              -- NULL tant que la livraison est sur devis
  tax_rate            numeric(6,4) NOT NULL DEFAULT 0,
  tax_amount          numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount     numeric(12,2) NOT NULL DEFAULT 0,
  total_amount        numeric(12,2),              -- NULL tant que non chiffrable
  is_demo             boolean NOT NULL DEFAULT false,
  internal_note       text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz
);
CREATE INDEX IF NOT EXISTS orders_status ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_email ON orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS orders_user ON orders (user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id              bigserial PRIMARY KEY,
  order_id        bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      bigint REFERENCES products(id) ON DELETE SET NULL,
  product_name    text NOT NULL,                 -- figé à la commande (historique)
  quantity        numeric(12,3) NOT NULL,
  unit            text NOT NULL,
  quantity_kg     numeric(14,3) NOT NULL,
  unit_price_kg   numeric(12,4) NOT NULL,
  pricing_label   text NOT NULL DEFAULT '',
  line_total      numeric(12,2) NOT NULL,
  base_line_total numeric(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order ON order_items (order_id);

CREATE TABLE IF NOT EXISTS addresses (
  id          bigserial PRIMARY KEY,
  user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
  order_id    bigint REFERENCES orders(id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'delivery',
  line1       text NOT NULL,
  line2       text NOT NULL DEFAULT '',
  city        text NOT NULL,
  postal_code text NOT NULL DEFAULT '',
  country     text NOT NULL,
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR order_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS addresses_user ON addresses (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS addresses_order_uq ON addresses (order_id) WHERE order_id IS NOT NULL;

-- ---------------------------------------------------------------
-- Paiements
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                bigserial PRIMARY KEY,
  order_id          bigint NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider          text NOT NULL,                 -- 'saaspay' | 'demo'
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  amount            numeric(12,2) NOT NULL,
  currency          text NOT NULL,
  transaction_ref   text,
  method            text NOT NULL DEFAULT '',
  is_demo           boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                bigserial PRIMARY KEY,
  public_id         text NOT NULL UNIQUE,          -- référence envoyée à la passerelle
  order_id          bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider          text NOT NULL,
  provider_tx_id    text,
  status            text NOT NULL DEFAULT 'created' CHECK (status IN
                      ('created','pending','succeeded','failed','cancelled','expired')),
  amount            numeric(12,2) NOT NULL,
  currency          text NOT NULL,
  checkout_url      text,
  failure_reason    text NOT NULL DEFAULT '',
  raw_last_event    jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_tx_order ON payment_transactions (order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_tx_provider_uq ON payment_transactions (provider, provider_tx_id) WHERE provider_tx_id IS NOT NULL;
-- Une seule transaction réussie par commande (protection contre le double paiement)
CREATE UNIQUE INDEX IF NOT EXISTS payment_tx_one_success ON payment_transactions (order_id) WHERE status = 'succeeded';

CREATE TABLE IF NOT EXISTS webhook_events (
  id            bigserial PRIMARY KEY,
  provider      text NOT NULL,
  event_id      text NOT NULL,
  payload       jsonb NOT NULL,
  processed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

-- ---------------------------------------------------------------
-- Suivi de livraison, reçus, journaux
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id          bigserial PRIMARY KEY,
  order_id    bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      text NOT NULL,
  note        text NOT NULL DEFAULT '',
  is_public   boolean NOT NULL DEFAULT true,
  created_by  text NOT NULL DEFAULT 'system',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS delivery_tracking_order ON delivery_tracking (order_id, created_at);

CREATE TABLE IF NOT EXISTS receipts (
  id              bigserial PRIMARY KEY,
  receipt_number  text NOT NULL UNIQUE,
  order_id        bigint NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount          numeric(12,2) NOT NULL,
  currency        text NOT NULL,
  is_demo         boolean NOT NULL DEFAULT false,
  issued_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id            bigserial PRIMARY KEY,
  order_id      bigint REFERENCES orders(id) ON DELETE SET NULL,
  template      text NOT NULL,
  recipient     text NOT NULL,
  subject       text NOT NULL,
  status        text NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error         text NOT NULL DEFAULT '',
  attempts      int NOT NULL DEFAULT 1,
  provider_id   text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_logs_order ON email_logs (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status ON email_logs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  subject     text NOT NULL DEFAULT '',
  message     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
