-- Create lab test categories table
CREATE TABLE public.lab_test_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lab_test_categories
ALTER TABLE public.lab_test_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for lab_test_categories
CREATE POLICY "Lab test categories are viewable by everyone"
ON public.lab_test_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage lab test categories"
ON public.lab_test_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to lab_tests table (keeping category for backward compatibility)
ALTER TABLE public.lab_tests 
ADD COLUMN category_id UUID REFERENCES public.lab_test_categories(id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_lab_test_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_test_categories_updated_at
BEFORE UPDATE ON public.lab_test_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_lab_test_categories_updated_at();