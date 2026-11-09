// Aaruni Tech Mobile PWA Service Worker — Handles 6:00 PM to 9:00 PM IST Push Reminders
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : {
        title: "⏰ Aaruni Tech Timesheet Reminder (6–9 PM IST)",
        body: "Please enter your Entry Time & Exit Time for today in the Aaruni Tech app!",
        url: "/?tab=timesheet",
      };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: "aaruni-timesheet-reminder",
      renotify: true,
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
