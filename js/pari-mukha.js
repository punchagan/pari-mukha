var india_coords = [22, 81],
    zoom_level = 5,
    max_zoom = 16,
    tile_url = "//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    pari_attribution = "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>",
    map_attribution = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    india_bounds = [[37, 67] [0, 98]],
    pari_map = L.map('map-container'),
    photos = [];

var zoom_changed = function(payload){
    console.log(payload.target.getZoom());
    if (photos.length == 0) {
        console.log("Photos not fetched, still");
    }
};

var setup_map = function(map_){
    map_.setView(india_coords, zoom_level);
    L.tileLayer(tile_url, {
        maxZoom: max_zoom,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            map_attribution + ', ' +
            pari_attribution,
        id: 'mapbox.streets'
    }).addTo(map_);
    map_.on('zoom', zoom_changed);
};

var fetch_photo_data = function(map_){
    console.log("Fetching face data...");
    var url = 'data/faces.json';
    fetch(url, {})
        .then(function(response){
            if (response.status == 200) {
                return response.json();
            } else {
                console.log("Couldn't fetch faces");
                return [];
            }
        })
        .then(function(parsed_data){
            console.log("No. of faces fetched: " + parsed_data.length);
            photos = parsed_data;
            parsed_data.map(add_face, map_);
        });
};

var add_face = function(face, i){
    var map_ = this;
    var imageUrl = face.photo,
        imageBounds = [[face.location.lat, face.location.lng], [face.location.lat+1, face.location.lng+1]];
    L.imageOverlay(imageUrl, imageBounds).addTo(map_);
};

setup_map(pari_map);
fetch_photo_data(pari_map);
