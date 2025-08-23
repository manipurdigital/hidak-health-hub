-- Add sample composition data for the Glycomet medicine to demonstrate the salt composition feature
UPDATE medicines 
SET composition_text = 'Metformin Hydrochloride (500mg)', 
    composition_key = 'metformin_hydrochloride_500mg',
    generic_name = 'Metformin Hydrochloride'
WHERE id = 'b73e199e-2ccc-436a-ae1e-100573a0c769';