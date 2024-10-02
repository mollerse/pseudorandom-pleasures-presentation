/**
 * @param {number} min
 * @param {number} max
 * @param {number} v
 * @returns {number}
 */
export function normalize(min, max, v) {
  return (v - min) / (max - min);
}
