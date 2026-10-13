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

export function isRoomCode(code) {
  return code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
}

export const schemas = {
  'room:create': z.object({ name: rawName }).strict(),
  'room:join': z.object({ code: roomCode, name: rawName }).strict(),
};
