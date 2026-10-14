// Shared category → emoji map, used as a fallback when an item has no photo.
export const CATEGORY_ICONS = {
  'Power Tools': '🛠️',
  'Home & Garden': '🪜',
  Electronics: '📷',
  Kitchen: '🍳',
  'Sports & Outdoor': '⛺',
};

export function getCategoryIcon(name) {
  return CATEGORY_ICONS[name] || '📦';
}
