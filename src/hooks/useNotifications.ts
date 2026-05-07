import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationData {
  hasPendingRequest: boolean;
  notifications: AppNotification[];
  unreadCount: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [data, setData] = useState<NotificationData>({ hasPendingRequest: false, notifications: [], unreadCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await ApiClient.get<NotificationData>('/members/me/notifications');
      setData(response);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await ApiClient.put('/members/me/notifications', { notificationId: id });
      // Optimistically update
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        hasPendingRequest: prev.notifications.some(n => !n.is_read && n.id !== id)
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await ApiClient.delete(`/members/me/notifications?id=${id}`);
      setData(prev => {
        const newNotifs = prev.notifications.filter(n => n.id !== id);
        return {
          ...prev,
          notifications: newNotifs,
          unreadCount: newNotifs.filter(n => !n.is_read).length,
          hasPendingRequest: newNotifs.some(n => !n.is_read)
        };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Optionally poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const refresh = () => {
    fetchNotifications();
  };

  return {
    ...data,
    isLoading,
    refresh,
    markAsRead,
    deleteNotification
  };
}
