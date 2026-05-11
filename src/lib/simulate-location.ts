import type { Zone } from "@/components/map";

export type PersonLocation = {
  longitude: number;
  latitude: number;
  insideZone: boolean;
  currentZoneName: string | null;
};

// Walking speed: ~1.4 m/s ≈ 0.0000125 degrees/second at NYC latitude
const STEP_SIZE = 0.0000125;
const UPDATE_INTERVAL = 1000; // 1 second

/**
 * Point-in-polygon using ray casting algorithm.
 */
function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is inside any of the provided zones.
 * Returns the first matching zone or null.
 */
export function findContainingZone(
  point: [number, number],
  zones: Zone[]
): Zone | null {
  return zones.find((zone) => isPointInPolygon(point, zone.coordinates)) ?? null;
}

/**
 * Check if a point is inside any of the provided zones.
 */
export function isInsideAnyZone(
  point: [number, number],
  zones: Zone[]
): boolean {
  return zones.some((zone) => isPointInPolygon(point, zone.coordinates));
}

/**
 * Creates a location simulator that moves a person randomly at walking speed.
 * Returns start/stop controls and a callback-based update mechanism.
 */
export function createLocationSimulator(
  startPosition: [number, number],
  onUpdate: (location: PersonLocation) => void,
  getZones: () => Zone[]
) {
  let position: [number, number] = [...startPosition];
  let direction = Math.random() * Math.PI * 2;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function step() {
    // Slightly adjust direction for natural wandering (max ±15° per step)
    direction += (Math.random() - 0.5) * (Math.PI / 6);

    const dx = Math.cos(direction) * STEP_SIZE;
    const dy = Math.sin(direction) * STEP_SIZE;

    position = [position[0] + dx, position[1] + dy];

    const zones = getZones();
    const containingZone = findContainingZone(position, zones);

    onUpdate({
      longitude: position[0],
      latitude: position[1],
      insideZone: containingZone !== null,
      currentZoneName: containingZone?.name ?? null,
    });
  }

  function start() {
    if (intervalId) return;
    // Emit initial position
    step();
    intervalId = setInterval(step, UPDATE_INTERVAL);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop };
}
