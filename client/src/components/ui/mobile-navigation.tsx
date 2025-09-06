import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export function MobileHeader({ title, leftAction, rightAction, onBack, className = "" }: MobileHeaderProps) {
  return (
    <div className={`
      flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-lg
      border-b border-gray-200/50 sticky top-0 z-50
      ${className}
    `}>
      <div className="flex items-center min-w-0 flex-1">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 mr-2"
          >
            <ChevronLeft className="w-5 h-5 text-blue-500" />
          </button>
        )}
        {leftAction && (
          <div className="mr-2">
            {leftAction}
          </div>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
      </div>
      
      {rightAction && (
        <div className="ml-2 flex-shrink-0">
          {rightAction}
        </div>
      )}
    </div>
  );
}

interface MobileTabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: ReactNode;
    badge?: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileTabBar({ tabs, activeTab, onTabChange, className = "" }: MobileTabBarProps) {
  return (
    <div className={`
      flex items-center bg-white/95 backdrop-blur-lg border-t border-gray-200/50
      safe-area-inset-bottom
      ${className}
    `}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[50px]
            transition-colors duration-150
            ${activeTab === tab.id 
              ? 'text-blue-500' 
              : 'text-gray-400 hover:text-gray-600 active:text-gray-700'
            }
          `}
        >
          <div className="relative">
            {tab.icon}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                {tab.badge}
              </span>
            )}
          </div>
          <span className="text-xs mt-1 truncate max-w-full">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

interface MobileActionButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

export function MobileActionButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = ""
}: MobileActionButtonProps) {
  const baseClasses = `
    flex items-center justify-center font-medium rounded-xl
    transition-all duration-150 active:scale-95
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
  `;
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900',
    destructive: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-3 text-base h-12',
    lg: 'px-6 py-4 text-lg h-14'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={loading ? undefined : onClick}
      disabled={loading}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}