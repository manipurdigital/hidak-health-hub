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

        {/* Email Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium">Email Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-created-email" className="text-sm">
                New booking created
              </Label>
              <Switch
                id="booking-created-email"
                checked={preferences.booking_created_email}
                onCheckedChange={(checked) => handleToggle('booking_created_email', checked)}
                disabled={!preferences.email_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-assigned-email" className="text-sm">
                Booking assigned
              </Label>
              <Switch
                id="booking-assigned-email"
                checked={preferences.booking_assigned_email}
                onCheckedChange={(checked) => handleToggle('booking_assigned_email', checked)}
                disabled={!preferences.email_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status-updates-email" className="text-sm">
                Status updates
              </Label>
              <Switch
                id="status-updates-email"
                checked={preferences.status_updates_email}
                onCheckedChange={(checked) => handleToggle('status_updates_email', checked)}
                disabled={!preferences.email_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reschedule-requests-email" className="text-sm">
                Reschedule requests
              </Label>
              <Switch
                id="reschedule-requests-email"
                checked={preferences.reschedule_requests_email}
                onCheckedChange={(checked) => handleToggle('reschedule_requests_email', checked)}
                disabled={!preferences.email_notifications}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* SMS Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium">SMS Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-created-sms" className="text-sm">
                New booking created
              </Label>
              <Switch
                id="booking-created-sms"
                checked={preferences.booking_created_sms}
                onCheckedChange={(checked) => handleToggle('booking_created_sms', checked)}
                disabled={!preferences.sms_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-assigned-sms" className="text-sm">
                Booking assigned
              </Label>
              <Switch
                id="booking-assigned-sms"
                checked={preferences.booking_assigned_sms}
                onCheckedChange={(checked) => handleToggle('booking_assigned_sms', checked)}
                disabled={!preferences.sms_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status-updates-sms" className="text-sm">
                Status updates
              </Label>
              <Switch
                id="status-updates-sms"
                checked={preferences.status_updates_sms}
                onCheckedChange={(checked) => handleToggle('status_updates_sms', checked)}
                disabled={!preferences.sms_notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reschedule-requests-sms" className="text-sm">
                Reschedule requests
              </Label>
              <Switch
                id="reschedule-requests-sms"
                checked={preferences.reschedule_requests_sms}
                onCheckedChange={(checked) => handleToggle('reschedule_requests_sms', checked)}
                disabled={!preferences.sms_notifications}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}