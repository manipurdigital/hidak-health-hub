-- Add UPDATE and DELETE policies for lab_reports table
CREATE POLICY "Users can update their own reports" 
ON public.lab_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.lab_reports 
FOR DELETE 
USING (auth.uid() = user_id);