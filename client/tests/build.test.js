import { beforeAll, describe, expect, it } from 'vitest';

// Three.js runs fine in Node, but textures are drawn on <canvas>. A stand-in canvas
// that accepts every drawing call lets us build every mesh and catch mistakes in the
// builders without a browser.
beforeAll(() => {
  const ctx = new Proxy(
    {},
    {
      get: (target, key) => (key in target ? target[key] : () => ({ addColorStop() {} })),
      set: (target, key, value) => ((target[key] = value), true),
    },
  );
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

describe('3D builders', () => {
  it('builds every prop in Night 1 and animates them', async () => {
    const THREE = await import('three');
    const { parseMap } = await import('../../shared/mapParser.js');
    const night1 = (await import('../../shared/maps/night1.js')).default;
    const { createProps } = await import('../src/world/props.js');
    const scene = new THREE.Scene();
    const ticks = [];
    const props = createProps(parseMap(night1), scene, { tick: (...a) => ticks.push(a) });
    expect(scene.children.length).toBe(parseMap(night1).props.length);
    expect(props.meshes.length).toBeGreaterThan(50);
    for (let t = 0; t < 200; t += 0.5) props.update(t);
    expect(ticks.length).toBeGreaterThan(100);
  });

  it('builds the Tenant in every pose', async () => {
    const { createTenantModel } = await import('../src/tenant/model.js');
    const model = createTenantModel();
    for (const pose of ['stand', 'lean', 'walk', 'run', 'wave', 'shush', 'head']) {
      model.setPose(pose);
      model.face(1, 1);
      model.lookAt(3, -2);
      for (let t = 0; t < 5; t += 0.1) model.update(0.1, t, 1);
    }
  });

  it('builds a partner with a name tag', async () => {
    const { createPartnerModel } = await import('../src/world/partnerModel.js');
    const p = createPartnerModel('Ana');
    p.pose({ x: 1, z: 2, yaw: 1, pitch: 0.2, light: false }, 2, 0.016);
    p.dispose();
  });
});
