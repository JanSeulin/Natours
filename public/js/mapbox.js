import mapboxgl from 'mapbox-gl';

// Get the locations from the HTML dataset and convert back to JSON
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiamFuc2V1bGluIiwiYSI6ImNsZWcyaGl1ZzAzMWEzd2p5eGdxcTg0ZzMifQ.wxChRV05YCIgYwIqlVKjjg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/janseulin/cleg2xl4a002b01o8l890cdiw',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 8,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extends map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
