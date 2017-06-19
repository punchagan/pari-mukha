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

var image_bounds = function(face, size){
    var imageBounds = [[face.location.lat-size/2, face.location.lng-size/2],
                       [face.location.lat+size/2, face.location.lng+size/2]];

    return new L.latLngBounds(imageBounds);
};

var add_face = function(map_, face, size){
    var imageUrl = face.photo,
        imageBounds = image_bounds(face, size);
    L.imageOverlay(imageUrl, imageBounds, {class: 'face.layer', face: face}).addTo(map_);
};

var filter_display_images = function(photos, displayed, bounds, photo_size){
    var MAX_DISPLAYED_IMAGES = 15,  // FIXME: Config var here
        in_bounds_photos = photos.filter(function(photo){return bounds.contains(photo.location);}),
        already_displayed = in_bounds_photos.filter(function(photo){return displayed.has(photo);}),
        not_displayed = in_bounds_photos.filter(function(photo){return !displayed.has(photo);});

    already_displayed = new Set(already_displayed);

    if (already_displayed.size + not_displayed.length <= MAX_DISPLAYED_IMAGES){
        // FIXME: Add non-overlapping magic, here. May be we need to add some
        // fuzz on the bounds of an image, etc.
        not_displayed.forEach(function(photo){already_displayed.add(photo);});
    } else {
        already_displayed = find_non_overlapping_images(already_displayed, not_displayed, MAX_DISPLAYED_IMAGES, photo_size);
    }
    // FIXME: Setting global displayed_photos
    displayed_photos = already_displayed;
    return Array.from(already_displayed);
};

var find_non_overlapping_images = function(displayed, to_be_displayed, count, photo_size) {
    var select_photo = function(previous, photo){
        var overlap = false,
            bounds = image_bounds(photo, photo_size);

        for (var [_, displayed_photo] of previous.entries()) {
            var displayed_bounds = image_bounds(displayed_photo, photo_size);
            overlap = displayed_bounds.overlaps(bounds);
            if (overlap){
                break;
            }
        }
        return !overlap;
    };

    var non_overlapping = new Set(),
        displayed_ = Array.from(displayed),
        photo, i;

    // When zoom level changes, already displayed images also can start
    // overlapping. Check and remove overlapping images. Prioritize already
    // displayed images, over new images.
    for (i in displayed_) {
        if (non_overlapping.size >= count) { break; }
        photo = displayed_[i];
        if (select_photo(non_overlapping, photo)){
            non_overlapping.add(photo);
        }
    }

    for (i in to_be_displayed) {
        if (non_overlapping.size >= count) { break; }
        photo = to_be_displayed[i];
        if (select_photo(non_overlapping, photo)){
            non_overlapping.add(photo);
        }
    }
    return non_overlapping;
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
        face_size = compute_face_size(pari_map),
        display_photos = filter_display_images(photos, displayed_photos, bounds, face_size);

    display_photos.map(function(face){add_face(pari_map, face, face_size);});
};

var remove_image_layer = function(map_layer){
    if (map_layer.options.class === 'face.layer') {
        this.removeLayer(map_layer);
    }
};

setup_map(pari_map);
fetch_photo_data(show_faces);
