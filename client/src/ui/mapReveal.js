// Which rooms the player has been in, for shading them on the house map. Pure logic.

export function roomAt(map, cx, cz) {
  return map.rooms.find((r) => cx >= r.x0 && cx <= r.x1 && cz >= r.z0 && cz <= r.z1) ?? null;
}

export function createReveal(map) {
  const visited = new Set();
  return {
    // Call with the player's cell; returns the room's name the first time it's entered.
    visit(cx, cz) {
      const room = roomAt(map, cx, cz);
      if (!room || visited.has(room.name)) return null;
      visited.add(room.name);
      return room.name;
    },
    has: (name) => visited.has(name),
    get count() {
      return visited.size;
    },
  };
}
