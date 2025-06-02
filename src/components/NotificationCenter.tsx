
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  related_campaign_id?: string;
  related_influencer_id?: string;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'mock-user-123',
    title: 'Campaign Update',
    message: 'Your Tech Product Launch campaign has received 3 new influencer applications.',
    type: 'info',
    is_read: false,
    related_campaign_id: '1',
    created_at: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    user_id: 'mock-user-123',
    title: 'Payment Processed',
    message: 'Payment of $2,500 has been processed for Fashion Summer Collection campaign.',
    type: 'success',
    is_read: false,
    related_campaign_id: '2',
    created_at: '2024-01-19T14:20:00Z'
  },
  {
    id: '3',
    user_id: 'mock-user-123',
    title: 'Content Review Required',
    message: 'New content submitted for Fitness App Promotion requires your approval.',
    type: 'warning',
    is_read: true,
    related_campaign_id: '3',
    created_at: '2024-01-18T09:15:00Z'
  },
  {
    id: '4',
    user_id: 'mock-user-123',
    title: 'Campaign Completed',
    message: 'Sustainable Beauty Line campaign has been successfully completed with excellent results.',
    type: 'success',
    is_read: true,
    related_campaign_id: '4',
    created_at: '2024-01-17T16:45:00Z'
  }
];

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated.",
    });
  };

  // Refresh notifications
  const refreshNotifications = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Notifications refreshed",
        description: "Your notifications are up to date.",
      });
    }, 1000);
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-500';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'error':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-blue-500/10 text-blue-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <Card 
        className="bg-zinc-900 border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-snow flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-purple-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshNotifications}
                variant="ghost"
                size="sm"
                className="text-snow/70 hover:text-purple-500"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-snow/70 hover:text-purple-500"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-snow/70 hover:text-purple-500"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-snow/60">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-snow/60">
                <Bell className="h-12 w-12 mx-auto mb-4 text-snow/30" />
                <p>No notifications yet</p>
                <p className="text-sm mt-2">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-zinc-800/50 transition-colors ${
                      !notification.is_read ? 'bg-zinc-800/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${
                            !notification.is_read ? 'text-snow' : 'text-snow/80'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge className={getNotificationBadgeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          )}
                        </div>
                        <p className={`text-sm ${
                          !notification.is_read ? 'text-snow/70' : 'text-snow/50'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-snow/40 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!notification.is_read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-snow/50 hover:text-purple-500 h-8 w-8 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-snow/50 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCenter;
