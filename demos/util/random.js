/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function random2(min, max) {
  return min + (max - min) * Math.random();
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function random2i(min, max) {
  return Math.floor(random2(min, max));
}
