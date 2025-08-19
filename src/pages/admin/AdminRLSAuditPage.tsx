import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RLSAuditResult {
  table_name: string;
  rls_enabled: boolean;
  has_default_deny: boolean;
  policy_count: number;
  permissive_policies: number;
  issues: string[];
}

export default function AdminRLSAuditPage() {
  const [auditResults, setAuditResults] = useState<RLSAuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('audit_rls');
      
      if (error) {
        throw error;
      }
      
      setAuditResults(data || []);
    } catch (error) {
      console.error('Error running RLS audit:', error);
      toast({
        title: "Audit Failed",
        description: "Failed to run RLS audit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFixes = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.rpc('apply_rls_fixes');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Fixes Applied",
        description: data || "RLS fixes have been applied successfully.",
        variant: "default"
      });
      
      // Re-run audit to show updated results
      await runAudit();
    } catch (error) {
      console.error('Error applying RLS fixes:', error);
      toast({
        title: "Fix Failed",
        description: "Failed to apply RLS fixes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const getTableStatusIcon = (result: RLSAuditResult) => {
    if (!result.rls_enabled || result.issues.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getTableStatusBadge = (result: RLSAuditResult) => {
    if (!result.rls_enabled) {
      return <Badge variant="destructive">RLS Disabled</Badge>;
    }
    if (result.issues.length > 0) {
      return <Badge variant="secondary">Issues Found</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Secure</Badge>;
  };

  const criticalIssues = auditResults.filter(r => !r.rls_enabled || r.issues.length > 0);
  const secureTables = auditResults.filter(r => r.rls_enabled && r.issues.length === 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">RLS Security Audit</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">RLS Security Audit</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAudit}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Audit
          </Button>
          {criticalIssues.length > 0 && (
            <Button
              onClick={applyFixes}
              disabled={fixing}
              variant="default"
            >
              {fixing ? "Applying..." : "Apply Safe Defaults"}
            </Button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <Alert className={criticalIssues.length === 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {criticalIssues.length === 0 
            ? `All ${auditResults.length} tables are properly secured with RLS policies.`
            : `${criticalIssues.length} table(s) have security issues that need attention.`
          }
        </AlertDescription>
      </Alert>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Critical Security Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalIssues.map((result) => (
                <div key={result.table_name} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    {getTableStatusIcon(result)}
                    <div>
                      <div className="font-mono text-sm font-medium">{result.table_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.policy_count} policies, {result.permissive_policies} permissive
                      </div>
                      {result.issues.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          Issues: {result.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  {getTableStatusBadge(result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secure Tables */}
      {secureTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Secure Tables ({secureTables.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secureTables.map((result) => (
                <div key={result.table_name} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    {getTableStatusIcon(result)}
                    <div>
                      <div className="font-mono text-sm font-medium">{result.table_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.policy_count} policies
                      </div>
                    </div>
                  </div>
                  {getTableStatusBadge(result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Audit Results</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed view of all audited tables and their security status.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditResults.map((result) => (
              <div key={result.table_name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTableStatusIcon(result)}
                  <div>
                    <div className="font-mono text-sm font-medium">{result.table_name}</div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>RLS: {result.rls_enabled ? "Enabled" : "Disabled"}</span>
                      <span>Policies: {result.policy_count}</span>
                      <span>Permissive: {result.permissive_policies}</span>
                      <span>Default Deny: {result.has_default_deny ? "Yes" : "No"}</span>
                    </div>
                    {result.issues.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {result.issues.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                {getTableStatusBadge(result)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>RLS Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>All tables should have RLS enabled</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Default deny policies should be in place for defense in depth</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Minimize permissive policies to reduce attack surface</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Users should only access their own data or data they're authorized for</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}