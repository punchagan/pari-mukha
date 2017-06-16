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
    show_faces();
};

var setup_map = function(map_){
    map_.setView(india_coords, zoom_level);
    L.tileLayer(tile_url, {
        maxZoom: max_zoom,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            map_attribution + ', ' +
            pari_attribution,
        id: 'light.grey.world'
    }).addTo(map_);
    map_.on('zoom', zoom_changed);
};

var fetch_photo_data = function(display_callback){
    console.log("Fetching face data...");
    var url = 'data/faces.json';
    fetch(url, {})
        .then(function(response){
            if (response.status == 200) {
                return response.json();
            } else {
                // FIXME: Let the user know, there was an error?
                console.log("Couldn't fetch faces");
                return [];
            }
        })
        .then(function(parsed_data){
            console.log("No. of faces fetched: " + parsed_data.length);
            photos = parsed_data;
            display_callback();
        });
};

var add_face = function(face, i){
    var map_ = this;
    var imageUrl = face.photo,
        imageBounds = [[face.location.lat, face.location.lng], [face.location.lat+1, face.location.lng+1]];
    L.imageOverlay(imageUrl, imageBounds, {class: 'face.layer'}).addTo(map_);
};

var filter_display_images = function(photos, zoom, bounds){
    console.log(zoom, bounds);
    var start = Math.floor(Math.random() * photos.length),
        end = start + 15;
    console.log(start, end);
    return photos.slice(start, end);
};

var show_faces = function(){
    // FIXME: Uses globals to do the magic!
    pari_map.eachLayer(remove_image_layer, pari_map);
    var zoom = pari_map.getZoom(),
        bounds = pari_map.getBounds(),
        display_photos = filter_display_images(photos, zoom, bounds);
    display_photos.map(add_face, pari_map);
};

var remove_image_layer = function(map_layer){
    if (map_layer.options.class === 'face.layer') {
        this.removeLayer(map_layer);
    }
};

setup_map(pari_map);
fetch_photo_data(show_faces);
