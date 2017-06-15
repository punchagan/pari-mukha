var india_coords = [22, 81],
    zoom_level = 5,
    max_zoom = 16,
    tile_url = "//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    pari_attribution = "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>",
    map_attribution = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    india_bounds = [[37, 67] [0, 98]];


var map = L.map('map-container').setView(india_coords, zoom_level);
L.tileLayer(tile_url, {
    maxZoom: max_zoom,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        map_attribution + ', ' +
        pari_attribution,
    id: 'mapbox.streets'
}).addTo(map);

var zoom_changed = function(payload){
    console.log(payload.target.getZoom());
};

map.on('zoom', zoom_changed);
