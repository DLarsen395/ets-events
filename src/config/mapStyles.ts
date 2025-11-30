// Free basemap styles - no API key required
export const MAP_STYLES = {
  // Carto free basemaps
  cartoVoyager: {
    name: 'Carto Voyager',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  cartoDark: {
    name: 'Carto Dark Matter',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  cartoLight: {
    name: 'Carto Positron',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  // Stadia Maps free tier basemaps
  stadiaOsmBright: {
    name: 'OSM Bright',
    url: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
  },
  stadiaOutdoors: {
    name: 'Stadia Outdoors',
    url: 'https://tiles.stadiamaps.com/styles/outdoors.json',
  },
  stadiaAlidadeSmooth: {
    name: 'Alidade Smooth',
    url: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
  },
  stadiaAlidadeDark: {
    name: 'Alidade Smooth Dark',
    url: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
  },
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;
// Default to Carto Voyager - works without domain registration
// Stadia maps require domain registration at https://client.stadiamaps.com/
export const DEFAULT_STYLE: MapStyleKey = 'cartoVoyager';
