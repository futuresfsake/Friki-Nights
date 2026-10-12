// Scripted scares. Two kinds, both listed in the map file:
//   tile triggers   T cells; each gets the next entry of `triggers`, e.g. { scare: 'JS-02', once: true }
//   event triggers  `eventTriggers`, e.g. { when: { type: 'item-taken', keyId: 'parlor' }, scare: 'JS-01', once: true }
// A tile fires when a player steps onto it (not every frame they stand there).
// `once` triggers never fire again, for anyone.

export function createTriggers(map) {
  const tiles = new Map();
  for (const o of map.objects) if (o.type === 'trigger') tiles.set(`${o.x},${o.z}`, o);
  return { tiles, events: map.eventTriggers ?? [], fired: new Set(), lastCell: new Map() };
}

// Call with the player's current cell every frame; returns the triggers that fire now.
export function enterCell(triggers, playerId, cx, cz) {
  const key = `${cx},${cz}`;
  if (triggers.lastCell.get(playerId) === key) return [];
  triggers.lastCell.set(playerId, key);
  const tile = triggers.tiles.get(key);
  return tile ? fire(triggers, tile) : [];
}

// Call with every nightState event; returns the event triggers it sets off.
export function onEvent(triggers, event) {
  return triggers.events.filter((t) => matches(t.when, event)).flatMap((t) => fire(triggers, t));
}

function matches(when, event) {
  return Object.entries(when).every(([k, v]) => event[k] === v);
}

function fire(triggers, trigger) {
  if (trigger.once && triggers.fired.has(trigger.id)) return [];
  triggers.fired.add(trigger.id);
  return [trigger];
}
