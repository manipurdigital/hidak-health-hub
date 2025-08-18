-- First, just add analyst role to enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'analyst';