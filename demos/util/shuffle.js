/**
 * Dette er en implementasjon av Fisher-Yates shuffling.
 * Se https://bost.ocks.org/mike/shuffle/ for en forklaring.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
export function shuffle(arr) {
  // NOTE: Vi lager en kopi, selv om vi ikke egentlig må. Bare for å gjøre det litt mindre bug-prone.
  let result = [...arr];

  let remaining = result.length;

  while (remaining) {
    // Velg et random element blandt de gjenværende ikke-randomiserte elementene.
    let randomIndex = Math.floor(Math.random() * remaining);
    // Senk antall gjenværende med 1
    remaining -= 1;
    // Lagre det siste ikke-randomiserte elementet og legg det i en midlertidig variabel
    let temp = result[remaining];
    // Putt det tilfeldig utvalgte elementet inn i steden fro det siste ikke-randomiserte elementet
    result[remaining] = result[randomIndex];
    // Putt det ikke-randomiserte elemetet inn der det nå åpna seg en spot
    result[randomIndex] = temp;

    // Gjenta til det ikke er fler ikke-randomiserte elementer igjen.
  }

  return result;
}
