/**
 * Geocode a venue or hotel name using a multi-strategy approach:
 *   1. Nominatim free-text search (works well for unique venues/convention centers)
 *   2. Photon (OSM, better POI/hotel data) with city-coordinate bias as fallback
 *
 * Free, no API key required.
 */

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface PhotonProperties {
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  state?: string;
  postcode?: string;
}

const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'Booth-App/1.0',
};

function formatNominatimAddress(result: NominatimResult): string | null {
  const addr = result.address;
  if (!addr) return result.display_name || null;
  const parts: string[] = [];
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
  if (street) parts.push(street);
  const city = addr.city || addr.town || addr.village || addr.county;
  if (city) parts.push(city);
  if (addr.state) parts.push(addr.state);
  if (addr.postcode) parts.push(addr.postcode);
  return parts.length > 1 ? parts.join(', ') : (result.display_name || null);
}

function formatPhotonAddress(p: PhotonProperties): string | null {
  const parts: string[] = [];
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  if (street) parts.push(street);
  const city = p.city || p.town;
  if (city) parts.push(city);
  if (p.state) parts.push(p.state);
  if (p.postcode) parts.push(p.postcode);
  return parts.length > 1 ? parts.join(', ') : null;
}

async function nominatimSearch(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json();
    if (!data?.length) return null;
    return formatNominatimAddress(data[0]);
  } catch {
    return null;
  }
}

async function getCityCoords(city: string): Promise<{ lat: string; lon: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json();
    if (!data?.length) return null;
    return { lat: data[0].lat, lon: data[0].lon };
  } catch {
    return null;
  }
}

async function photonSearch(name: string, lat: string, lon: string): Promise<string | null> {
  try {
    // Use a ~15-mile bounding box around the city to keep results local
    const delta = 0.2;
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    const bbox = `${lonN - delta},${latN - delta},${lonN + delta},${latN + delta}`;
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(name)}&limit=1&lang=en&lat=${lat}&lon=${lon}&bbox=${bbox}`,
      { headers: { 'User-Agent': 'Booth-App/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const features = data?.features;
    if (!features?.length) return null;
    return formatPhotonAddress(features[0].properties as PhotonProperties);
  } catch {
    return null;
  }
}

/**
 * Geocode a venue/hotel name with optional city/state context.
 * Returns a formatted address string or null if not found.
 */
export async function geocodeVenue(name: string, context?: string | null): Promise<string | null> {
  // Clean name: strip city suffix if name contains a comma (e.g. "Marriott Downtown, Chicago, IL" → "Marriott Downtown")
  const cleanName = name.includes(',') ? name.split(',')[0].trim() : name;

  // City string for location bias: prefer context, fall back to stripped suffix
  const cityString = context?.trim() ||
    (name.includes(',') ? name.split(',').slice(1).join(',').trim() : null);

  // --- Strategy 1: Nominatim full-text (best for unique named venues without city suffix) ---
  // Skip if name contains a comma — Nominatim often returns wrong results for "Brand, City" names
  if (!name.includes(',')) {
    const fullQuery = context ? `${name}, ${context}` : name;
    const result1 = await nominatimSearch(fullQuery);
    if (result1) return result1;
  }

  // --- Strategy 2: Photon with bounding-box bias (best for hotels/chain POIs) ---
  if (cleanName && cityString) {
    const coords = await getCityCoords(cityString);
    if (coords) {
      const result2 = await photonSearch(cleanName, coords.lat, coords.lon);
      if (result2) return result2;
    }
  }

  // --- Strategy 3: Nominatim fallback with clean name (last resort) ---
  const fallbackQuery = cityString ? `${cleanName}, ${cityString}` : cleanName;
  const result3 = await nominatimSearch(fallbackQuery);
  if (result3) return result3;

  return null;
}
