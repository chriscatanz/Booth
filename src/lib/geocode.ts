/**
 * Geocode a venue name (+ optional city/state context) using Nominatim (OpenStreetMap).
 * Free, no API key required. Returns a formatted address string or null.
 */
export async function geocodeVenue(name: string, context?: string | null): Promise<string | null> {
  const query = context ? `${name}, ${context}` : name;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Booth-App/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    const addr = data[0].address;
    if (!addr) return data[0].display_name || null;

    // Build a clean US-style address: "123 Main St, City, ST 12345"
    const parts: string[] = [];
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    if (street) parts.push(street);
    const city = addr.city || addr.town || addr.village || addr.county;
    if (city) parts.push(city);
    if (addr.state) parts.push(addr.state);
    if (addr.postcode) parts.push(addr.postcode);

    return parts.length > 1 ? parts.join(', ') : (data[0].display_name || null);
  } catch {
    return null;
  }
}
