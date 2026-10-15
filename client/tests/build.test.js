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
  const canvas = () => ({ width: 720, height: 440, getContext: () => ctx });
  globalThis.document = { createElement: canvas };
  globalThis.mapRoot = { querySelector: () => canvas(), classList: { add() {}, remove() {} } };
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
    for (const pose of ['stand', 'lean', 'walk', 'run', 'wave', 'shush', 'scream', 'head']) {
      model.setPose(pose);
      model.face(1, 1);
      model.lookAt(3, -2);
      for (let t = 0; t < 5; t += 0.1) model.update(0.1, t, 1);
    }
  });

  it('builds a partner with a name tag in their seat colour', async () => {
    const { PLAYER_COLORS } = await import('../../shared/constants.js');
    const { createPartnerModel } = await import('../src/world/partnerModel.js');
    const colors = new Set();
    for (let slot = 0; slot < 4; slot++) {
      const p = createPartnerModel('Ana', slot);
      expect(p.color).toBe(PLAYER_COLORS[slot]);
      colors.add(p.color.cloth);
      p.pose({ x: 1, z: 2, yaw: 1, pitch: 0.2, light: false }, 2, 0.016, 3);
      p.dispose();
    }
    expect(colors.size).toBe(4);
  });

  it('lets you take the house map off the wall, once', async () => {
    const THREE = await import('three');
    const { parseMap } = await import('../../shared/mapParser.js');
    const night1 = (await import('../../shared/maps/night1.js')).default;
    const { createProps, HOUSE_MAP_ID } = await import('../src/world/props.js');
    const scene = new THREE.Scene();
    const props = createProps(parseMap(night1), scene);
    expect(props.targets().map((m) => m.userData.targetId)).toEqual([HOUSE_MAP_ID]);
    const before = scene.children.length;
    props.take(HOUSE_MAP_ID);
    expect(props.targets()).toEqual([]);
    expect(scene.children.length).toBe(before - 1);
  });

  it('draws the house map with a ghost dot', async () => {
    const { parseMap } = await import('../../shared/mapParser.js');
    const night1 = (await import('../../shared/maps/night1.js')).default;
    const { createHouseMapView } = await import('../src/ui/houseMap.js');
    const { createReveal } = await import('../src/ui/mapReveal.js');
    const view = createHouseMapView(parseMap(night1), { root: globalThis.mapRoot });
    const reveal = createReveal(parseMap(night1));
    reveal.visit(12, 6);
    view.open();
    view.draw({ player: { x: 25, z: 13, yaw: 0 }, reveal, ghost: { x: 20, z: 13 } });
    expect(view.isOpen()).toBe(true);
    view.close();
    expect(view.isOpen()).toBe(false);
  });
});
