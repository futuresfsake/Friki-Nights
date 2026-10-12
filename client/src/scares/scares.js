// One place that plays every scare, so they all follow the same rules:
//   - never while a UI is open (note reader, pause, end screen): the scare waits and
//     plays the moment the UI closes, so it still lands on the player
//   - each scare is a function registered by id (JS-01, JS-02, ...) and receives the
//     shared helpers in `ctx` plus the trigger's params
export function createScares({ isUiOpen, ctx }) {
  const registry = new Map();
  const pending = [];

  function run(id, params) {
    registry.get(id)(ctx, params);
  }

  return {
    register(id, fn) {
      registry.set(id, fn);
    },
    // Returns what happened, mostly for tests: 'played', 'delayed' or 'unknown'.
    playScare(id, params = {}) {
      if (!registry.has(id)) return 'unknown';
      if (isUiOpen()) {
        pending.push([id, params]);
        return 'delayed';
      }
      run(id, params);
      return 'played';
    },
    // Call every frame; plays delayed scares once the UI is closed.
    update() {
      while (pending.length && !isUiOpen()) run(...pending.shift());
    },
  };
}
