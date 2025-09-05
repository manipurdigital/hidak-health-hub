export class BrowserNotificationManager {
  private static instance: BrowserNotificationManager;
  private permission: NotificationPermission = 'default';

  static getInstance(): BrowserNotificationManager {
    if (!BrowserNotificationManager.instance) {
      BrowserNotificationManager.instance = new BrowserNotificationManager();
    }
    return BrowserNotificationManager.instance;
  }

  constructor() {
    this.permission = Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async showIncomingCallNotification(callerName: string, callerRole: string): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification('Incoming Call', {
        body: `${callerName} (${callerRole}) is calling you`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'incoming-call',
        requireInteraction: true
      });

      // Auto-close after 30 seconds
      setTimeout(() => {
        notification.close();
      }, 30000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  closeNotification(tag: string = 'incoming-call') {
    // Close notification by tag (not widely supported, but we try)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications({ tag }).then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }
}

export const browserNotificationManager = BrowserNotificationManager.getInstance();