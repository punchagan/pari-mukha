// Configuration
var india_coords = [22, 81],
    india_bounds = [[37, 67], [6, 98]],

    photo_size = 100,
    zoom_level = 5,
    max_zoom = 13,
    min_zoom = 5,
    tile_url = "//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    pari_attribution = "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>",
    map_attribution = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",

    map_container = 'map-container';

// App global state
var pari_map = L.map(map_container),
    photos = [],
    displayed_photos = new Set();

var setup_map = function(map_){
    map_.setView(india_coords, zoom_level);
    L.tileLayer(tile_url, {
        maxZoom: max_zoom,
        minZoom: min_zoom,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            map_attribution + ', ' +
            pari_attribution,
        id: 'light.grey.world'
    }).addTo(map_);
    map_.on('moveend', show_faces);
    map_.setMaxBounds(india_bounds);
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

var add_face = function(map_, face, size){
    var imageUrl = face.photo,
        imageBounds = [[face.location.lat, face.location.lng],
                       [face.location.lat+size, face.location.lng+size]];
    L.imageOverlay(imageUrl, imageBounds, {class: 'face.layer', face: face}).addTo(map_);
};

var filter_display_images = function(photos, displayed, zoom, bounds){
    var MAX_DISPLAYED_IMAGES = 15,  // FIXME: Config var here
        in_bounds_photos = photos.filter(function(photo){return bounds.contains(photo.location);}),
        already_displayed = in_bounds_photos.filter(function(photo){return displayed.has(photo);}),
        not_displayed = in_bounds_photos.filter(function(photo){return !displayed.has(photo);});

    already_displayed = new Set(already_displayed);

    if (already_displayed.size + not_displayed.length <= MAX_DISPLAYED_IMAGES){
        not_displayed.forEach(function(photo){already_displayed.add(photo);});
    } else {
        var required_count = MAX_DISPLAYED_IMAGES - already_displayed.size,
            start = Math.floor(Math.random() * not_displayed.length),
            end = start + required_count;
        if (end > not_displayed.length) {
            end = not_displayed.length;
            start = end - required_count;
        }
        not_displayed.slice(start, end).forEach(function(photo){already_displayed.add(photo);});
    }
    // FIXME: Setting global displayed_photos
    displayed_photos = already_displayed;
    return Array.from(already_displayed);
};

var compute_face_size = function(map_){
    var map_size = map_.getSize(),
        width = map_size.x,
        height = map_size.y,
        bounds = map_.getBounds(),
        east_west = bounds.getEast() - bounds.getWest(),
        north_south = bounds.getNorth() - bounds.getSouth(),
        east_west_size = (east_west * photo_size)/width,
        north_south_size = (north_south * photo_size/height),
        size = Math.min(east_west_size, north_south_size);
    return size;
};

var show_faces = function(){
    // FIXME: Uses globals to do the magic!
    pari_map.eachLayer(remove_image_layer, pari_map);
    var zoom = pari_map.getZoom(),
        bounds = pari_map.getBounds(),
        display_photos = filter_display_images(photos, displayed_photos, zoom, bounds),
        face_size = compute_face_size(pari_map);

    display_photos.map(function(face){add_face(pari_map, face, face_size);});
};

var remove_image_layer = function(map_layer){
    if (map_layer.options.class === 'face.layer') {
        this.removeLayer(map_layer);
    }
};

setup_map(pari_map);
fetch_photo_data(show_faces);
