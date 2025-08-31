import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  useNotificationPreferences, 
  useUpdateNotificationPreferences 
} from '@/hooks/notification-hooks';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationSettings() {
  const { user } = useAuth();
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({
      user_id: user?.id,
      ...preferences,
      [key]: value,
    });
  };

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">General</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="text-sm text-muted-foreground">
                Receive notifications via email
              </span>
            </Label>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
              <span>SMS Notifications</span>
              <span className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </span>
            </Label>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => handleToggle('sms_notifications', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium">Reminder Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="consultation-reminders" className="text-sm">
                Consultation reminders
              </Label>
              <Switch
                id="consultation-reminders"
                checked={preferences.consultation_reminders}
                onCheckedChange={(checked) => handleToggle('consultation_reminders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prescription-reminders" className="text-sm">
                Prescription reminders
              </Label>
              <Switch
                id="prescription-reminders"
                checked={preferences.prescription_reminders}
                onCheckedChange={(checked) => handleToggle('prescription_reminders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-reminders" className="text-sm">
                Payment reminders
              </Label>
              <Switch
                id="payment-reminders"
                checked={preferences.payment_reminders}
                onCheckedChange={(checked) => handleToggle('payment_reminders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm">
                Push notifications
              </Label>
              <Switch
                id="push-notifications"
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => handleToggle('push_notifications', checked)}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}