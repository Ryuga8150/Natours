console.log('Hello from client side');
// Now we want location data of the tour that
// we are currently trying to display
// we might think of an ajax request to our api
// but that's not necessary here

// here's the trick
//in tour.pug we have data about tour itself
//so we can expose that data into our html
//and then pick data from our html

//there's a error here see in console

const locations = JSON.parse(document.getElementById('map').dataset.locations);
//console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1Ijoicnl1Z2E4MTUwIiwiYSI6ImNsbWs5cTUwdjAwZXcybHRidjY0Z21ueHIifQ.g5G1-jOQJHQMUPUFcz4d0w';

// we reuired an id map as mapbox required it

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ryuga8150/clmk9zhev01qb01qu7kks6bs2',
  scrollZoom: false,
  // long lat
  // center: [-118.11349134, 34.111745],
  // zoom: 10,
  // interactive: false,
});

// coming from script of gl
const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create a marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    // anchor shows that the images bottom part should point
    // to the location
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: { top: 200, bottom: 150, left: 100, right: 100 },
});
