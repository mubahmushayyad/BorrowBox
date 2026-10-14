-- Run once on an EXISTING database (keeps all data):
--   psql -U postgres -d borrowbox -f src/db/migration_pricing_gallery.sql

ALTER TABLE items ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_per_day >= 0);
ALTER TABLE items ADD COLUMN IF NOT EXISTS charge_days INT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}';

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chargeable_days INT NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS item_images (
  id         SERIAL PRIMARY KEY,
  item_id    INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_item_images_item ON item_images(item_id, position);
