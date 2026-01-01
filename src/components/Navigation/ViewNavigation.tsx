/**
 * Navigation component for switching between app views
 */

import type { AppView } from '../../types/earthquake';

interface ViewNavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export function ViewNavigation({ currentView, onViewChange }: ViewNavigationProps) {
  const views: { id: AppView; label: string; icon: string }[] = [
    { id: 'ets-events', label: 'ETS Events', icon: '🌊' },
    { id: 'earthquake-charts', label: 'Earthquake Charts', icon: '📊' },
  ];

  return (
    <nav 
      style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.25rem',
        backgroundColor: 'rgba(55, 65, 81, 0.5)',
        borderRadius: '0.5rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: currentView === view.id ? '600' : '400',
            color: currentView === view.id ? 'white' : '#9ca3af',
            backgroundColor: currentView === view.id 
              ? 'rgba(59, 130, 246, 0.8)' 
              : 'transparent',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (currentView !== view.id) {
              e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
              e.currentTarget.style.color = '#d1d5db';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== view.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          <span style={{ fontSize: '1rem' }}>{view.icon}</span>
          <span>{view.label}</span>
        </button>
      ))}
    </nav>
  );
}
