export function startPingMonitor(socket, onPing) {
  const handler = (ms) => onPing(ms);
  socket.io.engine.on('pong', handler);
  return { stop: () => socket.io.engine.off('pong', handler) };
}
