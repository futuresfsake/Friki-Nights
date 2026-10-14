// Shared by client and server (from M3), so both agree on sizes, speeds, and limits.

export const CELL = 2; // metres per map cell
export const WALL_HEIGHT = 3;
export const EYE_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.3;

export const WALK_SPEED = 2.2; // m/s
export const RUN_SPEED = 4.0;
export const STEP_LENGTH = 0.95; // metres per footstep

export const PIXEL_RATIO = 0.5; // NFR-01: low resolution for the PS1 look and 60 fps

export const BATTERY_MAX = 100;
export const BATTERY_DRAIN_PER_SECOND = 100 / 150; // full battery lasts 2.5 min
export const BATTERY_LOW = 20;

export const INTERACT_DISTANCE = 2; // metres; also checked by the server from M3
export const MAX_PLAYERS = 4;

// One per seat, in join order: jacket colour and a faint flashlight tint, so you can
// tell teammates apart in the dark. Muted, so nobody glows like a toy.
export const PLAYER_COLORS = [
  { name: 'red', cloth: 0x6a2a26, light: 0xffe0d0 },
  { name: 'blue', cloth: 0x2a3c62, light: 0xdde6ff },
  { name: 'green', cloth: 0x2f5234, light: 0xe2ffd8 },
  { name: 'amber', cloth: 0x6e5222, light: 0xfff0c8 },
];
