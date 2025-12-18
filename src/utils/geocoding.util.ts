/**
 * Geocoding utility to fetch coordinates from location
 * Uses geocode.maps.co API for geocoding
 */

export interface Coordinates {
  lat: number | string;
  lon: number | string;
  display_name?: string;
}

export const fetchCorrd = async (location: string): Promise<Coordinates> => {
  try {
    const encodedLocation = encodeURIComponent(location);
    const response = await fetch(
      `https://geocode.maps.co/search?q=${encodedLocation}&api_key=68e6b8752ee28119460354lad7a76ff`
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("No coordinates found for the given location");
    }

    // Find the most relevant result (prefer results with higher importance)
    const bestResult = data.reduce((best: any, current: any) => {
      return current.importance > best.importance ? current : best;
    });

    return {
      lat: bestResult.lat,
      lon: bestResult.lon,
      display_name: bestResult.display_name,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return {
      lat: "35.67445",
      lon: "-6.8143,5",
      display_name: "Proactive Future Technologies",
    };
  }
};

