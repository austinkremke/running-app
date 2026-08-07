import { createContext, useContext, useState, type ReactNode } from 'react';

import { useTeamNotifications } from '../hooks/useTeamNotifications';
import type { AppNotification } from '../hooks/useTeamNotifications';

type NotificationCenterContextValue = {
  notifications: AppNotification[];
  loading: boolean;
  actionLoadingId: string | null;
  hasUnread: boolean;
  respond: (notification: AppNotification, accept: boolean) => Promise<void>;
  visible: boolean;
  open: () => void;
  close: () => void;
};

const NotificationCenterContext = createContext<NotificationCenterContextValue | null>(null);

/** Bell badge + drawer state, shared across every screen's header instead of
 *  living in one central AppShell component — screens open it via `open()`,
 *  the drawer itself is mounted once at the navigator root. */
export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const { notifications, loading, actionLoadingId, hasUnread, respond } = useTeamNotifications();
  const [visible, setVisible] = useState(false);

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications,
        loading,
        actionLoadingId,
        hasUnread,
        respond,
        visible,
        open: () => setVisible(true),
        close: () => setVisible(false),
      }}
    >
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  }
  return context;
}
