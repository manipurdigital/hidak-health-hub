import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CreateCenterUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateCenterUser = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Add user role (no specific center role in enum)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'user' // Use 'user' instead of 'center'
          });

        if (roleError) throw roleError;

        toast({
          title: "Success",
          description: "Center user created successfully! They can now log in and access the center console.",
        });

        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Error creating center user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create center user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Center User (Admin Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="email"
          placeholder="Center email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button 
          onClick={handleCreateCenterUser}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Center User'}
        </Button>
        <p className="text-xs text-muted-foreground">
          This creates a user with 'center' role who can access /center routes
        </p>
      </CardContent>
    </Card>
  );
}