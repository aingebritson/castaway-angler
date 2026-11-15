export class OfflineManager {
  waiting?: ServiceWorker;
  private approved = false;
  ready = false;
  constructor(private onChange: () => void) {}
  async start() {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: 'none' });
      const check = () => { this.waiting = registration.waiting ?? undefined; this.onChange(); };
      check();
      registration.addEventListener('updatefound', () => {
        registration.installing?.addEventListener('statechange', check);
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (this.approved) location.reload(); });
      void registration.update().catch(() => {});
      await navigator.serviceWorker.ready;
      this.ready = true; this.onChange();
    } catch { this.onChange(); }
  }
  activate() { if (this.waiting) { this.approved = true; this.waiting.postMessage({ type: 'ACTIVATE_UPDATE' }); } }
}

