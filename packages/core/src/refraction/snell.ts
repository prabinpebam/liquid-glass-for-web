/**
 * Snell–Descartes refraction. See ../../../docs/reference/concepts/refraction.md.
 *
 *   n1 * sin(theta1) = n2 * sin(theta2)
 *
 * Pure math (public domain).
 */

export interface RefractResult {
  /** Refracted angle in radians, or null on total internal reflection. */
  angle: number | null;
  /** True when the ray undergoes total internal reflection (no transmission). */
  totalInternalReflection: boolean;
}

/**
 * Compute the refracted angle for a ray crossing from medium `n1` into `n2`.
 * @param incidenceAngle angle of incidence in radians (from the surface normal)
 * @param n1 refractive index of the first medium (air ≈ 1)
 * @param n2 refractive index of the second medium (glass ≈ 1.5)
 */
export function refract(incidenceAngle: number, n1: number, n2: number): RefractResult {
  const sinT2 = (n1 / n2) * Math.sin(incidenceAngle);
  if (Math.abs(sinT2) > 1) {
    // No real solution → total internal reflection.
    return { angle: null, totalInternalReflection: true };
  }
  return { angle: Math.asin(sinT2), totalInternalReflection: false };
}
