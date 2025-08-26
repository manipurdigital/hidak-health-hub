-- Updated-at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END $$;

-- Apply updated-at trigger to delivery_assignments
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

-- Apply auto-fill trigger to delivery_assignments
DROP TRIGGER IF EXISTS trg_da_autofill ON public.delivery_assignments;
CREATE TRIGGER trg_da_autofill 
  BEFORE INSERT OR UPDATE ON public.delivery_assignments
  FOR EACH ROW 
  EXECUTE FUNCTION public.tg_da_autofill_status();

-- Enable RLS on delivery_assignments (if not already enabled)
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for delivery_assignments
CREATE POLICY "Admin can manage delivery assignments" 
ON public.delivery_assignments FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_assigned_at ON public.delivery_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivered_at ON public.delivery_assignments(delivered_at);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_picked_up_at ON public.delivery_assignments(picked_up_at);