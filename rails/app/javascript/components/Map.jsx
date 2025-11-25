import React, { Component } from "react";
import PropTypes from "prop-types";
import Minimap from "../vendor/mapgl-minimap.js";
import Popup from "./Popup";
import { mapStyleLayers } from '../global/protomaps';
import { createRoot } from "react-dom/client";

import 'mapbox-gl/dist/mapbox-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import center from '@turf/center'
import bboxPolygon from '@turf/bbox-polygon'

const STORY_POINTS_LAYER_ID = "ts-points-layer";
const STORY_POINTS_DATA_SOURCE = "ts-points-data";

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePopup: null,
      mapGL: null,
      mapModule: null,
    };
  }

  static propTypes = {
    activePoint: PropTypes.object,
    points: PropTypes.object,
    framedView: PropTypes.object,
    onMapPointClick: PropTypes.func,
    mapStyle: PropTypes.string,
    mapboxAccessToken: PropTypes.string,
    mapbox3d: PropTypes.bool,
    mapProjection: PropTypes.string,
    useLocalMapServer: PropTypes.bool,
    markerImgUrl: PropTypes.string,
    markerClusterImgUrl: PropTypes.string,
  };

  componentDidMount() {
    if (this.state.mapModule) {
      this.initializeMap(this.state.mapModule);
      return;
    }

    const loadModule = (importer) => importer().then((module) => module.default ?? module);

    if (this.props.useLocalMapServer) {
      loadModule(() => import('maplibre-gl')).then((mapModule) => {
        this.setState({ mapModule }, () => {
          this.initializeMap(this.state.mapModule);
        });
      });
    } else {
      loadModule(() => import('mapbox-gl')).then((mapModule) => {
        this.setState({ mapModule }, () => {
          this.initializeMap(this.state.mapModule);
        });
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.map) {
      return;
    }

    if (prevProps.points !== this.props.points) {
      this.updateMapPoints();
    }

    if (prevProps.activePoint && !this.props.activePoint) {
      this.closeActivePopup();
    }

    // Open active popup
    if (this.props.activePoint && prevProps.activePoint !== this.props.activePoint) {
      this.openPopup(this.props.activePoint);
    }

    // Set map framed view
    if (
      this.props.framedView &&
      this.props.framedView !== prevProps.framedView
    ) {
      const { bounds, ...frameOptions } = this.props.framedView;
      if (bounds) {
        const bboxPoly = bboxPolygon(bounds);
        const centerPoint = center(bboxPoly).geometry.coordinates;
        this.map.fitBounds(bounds, { center: centerPoint, padding: 50, duration: 2000.0, maxZoom: 12, ...frameOptions });
      } else {
        this.map.easeTo({ duration: 2000.0, ...frameOptions });
      }
    }
  }

  initializeMap(mapGL) {
    if (!this.props.useLocalMapServer) {
      mapGL.accessToken = this.props.mapboxAccessToken;
    }

    this.map = new mapGL.Map({
      container: this.mapContainer,
      style: mapStyleLayers(this.props.mapStyle, this.props.basemapStyle),
      center: [this.props.centerLong, this.props.centerLat],
      zoom: this.props.zoom,
      maxBounds: this.checkBounds(), // check for bounding box presence
      pitch: this.props.pitch,
      bearing: this.props.bearing,
      projection: this.props.mapProjection
    });

    this.map.on("load", async () => {
      try {
        const markerImage = await this.loadMapImage(this.props.markerImgUrl);
        if (!this.map.hasImage('ts-marker')) {
          this.map.addImage('ts-marker', markerImage);
        }

        const clusterImage = await this.loadMapImage(this.props.markerClusterImgUrl);
        if (!this.map.hasImage('ts-marker-cluster')) {
          this.map.addImage('ts-marker-cluster', clusterImage);
        }

        this.addMapPoints();
        this.addPlaceMarkerLayers();
      } catch (error) {
        console.error("Error loading marker images:", error);
      }

      // Add 3d terrain DEM layer if activated
      if(!this.props.useLocalMapServer && this.props.mapbox3d) {
        this.map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });

        // add the DEM source as a terrain layer
        this.map.setTerrain({ 'source': 'mapbox-dem' });

        // add a sky layer that will show when the map is highly pitched
        this.map.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
          }
        });
      }

      if(!this.props.useLocalMapServer && this.props.mapProjection == "globe") {
        this.map.setFog({
          'horizon-blend': 0.02,
          'star-intensity': 0.15,
          'color': '#ffffff',
          'high-color': '#008cff',
          'space-color': '#000000'
      });
      }

      this.addHomeButton();

      // Attaches popups + events
      this.addMarkerClickHandler();

      // Click handler for clusters, zoom in when clicked
      this.addClusterClickHandler();
    });

    // Add MiniMap
    this.map.addControl(new Minimap(
      mapGL,
      {
        center: [this.props.centerLong, this.props.centerLat],
        maxBounds: this.checkBounds(),
        style: mapStyleLayers(this.props.mapStyle, "light"),
        lineColor: "#136a7e",
        fillColor: "#d77a34",
      }), "top-right");

    this.map.addControl(new mapGL.NavigationControl());

    // Add Maplibre logo for offline Terrastories
    if(this.props.useLocalMapServer) {
      this.map.addControl(new mapGL.LogoControl(), 'bottom-right');
    }

    // Change mouse pointer when hovering over ts-marker points
    this.map.on('mouseenter', STORY_POINTS_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', STORY_POINTS_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = ''
    })

    // Change mouse pointer when hovering over ts-marker-cluster points
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = ''
    })

    this.setState({
      mapGL: mapGL
    });
  }

  addMapPoints() {
    this.map.addSource(STORY_POINTS_DATA_SOURCE, {
      type: "geojson",
      data: this.props.points,
      cluster: true, // turn clustering on
      clusterMaxZoom: 14, // max zoom on which to cluster points, default is 14
      clusterRadius: 50 // radius of each cluster when clustering points, default is 50
    });
  }

  addPlaceMarkerLayers() {
    // Add mapbox markers to the map
    this.map.addLayer({
      id: STORY_POINTS_LAYER_ID,
      source: STORY_POINTS_DATA_SOURCE,
      filter: ['!', ['has', 'point_count']], // single point, non-cluster
      type: "symbol",
      layout: {
        "icon-image": "ts-marker",
        "icon-padding": 0,
        "icon-allow-overlap": true,
        "icon-size": 0.75
      }
    });

    // Add clusters for overlapping markers
    this.map.addLayer({
      id: 'clusters',
      source: STORY_POINTS_DATA_SOURCE,
      filter: ['has', 'point_count'], // multiple points, cluster
      type: "symbol",
      layout: {
        "icon-image": "ts-marker-cluster",
        "icon-padding": 0,
        "icon-allow-overlap": true,
        "icon-size": [ // make cluster size reflect number of points within
            "interpolate",
            ["linear"],
            ['get', 'point_count'],
            // when number of points in cluster is 2, size will be 0.7 * single point
            2,
            0.7,
            // when number of points in cluster is 10 or more, size will be 0.8 * single point
            10,
            0.8
        ]
      }
    });

    // Add labels for number of points clustered for overlapping markers
    this.map.addLayer({
      id: 'clustercount',
      source: STORY_POINTS_DATA_SOURCE,
      filter: ['has', 'point_count'], // multiple points, cluster
      type: "symbol",
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': this.props.useLocalMapServer ? ['Noto Sans Medium'] : ['Open Sans Bold'],
        'text-size': 16,
        'text-offset': [0.2, 0.1]
        },
      paint: {
        'text-color': "#ffffff",
      }
    });
  }

  updateMapPoints() {
    if (this.map.getSource(STORY_POINTS_DATA_SOURCE)) {
      this.map.getSource(STORY_POINTS_DATA_SOURCE).setData(this.props.points);
    }
  }

  addMarkerClickHandler() {
    this.map.on("click", STORY_POINTS_LAYER_ID, e => {
      if (e.features.length) {
        // Select the feature clicked on
        const feature = e.features[0];
        this.openPopup(feature);
        this.props.onMapPointClick(feature);
      }
    });
  }

  addClusterClickHandler() {
    // Inspect a cluster (zoom in) on click
    this.map.on("click", "clusters", async e => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ["clusters"]
      });
      const clusterId = features[0].properties.cluster_id;
      try {
        const zoom = await this.getClusterExpansionZoom(clusterId);
        this.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      } catch (err) {
        console.error("Error expanding cluster zoom level:", err);
      }
    });
  }

  openPopup(feature) {
    // Only show one popup at a time, close the active
    this.closeActivePopup();
    // create popup node
    const popupNode = document.createElement("div");
    const popupRoot = createRoot(popupNode);
    popupRoot.render(
      <Popup
        feature={feature}
        onCloseClick={() => {
          this.props.clearFilteredStories();
          this.closeActivePopup();
        }}
      />
    );
    // set popup on map
    const popup = new this.state.mapGL.Popup({
      offset: 15,
      className: "ts-markerPopup",
      closeButton: false, // We add our own custom close button
      closeOnClick: false
    });
    popup.setLngLat(feature.geometry.coordinates)
    popup.setDOMContent(popupNode)
    popup.addTo(this.map);
    const unmountPopup = () => {
      Promise.resolve().then(() => {
        popupRoot.unmount();
      });
    };

    popup.on('close', unmountPopup);
    // Set active popup in state
    this.setState({
      activePopup: popup
    });
  }

  resetMapToCenter() {
    this.map.flyTo({
        center: [this.props.centerLong, this.props.centerLat],
        zoom: this.props.zoom,
        pitch: this.props.pitch,
        bearing: this.props.bearing,
        maxBounds: this.checkBounds(), // check for bounding box presence
    });
  }

  // TODO: update this to JSX
  createHomeButton() {
    const homeButton = document.createElement("button");
    homeButton.setAttribute("aria-label", "Map Home");
    homeButton.setAttribute("type", "button");
    homeButton.setAttribute("class", "home-icon");
    return homeButton;
  }

  addHomeButton() {
    const homeButton = this.createHomeButton();
    let navControl = document.querySelectorAll('button[class$="-ctrl-zoom-in"]')[0];
    if (navControl) {
      navControl.parentNode.insertBefore(homeButton, navControl);
    }
    homeButton.addEventListener("click", () => {
      this.resetMapToCenter();
    });
  }

  closeActivePopup() {
    if (this.state.activePopup) {
      this.state.activePopup.remove();
    }
  }

  loadMapImage(url) {
    if (!url) {
      return Promise.reject(new Error("Marker image URL is not defined"));
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load marker image: ${url}`));
      image.src = url;
    });
  }

  getClusterExpansionZoom(clusterId) {
    const source = this.map.getSource(STORY_POINTS_DATA_SOURCE);

    if (!source) {
      return Promise.reject(new Error("Cluster source is not available"));
    }

    try {
      const result = source.getClusterExpansionZoom(clusterId);
      if (result && typeof result.then === 'function') {
        return result;
      }
    } catch (error) {
      if (this.props.useLocalMapServer) {
        return Promise.reject(error);
      }
    }

    return new Promise((resolve, reject) => {
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) {
          reject(err);
        } else {
          resolve(zoom);
        }
      });
    });
  }

  render() {
    return <div ref={el => (this.mapContainer = el)} className="ts-MainMap" />;
  }

// test for bounding box presence
  checkBounds() {
    let mapBounds = null;
    if (this.props.sw_boundary_long != null && this.props.sw_boundary_lat != null
        && this.props.ne_boundary_long != null && this.props.ne_boundary_lat != null) {
        mapBounds = [
            [this.props.sw_boundary_long, this.props.sw_boundary_lat], //southwest
            [this.props.ne_boundary_long, this.props.ne_boundary_lat] //northeast
        ]
    }
    return mapBounds;
  }
}
