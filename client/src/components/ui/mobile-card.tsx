import { ReactNode } from "react";
import { Card, CardContent } from "./card";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className = "", onClick }: MobileCardProps) {
  return (
    <Card 
      className={`
        rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm
        hover:shadow-md transition-all duration-200
        active:scale-98 active:shadow-sm
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileStatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  gradient: string;
}

export function MobileStatsCard({ title, value, subtitle, icon, gradient }: MobileStatsCardProps) {
  return (
    <MobileCard className={`${gradient} text-white border-0`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-90 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="opacity-80">
          {icon}
        </div>
      </div>
    </MobileCard>
  );
}

interface MobileListItemProps {
  title: string;
  subtitle: string;
  detail?: string;
  avatar?: ReactNode;
  badge?: ReactNode;
  onTap?: () => void;
}

export function MobileListItem({ title, subtitle, detail, avatar, badge, onTap }: MobileListItemProps) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-4 rounded-xl bg-gray-50/80 backdrop-blur-sm
        active:bg-gray-100 transition-colors duration-150
        ${onTap ? 'cursor-pointer' : ''}
      `}
      onClick={onTap}
    >
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        {detail && (
          <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
        )}
      </div>
      {badge && (
        <div className="flex-shrink-0">
          {badge}
        </div>
      )}
    </div>
  );
}