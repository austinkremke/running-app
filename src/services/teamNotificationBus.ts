type TeamNotificationListener = () => void;

const listeners = new Set<TeamNotificationListener>();

/** Fire after any team invite/request action so indicators + lists resync. */
export function subscribeTeamNotifications(listener: TeamNotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyTeamNotificationsChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}
