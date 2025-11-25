import layers from "protomaps-themes-base"
import bbox from "@turf/bbox"

const FALLBACK_STYLE_URL = "https://demotiles.maplibre.org/style.json"

export function mapStyleLayers(mapStyle, theme = "contrast") {
  if (mapStyle && typeof mapStyle === "object") return mapStyle

  const styleUrl = typeof mapStyle === "string" && mapStyle.trim().length > 0 ? mapStyle : FALLBACK_STYLE_URL

  if (styleUrl === FALLBACK_STYLE_URL && (!mapStyle || mapStyle === "")) {
    if (process.env.NODE_ENV !== "production") {
      /* eslint-disable-next-line no-console */
      console.warn("Map style URL is not configured; falling back to the MapLibre demo style. Configure MAPBOX_STYLE, PROTOMAPS_API_KEY, or TILESERVER_URL for custom maps.")
    }
  }

  // For custom map styles from Mapbox, Tileserver, or PMtiles that
  // aren't supplied from Protomaps directly, return as-is.
  if (!styleUrl.includes("api.protomaps.com")) return styleUrl

  // Protomaps Free API
  const style = {
    version: 8,
    sources: {},
    layers: []
  }

  style.sources = {
    protomaps: {
      type: "vector",
      attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      url: styleUrl
    }
  }

  style.layers = layers("protomaps", theme)
  style.glyphs = "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf"

  return style
}

// Export mapgl for use in Rails JS. This
// allows us to add features to the map such
// as markers, popups, and navigation controls.
export async function mapgl(useMaplibre) {
  let lib
  const loadModule = async (importer) => {
    const module = await importer();
    return "Map" in module ? module : (module.default ?? module);
  };

  if (useMaplibre) {
    lib = await loadModule(() => import('maplibre-gl'));
  } else {
    lib = await loadModule(() => import('mapbox-gl'));
  }
  return lib
}

// Instantiates a minimal Map from *-gl library
//
// Purposefully flexible since interactive maps
// in Rails have extremely varying interactions.
export function interactiveMap(lib, config) {
  const map = new lib.Map({
    ...config,
    style: mapStyleLayers(config.style, config.basemapStyle),
  })
  return map
}

// Instantiates a zoomable Map from *-gl library
// with point "markers" from a feature or feature collection source
// These maps do NOT require additional gl manipulation,
// and so it loads mapgl rather than relying on it being provided.
export async function staticMap(useMaplibre, config, pointFeatures) {
  const maplib = await mapgl(useMaplibre)
  const isFeatureCollection = pointFeatures && pointFeatures.type === "FeatureCollection"

  const map = new maplib.Map({
    ...config,
    style: mapStyleLayers(config.style, config.basemapStyle),
    bounds: isFeatureCollection ? bbox(pointFeatures) : undefined,
    fitBoundsOptions: {
      padding: isFeatureCollection ? 50 : undefined,
      maxZoom: config.zoom || 8,
    },
    scrollZoom: config.allowDrag || false,
    dragPan: config.allowDrag || false,
    dragRotate: false,
    pitchWithRotation: false,
    boxZoom: false,
    touchPitch: false,
    touchZoomRotate: false,
  })

  map.addControl(new maplib.NavigationControl({showCompass: false}))

  map.on("load", () => {
    if (pointFeatures) {
      map.addSource("points", {
        "type": "geojson",
        "data": pointFeatures
      })

      map.addLayer({
        type: "circle",
        id: "circle-point",
        source: "points",
        paint: {
            "circle-color": "#09697e",
            "circle-radius": 12
        }
      })

      map.addLayer({
        type: "symbol",
        id: "points",
        source: "points",
        layout: {
          "icon-text-fit": "height",
          "icon-text-fit-padding": [1,2,1,2],
          "text-field": "{marker-symbol}",
          "text-transform": "uppercase",
          "text-font": useMaplibre ? ["Noto Sans Medium"] : ["Open Sans Bold"]
        },
        paint: {
          "text-color": "#FFFFFF"
        }
      })
    }
  })
}
