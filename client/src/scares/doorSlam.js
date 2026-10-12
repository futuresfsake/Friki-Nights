const BLACKOUT_SECONDS = 1;

// JS-02: the open door behind the player slams shut and every light dies for a second.
// Trigger params: { door: 'door-8-4' }. ctx.slamDoor waits until nobody stands in the
// doorway, so the door never shuts on the player.
export function doorSlamScare(ctx, { door }) {
  ctx.slamDoor(door, () => {
    const now = ctx.now();
    ctx.effects.blackout(now, BLACKOUT_SECONDS);
    ctx.effects.shake(now, 0.3, 0.04);
  });
}
