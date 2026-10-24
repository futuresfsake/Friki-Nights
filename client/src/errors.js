window.addEventListener('unhandledrejection', (e) => {
  console.error('[Friki Nights] Unhandled promise rejection:', e.reason);
});

window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') return;
  console.error('[Friki Nights] Uncaught error:', e.error ?? e.message);
});
