// Easing + numeric helpers replicated 1:1 from webflow.js (IX2 easing module, bezier-easing,
// IX2EasingUtils.optimizeFloat/applyEasing) and GSAP 3 power eases used by IX3.

// bezier-easing (webflow.js module 1361) — same sample table, Newton iterations and subdivision.
export function bezier(x1, y1, x2, y2) {
  const A = (a1, a2) => 1 - 3 * a2 + 3 * a1
  const B = (a1, a2) => 3 * a2 - 6 * a1
  const C = (a1) => 3 * a1
  const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
  const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)
  const samples = new Float32Array(11)
  if (x1 !== y1 || x2 !== y2) for (let i = 0; i < 11; ++i) samples[i] = calc(i * 0.1, x1, x2)
  const tForX = (x) => {
    let start = 0
    let i = 1
    for (; i !== 10 && samples[i] <= x; ++i) start += 0.1
    --i
    const guess = start + ((x - samples[i]) / (samples[i + 1] - samples[i])) * 0.1
    const s = slope(guess, x1, x2)
    if (s >= 0.001) {
      let t = guess
      for (let n = 0; n < 4; ++n) {
        const cs = slope(t, x1, x2)
        if (cs === 0) break
        t -= (calc(t, x1, x2) - x) / cs
      }
      return t
    }
    if (s === 0) return guess
    let a = start
    let b = start + 0.1
    let cur
    let cx
    let k = 0
    do {
      cur = a + (b - a) / 2
      cx = calc(cur, x1, x2) - x
      if (cx > 0) b = cur
      else a = cur
    } while (Math.abs(cx) > 1e-7 && ++k < 10)
    return cur
  }
  return (x) => (x1 === y1 && x2 === y2 ? x : x === 0 ? 0 : x === 1 ? 1 : calc(tForX(x), y1, y2))
}

// Only the IX2 easing names referenced by the ported action lists.
const IX2_EASINGS = {
  ease: bezier(0.25, 0.1, 0.25, 1),
  outQuart: (e) => -(Math.pow(e - 1, 4) - 1),
  outCirc: (e) => Math.sqrt(1 - Math.pow(e - 1, 2)),
}

export function optimizeFloat(e, t = 5, n = 10) {
  const i = Math.pow(n, t)
  const r = Number(Math.round(e * i) / i)
  return Math.abs(r) > 1e-4 ? r : 0
}

export function applyEasing(name, t, customFn) {
  if (t === 0) return 0
  if (t === 1) return 1
  if (customFn) return optimizeFloat(t > 0 ? customFn(t) : t)
  return optimizeFloat(t > 0 && name && IX2_EASINGS[name] ? IX2_EASINGS[name](t) : t)
}

// GSAP 3: power2 === cubic. IX3 numeric ease codes index GSAP's list:
// ["none","power1.in","power1.out","power1.inOut","power2.in","power2.out"(5),"power2.inOut"(6),…]
export const GSAP_EASES = {
  'power2.out': (p) => 1 - (1 - p) ** 3,
  'power2.inOut': (p) => (p < 0.5 ? (p * 2) ** 3 / 2 : 1 - ((1 - p) * 2) ** 3 / 2),
}
