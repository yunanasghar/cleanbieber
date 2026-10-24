import React from 'react';
import type { TaskType } from '@/lib/rotation';
import { TASK_DEFINITIONS } from '@/lib/rotation';
import { Utensils, Sparkles, HeartHandshake } from 'lucide-react';

export default function TaskBadge({ task, size = 'sm' }: { task: TaskType; size?: 'sm' | 'md' | 'lg' }) {
  const info = TASK_DEFINITIONS[task] || TASK_DEFINITIONS['MBG'];

  const getIcon = () => {
    switch (task) {
      case 'MBG':
        return <Utensils className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Nyapu & Pel':
        return <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'Helper':
        return <HeartHandshake className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${info.badgeBg} ${info.badgeText} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dotColor}`} />
      {getIcon()}
      <span>{info.title}</span>
    </span>
  );
}
