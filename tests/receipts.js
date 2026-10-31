export async function insertDemoReceipt(db) {
  await db.query(`INSERT INTO bookings (request_id,slot_id,quantity,customer_name,customer_email,payment_method,session_starts_at,
    original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,commission_basis_points,total_price_centavos,platform_fee_centavos,provider_payout_centavos)
    SELECT '12345678-0000-4000-8000-000000000001',id,2,'Demo','demo@example.com','mock_card',starts_at,200000,160000,'buddy',152000,1000,304000,30400,273600 FROM slots WHERE id=1`);
}
