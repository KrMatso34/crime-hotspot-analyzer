/**
 * Consolidates coordinates by quantizing them into a grid and averaging the results.
 * * @param {Array} coords - Array of {lat, lon} objects.
 * @param {Object} bounds - {minLat, maxLat, minLon, maxLon}
 * @param {Number} divisions - Number of tiles in each direction (e.g., 10 for a 10x10 grid).
 * @returns {Array} - Averaged coordinates.
 */
export function clusterByGrid(coords, bounds, divisions) {
    const { minLat, maxLat, minLon, maxLon } = bounds;

    // Calculate the size of a single tile
    const latStep = (maxLat - minLat) / divisions;
    const lonStep = (maxLon - minLon) / divisions;


    // Use a Map to store { sumLat, sumLon, count } for each tile index
    const grid = new Map();

    for (const point of coords) {
        // Find which tile index the point falls into (0 to divisions-1)
        // We use Math.min to ensure points exactly on the max bound don't overflow
        let x = Math.floor((point[1] - minLon) / lonStep);
        let y = Math.floor((point[0] - minLat) / latStep);

        // Clamp indices to stay within grid bounds
        x = Math.max(0, Math.min(divisions - 1, x));
        y = Math.max(0, Math.min(divisions - 1, y));

        const key = `${x},${y}`;

        if (!grid.has(key)) {
            grid.set(key, { sumLat: 0, sumLon: 0, count: 0 });
        }

        const tile = grid.get(key);
        tile.sumLat += point[0];
        tile.sumLon += point[1];
        tile.count += 1;
    }

    // Convert aggregated sums into averaged coordinates
    const results = [];
    grid.forEach((value) => {
        results.push({
            lat: value.sumLat / value.count,
            lon: value.sumLon / value.count,
            count: value.count // Optional: keep track of how many points were here
        });
    });

    return results;
}