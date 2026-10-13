// All puzzle state for one night, changed only through apply(). No Three.js or DOM,
// so the same code runs in the browser now and on the server from M3.

export const BATTERY_PICKUP = 40;

// playerCount (1–4) lets puzzles scale with the room size.
export function createNightState(map, { playerCount = 1 } = {}) {
  const state = {
    doors: {},
    items: {},
    notes: {},
    beds: {},
    fuseBox: null,
    fusesNeeded: 0,
    power: false,
    exitOpen: false,
    completed: false,
    players: {},
    notesRead: new Set(),
    playerCount,
  };

  for (const o of map.objects) {
    if (o.type === 'door') state.doors[o.id] = { open: false, locked: !!o.locked, keyId: o.keyId ?? null };
    if (o.type === 'exit') state.doors[o.id] = { open: false, locked: false, exit: true };
    if (o.type === 'key' || o.type === 'battery' || o.type === 'fuse') {
      state.items[o.id] = { type: o.type, keyId: o.keyId ?? null, taken: false };
    }
    if (o.type === 'fuse') state.fusesNeeded++;
    if (o.type === 'note') state.notes[o.id] = { text: o.text };
    if (o.type === 'bed') state.beds[o.id] = { occupant: null };
    if (o.type === 'fuseBox') state.fuseBox = { id: o.id, locked: !!o.keyId, keyId: o.keyId, placed: 0 };
  }
  // No fuse box means no power puzzle: the exit simply starts unlocked.
  if (!state.fuseBox) state.exitOpen = true;
  return state;
}

export function addPlayer(state, playerId) {
  state.players[playerId] ??= { keys: [], fuses: 0, hidingIn: null };
  return state.players[playerId];
}

// Returns a list of events describing what happened, for the client to animate
// and (from M3) the server to broadcast. Invalid actions return a single 'denied' event.
export function apply(state, action) {
  const player = addPlayer(state, action.playerId);
  if (state.completed) return [denied('night-over')];

  if (action.type === 'reach-exit') {
    if (!state.exitOpen) return [denied('exit-sealed')];
    state.completed = true;
    return [{ type: 'night-complete' }];
  }

  // Scripted scares (JS-02) shut a door on the players; it can be opened again normally.
  if (action.type === 'slam-door') {
    const door = state.doors[action.targetId];
    if (!door?.open) return [];
    door.open = false;
    return [{ type: 'door-slammed', targetId: action.targetId }];
  }

  if (action.type !== 'interact') return [denied('unknown-action')];
  const id = action.targetId;

  // Under a bed the only thing a player can do is crawl back out.
  if (player.hidingIn && id !== player.hidingIn) return [denied('hiding', id)];
  if (state.beds[id]) return useBed(state, player, action.playerId, id);
  if (state.doors[id]) return interactDoor(state, player, id);
  if (state.items[id]) return pickUp(state, player, id);
  if (state.notes[id]) {
    state.notesRead.add(id);
    return [{ type: 'note-read', targetId: id, text: state.notes[id].text }];
  }
  if (state.fuseBox?.id === id) return useFuseBox(state, player);
  return [denied('unknown-target', id)];
}

function interactDoor(state, player, id) {
  const door = state.doors[id];
  if (door.exit) {
    if (!state.exitOpen) return [denied('exit-sealed', id)];
    door.open = !door.open;
    return [{ type: door.open ? 'door-opened' : 'door-closed', targetId: id }];
  }
  if (door.locked) {
    if (!player.keys.includes(door.keyId)) return [denied('locked', id)];
    door.locked = false;
    door.open = true;
    return [{ type: 'door-unlocked', targetId: id }, { type: 'door-opened', targetId: id }];
  }
  door.open = !door.open;
  return [{ type: door.open ? 'door-opened' : 'door-closed', targetId: id }];
}

function pickUp(state, player, id) {
  const item = state.items[id];
  if (item.taken) return [denied('already-taken', id)];
  item.taken = true;
  if (item.type === 'key') player.keys.push(item.keyId);
  if (item.type === 'fuse') player.fuses++;
  const event = { type: 'item-taken', targetId: id, item: item.type };
  if (item.type === 'key') event.keyId = item.keyId;
  if (item.type === 'battery') event.amount = BATTERY_PICKUP;
  return [event];
}

// One player per bed. The entity (M5) will read beds[id].occupant to know who is hidden.
function useBed(state, player, playerId, id) {
  const bed = state.beds[id];
  if (player.hidingIn === id) {
    bed.occupant = null;
    player.hidingIn = null;
    return [{ type: 'left-hiding', targetId: id, playerId }];
  }
  if (bed.occupant) return [denied('bed-taken', id)];
  bed.occupant = playerId;
  player.hidingIn = id;
  return [{ type: 'hid', targetId: id, playerId }];
}

function useFuseBox(state, player) {
  const box = state.fuseBox;
  const id = box.id;
  if (box.locked) {
    if (!player.keys.includes(box.keyId)) return [denied('locked', id)];
    box.locked = false;
    return [{ type: 'fusebox-unlocked', targetId: id }];
  }
  if (state.power) return [denied('power-already-on', id)];
  if (player.fuses === 0) return [denied('need-fuses', id)];

  player.fuses--;
  box.placed++;
  const events = [{ type: 'fuse-placed', targetId: id, placed: box.placed, needed: state.fusesNeeded }];
  if (box.placed >= state.fusesNeeded) {
    state.power = true;
    state.exitOpen = true;
    events.push({ type: 'power-on' }, { type: 'exit-unlocked' });
  }
  return events;
}

function denied(reason, targetId) {
  return { type: 'denied', reason, targetId };
}

// Closed doors (including a sealed exit) and beds block movement; everything else is walkable.
export function blocksMovement(state, objectId) {
  if (state.beds[objectId]) return true;
  const door = state.doors[objectId];
  return !!door && !door.open;
}
