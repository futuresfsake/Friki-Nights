import { describe, expect, it } from 'vitest';
import { blocked, moveWithCollision, overlapsCell } from '../src/player/collision.js';
import { parseMap } from '../../shared/mapParser.js';

// Cells are 2 m, so the floor cell (1,1) spans x 2–4, z 2–4.
const map = parseMap(['#####', '#P..#', '#...#', '#####']);
const R = 0.3;

describe('collision', () => {
  it('allows standing in open floor', () => {
    expect(blocked(map, 3, 3, R)).toBe(false);
  });

  it('blocks overlapping a wall', () => {
    expect(blocked(map, 2.1, 3, R)).toBe(true);
  });

  it('moves freely in open space', () => {
    expect(moveWithCollision(map, { x: 3, z: 3 }, 0.5, 0.5, R)).toEqual({ x: 3.5, z: 3.5 });
  });

  it('stops at a wall instead of passing through', () => {
    const pos = moveWithCollision(map, { x: 2.4, z: 3 }, -0.5, 0, R);
    expect(pos.x).toBe(2.4);
  });

  it('slides along a wall when moving diagonally into it', () => {
    const pos = moveWithCollision(map, { x: 2.4, z: 3 }, -0.5, 0.5, R);
    expect(pos).toEqual({ x: 2.4, z: 3.5 });
  });
});

describe('collision with doors', () => {
  // Cell (2,1) holds a door; it blocks only while extraSolid says so.
  const closedDoor = (cx, cz) => cx === 2 && cz === 1;

  it('a closed door blocks like a wall', () => {
    expect(blocked(map, 3.8, 3, R, closedDoor)).toBe(true);
    expect(moveWithCollision(map, { x: 3.6, z: 3 }, 0.3, 0, R, closedDoor).x).toBe(3.6);
  });

  it('an open door lets the player through', () => {
    expect(moveWithCollision(map, { x: 3.6, z: 3 }, 0.3, 0, R).x).toBeCloseTo(3.9);
  });

  it('knows when a player is standing in a door cell', () => {
    expect(overlapsCell(4.1, 3, R, 2, 1)).toBe(true);
    expect(overlapsCell(3.0, 3, R, 2, 1)).toBe(false);
  });
});
