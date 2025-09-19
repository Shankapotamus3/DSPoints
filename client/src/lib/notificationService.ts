import { queryClient } from '@/lib/queryClient';

export interface NotificationData {
  title: string;
  message: string;
  type: 'chore_completed' | 'chore_approved' | 'chore_rejected';
  choreId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(data: NotificationData): Promise<void> {
    // Try to show browser notification if permission granted
    if (this.permission === 'granted') {
      try {
        const notification = new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.choreId || 'general',
          requireInteraction: data.type === 'chore_completed',
        });

        notification.onclick = () => {
          window.focus();
          if (data.choreId) {
            // Navigate to chores page or specific chore
            window.location.hash = '#/chores';
          }
          notification.close();
        };
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }

    // Always invalidate notifications cache to update UI
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Poll for new notifications (simpler than WebSocket for MVP)
  startPolling(): void {
    const pollInterval = 30000; // 30 seconds
    
    const poll = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    };

    // Poll immediately, then every interval
    poll();
    setInterval(poll, pollInterval);
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = NotificationService.getInstance();