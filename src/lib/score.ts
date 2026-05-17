import { UOMType } from "./types";

/**
 * Computes a performance score (0 to 1) based on goal target and actual achievement.
 * 
 * @param uomType The unit of measure type
 * @param target The target value as a string
 * @param actual The actual value achieved as a string
 * @returns A number between 0 and 1 representing the achievement score.
 */
export function computeScore(uomType: UOMType, target: string, actual: string | null): number {
  if (actual === null || actual === '') return 0;
  
  switch (uomType) {
    case 'NUMERIC_MIN':
    case 'PERCENT_MIN': {
      const t = Number(target);
      const a = Number(actual);
      if (isNaN(t) || isNaN(a) || t === 0) return a >= t ? 1 : 0;
      return Math.min(a / t, 1);
    }
    case 'NUMERIC_MAX':
    case 'PERCENT_MAX': {
      const t = Number(target);
      const a = Number(actual);
      if (isNaN(t) || isNaN(a) || a === 0) return 1;
      return Math.min(t / a, 1);
    }
    case 'TIMELINE': {
      try {
        const tDate = new Date(target);
        const aDate = new Date(actual);
        return aDate <= tDate ? 1 : 0;
      } catch (e) {
        return 0;
      }
    }
    case 'ZERO': {
      return Number(actual) === 0 ? 1 : 0;
    }
    default:
      return 0;
  }
}
