export interface Notification {
  titre: string;
  message: string;
  url?: string;
  urgente: boolean;
}

export async function notifier(topic: string, notification: Notification): Promise<void> {
  console.log(`Notification : ${notification.titre} | ${notification.message.replaceAll('\n', ' | ')}`);
  if (!topic) {
    return;
  }
  const reponse = await fetch('https://ntfy.sh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      title: notification.titre,
      message: notification.message,
      click: notification.url,
      priority: notification.urgente ? 5 : 3,
      tags: [notification.urgente ? 'tv' : 'warning'],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!reponse.ok) {
    throw new Error(`ntfy a répondu HTTP ${reponse.status}`);
  }
}
