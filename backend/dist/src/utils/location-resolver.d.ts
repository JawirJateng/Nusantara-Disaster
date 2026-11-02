export interface LatLng {
    latitude: number;
    longitude: number;
}
export declare function resolveCoordinates(locationName?: string, regency?: string, province?: string): LatLng;
