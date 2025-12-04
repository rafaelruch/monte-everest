import { useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'contact' | 'review';
  title: string;
  message: string;
  createdAt: Date | string;
  isRead?: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationBell({ 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead 
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    } catch {
      return 'há pouco tempo';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return '📩';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={onMarkAllAsRead}
              data-testid="button-mark-all-read"
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-4 border-b last:border-b-0 ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
                {!notification.isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-green-100 hover:text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    title="Marcar como lida"
                    data-testid={`dismiss-notification-${notification.id}`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
