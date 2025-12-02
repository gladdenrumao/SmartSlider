import React from 'react';
import { XCircleIcon, CheckboxIcon, CheckCircleIcon } from './Icons';

interface Item {
  title: string;
  description: string;
  badge?: string;
}

interface ReviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: Item[];
  colorTheme: 'red' | 'yellow' | 'green';
}

const ReviewCard: React.FC<ReviewCardProps> = ({ title, description, icon, items, colorTheme }) => {
  const getThemeStyles = () => {
    switch (colorTheme) {
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          text: 'text-red-900',
          subText: 'text-red-700',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border border-red-200',
          bulletIcon: <XCircleIcon className="w-5 h-5 text-red-500" />
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          text: 'text-amber-900',
          subText: 'text-amber-700',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700 border border-amber-200',
          bulletIcon: <CheckboxIcon className="w-5 h-5 text-amber-500" />
        };
      case 'green':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-100',
          text: 'text-emerald-900',
          subText: 'text-emerald-700',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
          bulletIcon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className={`flex flex-col h-full rounded-2xl border ${theme.border} bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md`}>
      {/* Header */}
      <div className={`p-6 flex flex-col items-center text-center space-y-3 border-b ${theme.border} ${theme.bg}`}>
        <div className={`p-3 rounded-2xl ${theme.iconBg} ${theme.iconColor}`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-xl font-bold ${theme.text}`}>{title}</h3>
          <p className={`text-sm mt-1 ${theme.subText}`}>{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-gray-400 italic">No items to display.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li key={idx} className="flex gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className="mt-0.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                   {theme.bulletIcon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800 text-sm leading-snug">{item.title}</span>
                    {item.badge && (
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${theme.badge}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;