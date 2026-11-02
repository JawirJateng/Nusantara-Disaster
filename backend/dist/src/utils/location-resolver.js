"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCoordinates = resolveCoordinates;
const LOCATION_COORDINATES_MAP = {
    'cianjur': { latitude: -6.8160, longitude: 107.1420 },
    'kab. cianjur': { latitude: -6.8160, longitude: 107.1420 },
    'jawa barat': { latitude: -6.9175, longitude: 107.6191 },
    'merapi': { latitude: -7.5407, longitude: 110.4457 },
    'gunung merapi': { latitude: -7.5407, longitude: 110.4457 },
    'sleman': { latitude: -7.7314, longitude: 110.3542 },
    'di yogyakarta': { latitude: -7.7956, longitude: 110.3695 },
    'yogyakarta': { latitude: -7.7956, longitude: 110.3695 },
    'kampung melayu': { latitude: -6.2250, longitude: 106.8650 },
    'jakarta timur': { latitude: -6.2250, longitude: 106.8650 },
    'dki jakarta': { latitude: -6.2088, longitude: 106.8456 },
    'jakarta': { latitude: -6.2088, longitude: 106.8456 },
    'luwu utara': { latitude: -2.5650, longitude: 120.2150 },
    'sabbang': { latitude: -2.5650, longitude: 120.2150 },
    'sulawesi selatan': { latitude: -3.6669, longitude: 119.9740 },
    'pulang pisau': { latitude: -2.3361, longitude: 114.2415 },
    'kahayan hilir': { latitude: -2.3361, longitude: 114.2415 },
    'kalimantan tengah': { latitude: -1.6816, longitude: 113.3824 },
    'ogan komering ilir': { latitude: -3.3952, longitude: 104.8210 },
    'oki': { latitude: -3.3952, longitude: 104.8210 },
    'pampangan': { latitude: -3.3952, longitude: 104.8210 },
    'sumatera selatan': { latitude: -3.3194, longitude: 103.9144 },
    'aceh': { latitude: 4.6951, longitude: 96.7494 },
    'aceh besar': { latitude: 5.4950, longitude: 95.5317 },
    'sabang': { latitude: 5.8910, longitude: 95.3237 },
};
function resolveCoordinates(locationName, regency, province) {
    const queryText = `${locationName || ''} ${regency || ''} ${province || ''}`.toLowerCase();
    for (const [key, coords] of Object.entries(LOCATION_COORDINATES_MAP)) {
        if (queryText.includes(key)) {
            return coords;
        }
    }
    return { latitude: -2.5489, longitude: 118.0150 };
}
//# sourceMappingURL=location-resolver.js.map