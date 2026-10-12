import { describe, expect, it } from 'vitest';
import { createEffects } from '../src/scares/effects.js';
import { createScares } from '../src/scares/scares.js';

function setup() {
  const ui = { open: false };
  const played = [];
  const scares = createScares({ isUiOpen: () => ui.open, ctx: { tag: 'ctx' } });
  scares.register('JS-01', (ctx, params) => played.push([ctx.tag, params.n]));
  return { ui, played, scares };
}

describe('scare framework', () => {
  it('plays a registered scare with its params', () => {
    const { played, scares } = setup();
    expect(scares.playScare('JS-01', { n: 1 })).toBe('played');
    expect(played).toEqual([['ctx', 1]]);
  });

  it('never plays while a UI is open; plays when it closes', () => {
    const { ui, played, scares } = setup();
    ui.open = true;
    expect(scares.playScare('JS-01', { n: 2 })).toBe('delayed');
    scares.update();
    expect(played).toEqual([]);
    ui.open = false;
    scares.update();
    expect(played).toEqual([['ctx', 2]]);
  });

  it('ignores unknown scares', () => {
    const { scares } = setup();
    expect(scares.playScare('JS-99')).toBe('unknown');
  });
});

describe('scare effects', () => {
  it('shakes, then fades to still', () => {
    const fx = createEffects(() => 1);
    fx.shake(10, 0.5, 0.1);
    expect(fx.shakeOffset(10).x).toBeCloseTo(0.1);
    expect(fx.shakeOffset(10.25).x).toBeCloseTo(0.05);
    expect(fx.shakeOffset(10.5)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('blacks out for the given time', () => {
    const fx = createEffects();
    fx.blackout(5, 1);
    expect(fx.isBlackout(5.5)).toBe(true);
    expect(fx.isBlackout(6)).toBe(false);
  });
});
