/**
 * Utility functions for services
 */

import { randomInt } from "crypto";

/**
 * Get numbers in range, inclusive.
 * Matches user-feeds getNumbersInRange.
 */
export function getNumbersInRange({
  countToGet,
  max,
  min,
  random,
}: {
  min: number;
  max: number;
  countToGet: number;
  random?: boolean;
}): number[] {
  if (max < min) {
    throw new Error("max must be greater than min");
  }

  const numbers: number[] = [];

  if (random) {
    while (numbers.length < countToGet) {
      const randomNum = randomInt(min, max + 1);

      if (!numbers.includes(randomNum)) {
        numbers.push(randomNum);
      }
    }
  } else {
    for (let i = min; i <= max && numbers.length < countToGet; i++) {
      numbers.push(i);
    }
  }

  return numbers;
}
