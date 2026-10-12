import { itemName } from '../world/items.js';

// Text lines for what a player carries. Batteries are used the moment they're picked
// up, so only keys and fuses ever show here.
export function inventoryLines(player) {
  const lines = (player?.keys ?? []).map((keyId) => itemName({ type: 'key', keyId }));
  if (player?.fuses) lines.push(player.fuses === 1 ? 'Fuse' : `Fuse ×${player.fuses}`);
  return lines;
}

// Shown while Tab is held.
export function createInventory() {
  const panel = document.getElementById('inventory');
  const list = document.getElementById('inventory-list');
  return {
    show(player) {
      const lines = inventoryLines(player);
      list.replaceChildren(
        ...(lines.length ? lines : ['Nothing.']).map((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          return li;
        }),
      );
      panel.classList.add('show');
    },
    hide() {
      panel.classList.remove('show');
    },
  };
}
