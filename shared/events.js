import { z } from 'zod';

// Socket event payloads, checked by the server before anything else touches them.
// Shared so the client sends exactly what the server expects.

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
export const ROOM_CODE_LENGTH = 6;

// Raw names are cleaned by cleanName() on the server; this only bounds the work.
const rawName = z.string().max(100);
// Typed by people: case and stray spaces are forgiven.
const roomCode = z
  .string()
  .max(20)
  .transform((s) => s.replace(/\s/g, '').toUpperCase());

const coord = z.number().finite().min(-1000).max(1000);

export const MOVE_RATE = 15; // Hz

export function isRoomCode(code) {
  return code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
}

export const schemas = {
  'room:create': z.object({ name: rawName }).strict(),
  'room:join': z.object({ code: roomCode, name: rawName }).strict(),
  // The code word itself never leaves the browser: only its SHA-256, as hex.
  'player:ready': z.union([
    z.object({ ready: z.literal(true), codeWordHash: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    z.object({ ready: z.literal(false) }).strict(),
  ]),
  'night:begin': z.object({}).strict(),
  // Sent up to MOVE_RATE times a second; t is the sender's clock in ms, for smoothing.
  // light: their flashlight is on, so teammates see the beam.
  'player:move': z
    .object({
      x: coord,
      z: coord,
      yaw: z.number().finite().min(-10).max(10),
      pitch: z.number().finite().min(-2).max(2),
      light: z.boolean(),
      t: z.number().finite().nonnegative(),
    })
    .strict(),
};
