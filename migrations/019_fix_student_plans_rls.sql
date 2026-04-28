-- ============================================================================
-- FIX: auto_record_mailing_income trigger errors
-- 
-- Problems fixed:
--   1. uuid = text: reference_id is UUID but trigger cast NEW.id::text
--   2. total_price doesn't exist on mailing_orders (it's total_amount)
--   3. list_name doesn't exist on mailing_orders (look up from mailing_lists)
-- These broke adminMarkPaid in the mailing-checkout edge function.
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_record_mailing_income()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id uuid;
  v_description text;
  v_amount numeric;
  v_customer text;
  v_already_exists boolean;
  v_list_name text;
BEGIN
  -- Only fire when payment_status changes TO 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    
    -- Check if we already recorded this order (idempotency)
    -- reference_id is UUID, so compare directly with NEW.id (also UUID)
    SELECT EXISTS(
      SELECT 1 FROM accounting_transactions
      WHERE reference_type = 'mailing_order'
        AND reference_id = NEW.id
    ) INTO v_already_exists;
    
    IF v_already_exists THEN
      RETURN NEW; -- Already recorded, skip
    END IF;

    -- Get the income category ID
    SELECT id INTO v_category_id
    FROM accounting_categories
    WHERE name = 'Mailing List Sales' AND type = 'income' AND is_active = true
    LIMIT 1;
    
    -- If category doesn't exist, create it
    IF v_category_id IS NULL THEN
      INSERT INTO accounting_categories (name, type, description, color, icon, is_system)
      VALUES ('Mailing List Sales', 'income', 'Automatic income from mailing list purchases', '#10B981', 'Package', true)
      RETURNING id INTO v_category_id;
    END IF;

    -- Calculate the actual amount paid (total after discounts)
    -- mailing_orders uses total_amount, not total_price
    v_amount := COALESCE(NEW.total_amount, 0);
    
    -- Look up list name from mailing_lists (not stored on mailing_orders)
    IF NEW.mailing_list_id IS NOT NULL THEN
      SELECT name INTO v_list_name FROM mailing_lists WHERE id = NEW.mailing_list_id;
    END IF;

    -- Build description
    v_description := 'Mailing list order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8));
    IF v_list_name IS NOT NULL THEN
      v_description := v_description || ' - ' || v_list_name;
    END IF;
    IF NEW.order_type IS NOT NULL THEN
      v_description := v_description || ' (' || NEW.order_type || ')';
    END IF;
    
    -- Try to get customer name: first from order, then profile/contacts
    v_customer := NULLIF(TRIM(COALESCE(NEW.customer_name, '')), '');
    
    IF v_customer IS NULL THEN
      SELECT COALESCE(
        NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''),
        NULLIF(TRIM(COALESCE(c."English_first_name ", '') || ' ' || COALESCE(c."English_last_name ", '')), ''),
        'User ' || LEFT(NEW.user_id::text, 8)
      ) INTO v_customer
      FROM profiles p
      LEFT JOIN contacts c ON c.id = p.contact_id
      WHERE p.id = NEW.user_id;
    END IF;
    
    IF v_customer IS NULL THEN
      v_customer := 'User ' || LEFT(COALESCE(NEW.user_id::text, 'unknown'), 8);
    END IF;

    -- Insert the accounting transaction
    -- reference_id is UUID, so pass NEW.id directly (no ::text cast)
    INSERT INTO accounting_transactions (
      type,
      category_id,
      amount,
      description,
      notes,
      transaction_date,
      payment_method,
      vendor_customer,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      'income',
      v_category_id,
      v_amount,
      v_description,
      'Auto-recorded from mailing order payment confirmation. Payment method: ' || COALESCE(NEW.payment_method, 'unknown'),
      CURRENT_DATE,
      COALESCE(NEW.payment_method, 'other'),
      v_customer,
      'mailing_order',
      NEW.id,
      COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

SELECT 'Fixed auto_record_mailing_income: uuid=text, total_price→total_amount, list_name lookup' AS status;
