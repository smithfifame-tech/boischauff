-- Montant réellement demandé à la passerelle (ex. commande en EUR encaissée en XOF par SasPay).
SET search_path TO boischauff;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS charge_amount numeric(14,2);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS charge_currency text;
