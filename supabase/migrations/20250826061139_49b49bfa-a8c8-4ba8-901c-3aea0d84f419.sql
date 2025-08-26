-- Create delivery_assignments table (exactly one active assignment per order)
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES public.riders(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','on_the_way','delivered','canceled')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancel_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

-- Safety rails: valid combos for status ↔ timestamps
ALTER TABLE public.delivery_assignments
  ADD CONSTRAINT delivery_assignments_status_check
  CHECK (
    (status = 'pending'     AND picked_up_at IS NULL AND delivered_at IS NULL)
 OR (status = 'on_the_way' AND picked_up_at IS NOT NULL AND delivered_at IS NULL)
 OR (status = 'delivered'  AND picked_up_at IS NOT NULL AND delivered_at IS NOT NULL)
 OR (status = 'canceled'   AND cancel_reason IS NOT NULL)
);

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END $$;

-- Apply updated-at trigger
DROP TRIGGER IF EXISTS trg_da_touch ON public.delivery_assignments;
CREATE TRIGGER trg_da_touch 
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW 
  EXECUTE FUNCTION public.tg_touch_updated_at();

-- Convenience trigger: auto-fill timestamps on status changes
CREATE OR REPLACE FUNCTION public.tg_da_autofill_status() 
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'on_the_way' AND NEW.picked_up_at IS NULL THEN
    NEW.picked_up_at := now();
  END IF;
  IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
    IF NEW.picked_up_at IS NULL THEN 
      NEW.picked_up_at := now(); 
    END IF;
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END $$;

-- Apply auto-fill trigger
DROP TRIGGER IF EXISTS trg_da_autofill ON public.delivery_assignments;
CREATE TRIGGER trg_da_autofill 
  BEFORE INSERT OR UPDATE ON public.delivery_assignments
  FOR EACH ROW 
  EXECUTE FUNCTION public.tg_da_autofill_status();

-- Enable RLS
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage delivery assignments" 
ON public.delivery_assignments FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider_id ON public.delivery_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_assigned_at ON public.delivery_assignments(assigned_at);