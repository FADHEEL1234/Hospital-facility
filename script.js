// =====================
// 1. MAP INITIALIZATION
// =====================
var map = L.map('map').setView([-6.165, 39.202], 11);

// Base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// =====================
// 2. COLOR FUNCTION (DATA-DRIVEN)
// =====================
function getColor(type) {
    if (type === 'hospital') return 'red';
    if (type === 'clinic') return 'blue';
    if (type === 'pharmacy') return 'green';
    return 'black';
}

// =====================
// 3. LAYER STORAGE
// =====================
var overlayLayers = {};
var hospitalLayer;

// =====================
// 4. LOAD GEOJSON FILES
// =====================
function loadGeoJSON(file, type) {
    fetch(`GeoJson/${file}`)
        .then(res => res.json())
        .then(data => {

            let layer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: getColor(type),
                        color: "#000",
                        weight: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: function (feature, layer) {
                    let name = feature.properties?.name || "Unknown";
                    layer.bindPopup(`<b>${name}</b><br>${type}`);
                }
            });

            overlayLayers[type] = layer;
            layer.addTo(map);

            if (type === 'hospital') hospitalLayer = layer;

            L.control.layers(null, overlayLayers, { collapsed: false }).addTo(map);

            map.fitBounds(layer.getBounds());
        })
        .catch(err => console.error("Error loading", file, err));
}

// =====================
// 5. LOAD DATA (NO SPACES IN FILENAMES)
// =====================
loadGeoJSON('amenity hospital.geojson', 'hospital');
loadGeoJSON('amenity clinic.geojson', 'clinic');
loadGeoJSON('amenity pharmacy.geojson', 'pharmacy');
loadGeoJSON('highway_primary_unguja_lines.geojson', 'highway_primary_unguja_lines');
//loadGeoJSON('highway_primary_unguja_points.geojson', 'highway_primary_unguja_points');

// =====================
// 6. LEGEND
// =====================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<b>Legend</b><br>";
    div.innerHTML += '<i style="background:red"></i> Hospital<br>';
    div.innerHTML += '<i style="background:blue"></i> Clinic<br>';
    div.innerHTML += '<i style="background:green"></i> Pharmacy<br>';
    return div;
};

legend.addTo(map);

// =====================
// 7. SCALE BAR
// =====================
L.control.scale({ metric: true, imperial: false }).addTo(map);

// =====================
// 8. SEARCH HOSPITAL BY NAME
// =====================
var searchControl = L.control({ position: 'topleft' });

searchControl.onAdd = function () {
    var div = L.DomUtil.create('div', 'search-box');
    div.innerHTML = '<input type="text" id="search" placeholder="Search hospital">';
    return div;
};

searchControl.addTo(map);

document.addEventListener("keyup", function () {
    if (!hospitalLayer) return;

    let value = document.getElementById("search").value.toLowerCase();

    hospitalLayer.eachLayer(function (layer) {
        let name = layer.feature.properties.name?.toLowerCase() || "";
        layer.setStyle({ radius: name.includes(value) ? 10 : 6 });
        if (name.includes(value)) layer.openPopup();
    });
});
