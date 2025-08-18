-- Enable trigram extension for better text search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AI-lite demand recommender: time-based demand for medicines
CREATE OR REPLACE FUNCTION public.recommend_medicines_for_time(
  at_ts timestamptz,
  in_city text DEFAULT NULL,
  in_pincode text DEFAULT NULL,
  top_n int DEFAULT 10
)
RETURNS TABLE (
  medicine_id uuid,
  name text,
  image_url text,
  price numeric,
  score numeric,
  expected_qty numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH base AS (
    SELECT
      oi.medicine_id,
      oi.quantity as qty,
      o.created_at,
      COALESCE(
        (o.shipping_address->>'city')::text,
        a.city
      ) as city,
      COALESCE(
        (o.shipping_address->>'postal_code')::text,
        a.postal_code
      ) as pincode
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN addresses a ON a.user_id = o.user_id AND a.is_default = true
    WHERE o.payment_status = 'paid'
      AND o.created_at >= at_ts - INTERVAL '180 days'
      AND (
        in_pincode IS NULL OR 
        COALESCE((o.shipping_address->>'postal_code')::text, a.postal_code) = in_pincode
        OR (in_city IS NOT NULL AND COALESCE((o.shipping_address->>'city')::text, a.city) = in_city)
        OR (in_city IS NULL AND in_pincode IS NULL)  -- allow global
      )
  ),
  feat AS (
    SELECT
      medicine_id,
      EXTRACT(dow FROM created_at)::int as dow,
      EXTRACT(hour FROM created_at)::int as hr,
      qty,
      -- Half-lives: 14 days for slot, 7 days for global recency
      EXP(- GREATEST(0, EXTRACT(epoch FROM (at_ts - created_at)))/86400.0 / 14.0) as w_slot,
      EXP(- GREATEST(0, EXTRACT(epoch FROM (at_ts - created_at)))/86400.0 / 7.0) as w_recent
    FROM base
  ),
  agg AS (
    SELECT
      medicine_id,
      -- Exact day+hour "slot" signal
      SUM(CASE WHEN dow = EXTRACT(dow FROM at_ts)::int
               AND hr = EXTRACT(hour FROM at_ts)::int
               THEN qty * w_slot ELSE 0 END) as slot_qty_w,
      SUM(CASE WHEN dow = EXTRACT(dow FROM at_ts)::int
               AND ABS(hr - EXTRACT(hour FROM at_ts)::int) <= 1
               THEN qty * w_slot ELSE 0 END) as near_qty_w,
      SUM(qty * w_recent) as recent_qty_w,
      -- Weights for normalization
      SUM(CASE WHEN dow = EXTRACT(dow FROM at_ts)::int
               AND hr = EXTRACT(hour FROM at_ts)::int
               THEN w_slot ELSE 0 END) as slot_w,
      SUM(CASE WHEN dow = EXTRACT(dow FROM at_ts)::int
               AND ABS(hr - EXTRACT(hour FROM at_ts)::int) <= 1
               THEN w_slot ELSE 0 END) as near_w,
      SUM(w_recent) as recent_w,
      COUNT(*) as obs
    FROM feat
    GROUP BY medicine_id
  ),
  scored AS (
    SELECT
      a.medicine_id,
      -- Laplace smoothing to avoid div/0
      (COALESCE(slot_qty_w, 0) / NULLIF(slot_w, 0) * 0.6
       + COALESCE(near_qty_w, 0) / NULLIF(near_w, 0) * 0.3
       + COALESCE(recent_qty_w, 0) / NULLIF(recent_w, 0) * 0.1
      ) as expected_qty,
      (COALESCE(slot_qty_w, 0) * 1.0
       + COALESCE(near_qty_w, 0) * 0.5
       + COALESCE(recent_qty_w, 0) * 0.2
      ) * LN(1 + GREATEST(obs, 1)) as score
    FROM agg a
  )
  SELECT
    m.id as medicine_id,
    m.name,
    m.image_url,
    m.price,
    COALESCE(s.score, 0) as score,
    GREATEST(COALESCE(s.expected_qty, 0), 0.0) as expected_qty
  FROM scored s
  JOIN medicines m ON m.id = s.medicine_id
  WHERE m.is_active = true
    AND s.score IS NOT NULL
    AND s.score > 0
  ORDER BY s.score DESC NULLS LAST
  LIMIT top_n;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.recommend_medicines_for_time(timestamptz, text, text, int) 
TO anon, authenticated;