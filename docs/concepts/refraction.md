# Refraction

Refraction is the bending of light as it passes from one medium into another (e.g.
air into glass) because light travels at different speeds in different materials.
It is the physical core of the liquid-glass effect.

## Snell–Descartes law

$$ n_1 \sin(\theta_1) = n_2 \sin(\theta_2) $$

- $n_1$ — refractive index of the first medium
- $\theta_1$ — angle of incidence
- $n_2$ — refractive index of the second medium
- $\theta_2$ — angle of refraction

Behavior:
- $n_2 = n_1$ → the ray passes straight through (no bend).
- $n_2 > n_1$ → the ray bends **toward** the normal.
- $n_2 < n_1$ → the ray bends **away** from the normal; past the critical angle it
  undergoes **total internal reflection**.
- A ray **orthogonal** to the surface passes straight through regardless of indices.

## Simplifying assumptions (matching the reference)

To keep the math tractable the library uses the same constraints as the article:

- Ambient medium is air, $index = 1$.
- Glass materials use $index > 1$, preferring $1.5$.
- Only **one** refraction event (ignore the exit/second refraction).
- Incident rays are **orthogonal to the background plane** (no perspective).
- Objects are 2D shapes **parallel** to the background.
- **No gap** between the object and the background plane.
- **Circle** base shape only; rounded rectangles are formed by stretching the middle
  of a circle. Other shapes require extra preliminary math.

Under these assumptions every ray has a well-defined refracted direction, which keeps
displacement-field generation fast and deterministic.

## Implementation

See `packages/core/src/refraction/snell.ts`. The refracted angle is derived from
Snell's law, with a guard for total internal reflection (no real solution).

> Concept reference: kube.io, *Liquid Glass in the Browser*. Math is public domain;
> see [../attribution.md](../attribution.md).
