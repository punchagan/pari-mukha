// Configuration
var india_coords = [22, 81],
    india_bounds = [[37, 67], [6, 98]],

    map_size = 800, // FIXME: Duplicated in style.css
    photo_size = 75,
    max_photos = 25,

    zoom_level = 5,
    max_zoom = 12,
    min_zoom = 5,
    tile_url = "//server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
    pari_attribution = "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>",
    map_attribution = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',

    map_container = 'pari-map';

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
    map_.on('moveend', show_faces)
        .on('zoomstart', close_popup)
        .setMaxBounds(india_bounds);
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
            photos = parsed_data.filter(function(photo){return photo.location;});
            console.log("No. of faces with location info: " + photos.length);
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
        imageBounds = face.display_bounds?face.display_bounds:image_bounds(face, size);
    L.imageOverlay(imageUrl, imageBounds,
                   {class: 'face.layer', interactive: true, face: face, alt: face.name})
        .addTo(map_)
        .on('click', show_image_info_popup);
    face.display_bounds = undefined;
};

var show_image_info_popup = function(){
    var face = this.options.face,
        latLng = [face.location.lat, face.location.lng];
    // FIXME: Global map
    this.bringToFront();
    pari_map.openPopup(get_popup_content(face), latLng);
};

var get_popup_content = function(face){
    var name_template = '<a target="_blank" href="{url}">{name}</a><br />',
        occupation_template = face.occupation?'{occupation}<br /><br />':'<br />',
        location_template = face.village?
        '{village}, {district}, {state}<br />':
        '{district}, {state}<br />';

    var template = '<p>' +
        name_template + occupation_template + location_template +
        '</p>';
    return L.Util.template(template, face);
};

var close_popup = function(){
    this.closePopup();
};

var filter_display_images = function(photos, displayed, bounds, photo_size){
    var in_bounds_photos = photos.filter(function(photo){return bounds.contains(photo.location);}),
        already_displayed = in_bounds_photos.filter(function(photo){return displayed.has(photo);}),
        not_displayed = in_bounds_photos.filter(function(photo){return !displayed.has(photo);}),
        to_be_displayed;

    already_displayed = new Set(already_displayed);

    if (already_displayed.size + not_displayed.length <= max_photos){
        // FIXME: Add non-overlapping magic, here. May be we need to add some
        // fuzz on the bounds of an image, etc.
        not_displayed.forEach(function(photo){already_displayed.add(photo);});
        to_be_displayed = force_directed_layout(already_displayed, photo_size);
    } else {
        to_be_displayed = find_non_overlapping_images(already_displayed, not_displayed, max_photos, photo_size);
        show_undisplayed_markers(photos, to_be_displayed, bounds, photo_size/2);
    }
    // FIXME: Setting global displayed_photos
    displayed_photos = to_be_displayed;
    return Array.from(to_be_displayed);
};

var show_undisplayed_markers = function(photos, displayed, bounds, grid_size){
    var undisplayed = photos.filter(function(photo){return !displayed.has(photo);}),
        grid_counts = compute_grid_counts(bounds, undisplayed, grid_size);
    grid_counts.map(show_grid_marker);
};

var show_grid_marker = function(grid){
    var html = "<span>" + grid.count + "</span>",
        icon = L.divIcon({html: html}),
        text = grid.count + ' undisplayed faces';
    L.marker(grid.location,
             {icon: icon,
              title: text,
              alt: text,
              opacity: 0.6,
              pane: 'tilePane',
              class: 'marker.layer'
             })
        .addTo(pari_map);
};

var compute_grid_counts = function(bounds, photos, grid_size){
    var s = bounds.getSouth(),
        w = bounds.getWest(),
        counts = {},
        grid_counts = [];

    photos.forEach(function(photo){
        var x = photo.location.lat,
            y = photo.location.lng,
            u = Math.floor((x-s)/grid_size),
            v = Math.floor((y-w)/grid_size),
            key = [u, v],
            old_value = counts[key];
        counts[key] = old_value === undefined?1:(old_value+1);
    });

    for (var key in counts){
        var value = counts[key],
            location = key.split(","),
            x = s + grid_size * (parseInt(location[0]) + 0.5),
            y = w + grid_size * (parseInt(location[1]) + 0.5);
        grid_counts.push({count: value, location: [x, y]});
    }

    return grid_counts;
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
    pari_map.eachLayer(remove_old_layers, pari_map);
    var zoom = pari_map.getZoom(),
        // -ve pad the map bounds to filter only fully visible images
        bounds = pari_map.getBounds().pad(-(photo_size/2)/map_size),
        face_size = compute_face_size(pari_map),
        display_photos = filter_display_images(photos, displayed_photos, bounds, face_size);

    display_photos.map(function(face){add_face(pari_map, face, face_size);});
};

var remove_old_layers = function(map_layer){
    if (map_layer.options.class === 'face.layer' || map_layer.options.class === 'marker.layer') {
        this.removeLayer(map_layer);
    }
};

/* Force directed layout

   Images that overlap have a repulsive force pushing them away, and images away
   from their anchor (original location) are pulled towards the anchor point.

   Net force on an image gives the direction to move the image in, every move.
   Perform some number of moves and hope that we have reached some kind of
   equilibrium.

   */

var bounds_overlap = function(bounds1, bounds2) {
    if (!bounds1.overlaps(bounds2)) {
        return 0;
    } else {
        var north = Math.min(bounds1.getNorth(), bounds2.getNorth()),
            south = Math.max(bounds1.getSouth(), bounds2.getSouth()),
            east = Math.min(bounds1.getEast(), bounds2.getEast()),
            west = Math.max(bounds1.getWest(), bounds2.getWest());
        return Math.abs((north - south) * (east - west));
    }
};

var image_moved_distance = function(anchor, center) {
    return L.point(anchor.lng, anchor.lat).distanceTo(L.point(center.lng, center.lat));
};

var force_directed_layout = function(photos, photo_size){
    console.log("Finding force directed layout for " + photos.size + " photos");
    var photos_ = Array.from(photos),
        N = 100, // Number of runs
        anchors = photos_.map(function (x){return L.latLng (x.location);}),
        bboxes = photos_.map(function(x){return image_bounds(x, photo_size);}),
        result;

    for (var i=0; i < N; i++){
        result = force_moves(anchors, bboxes, photo_size);
        anchors = result.anchors;
        bboxes = result.bboxes;
    }
    bboxes.forEach(function(bbox, i){photos_[i].display_bounds=L.latLngBounds(bbox);});
    return new Set(photos_);
};

var force_moves = function(anchors, bboxes, size){
    var n = bboxes.length,
        forces = bboxes.map(function(bbox, i){
            var other_bboxes = bboxes.slice(0, i).concat(bboxes.slice(i+1, n));
            return compute_force(bbox, anchors[i], other_bboxes, size);
        }),
        bboxes_ = forces.map(function(force, i){
            var move = [force[1]*size, force[0]*size],
                bbox = bboxes[i],
                anchor = anchors[i],
                ne = bbox.getNorthEast(),
                sw = bbox.getSouthWest(),
                new_ne = [ne.lat+move[0], ne.lng+move[1]],
                new_sw = [sw.lat+move[0], sw.lng+move[1]];

            return L.latLngBounds([new_ne, new_sw]);
        });
    return {anchors: anchors, bboxes: bboxes_};
};

var compute_force = function(bbox, anchor, other_bboxes, size){
    var anchor_force = displacement_force(bbox, anchor, size),
        overlap_forces = other_bboxes.map(function(o_bbox){return overlap_force(bbox, o_bbox, size);}),
        sum_forces = function(x, y){return [x[0]+y[0], x[1]+y[1]];},
        overlap_f = overlap_forces.reduce(sum_forces, [0, 0]);
    return [anchor_force, overlap_f].reduce(sum_forces, [0, 0]);
};

var overlap_force = function(bbox1, bbox2, size){
    var quantum = bounds_overlap(bbox1, bbox2);
    if (quantum == 0){
        return [0, 0];
    }
    var norm_quantum = quantum / (size * size),
        fd = force_direction(bbox1.getCenter(), bbox2.getCenter());
    return [fd[0] * norm_quantum, fd[1] * norm_quantum];
};

var displacement_force = function(bbox, anchor, size){
    var quantum = image_moved_distance(anchor, bbox.getCenter());
    if (quantum == 0){
        return [0, 0];
    }
    var alpha = 0.1,
        norm_quantum = quantum / size,
        fd = force_direction(anchor, bbox.getCenter());
    return [alpha * fd[0] * norm_quantum, alpha * fd[1] * norm_quantum];
};

var force_direction = function(point1, point2){
    var distance = image_moved_distance(point1, point2),
        x = point1.lng - point2.lng,
        y = point1.lat - point2.lat;
    if (distance === 0){
        x = Math.random()*0.1;
        return [x, Math.sqrt(1 - x*x)];
    } else {
        return [x/distance, y/distance];
    }
};

// SVG map related code

var svg_setup = false,
    district_photos = {},
    toggle_map = function(){
    var map = document.querySelector('#pari-map'),
        svg = document.querySelector('iframe');
    if (svg.style.display === "none") {
        map.style.display = "none";
        svg.style.display = "block";
        if (!svg_setup) {
            setup_svg_map();
        }
    } else{
        svg.style.display = "none";
        map.style.display = "block";
    }
};

var district_click_handler = function(e){
    var district_name = e.target.getAttribute('title'),
        photos_ = district_photos[district_name] || [];
    console.log(district_name);
    console.log(photos_);
    show_photoswipe_gallery(photos_);
};

var show_photoswipe_gallery = function(photos_){
    var pswp_element = document.querySelectorAll('.pswp')[0],
        items = photos_.map(function(photo){
            return {
                src: photo.photo,
                w: 512,
                h: 512,
                title: get_popup_content(photo)
            };
        }),
        options = {},
        gallery = new PhotoSwipe( pswp_element, PhotoSwipeUI_Default, items, options);

    gallery.init();
};

var svg_districts = function(){
    var map_iframe = document.querySelector('iframe'),
        innerDocument = map_iframe.contentDocument || map_iframe.contentWindow.document;
    return innerDocument.querySelectorAll('path');
};

var add_svg_event_handlers = function(){
    console.log("Adding event handlers...");
    svg_districts().forEach(function(path){
        path.addEventListener('click', district_click_handler);
    });
    handlers_added = true;
};

var group_photos_by_district = function(){
    photos.forEach(function(photo){
        if (district_photos[photo.district] == undefined) {
            district_photos[photo.district] = [];
        }
        // FIXME: Normalize district names between faces data and SVG map!
        district_photos[photo.district].push(photo);
    });
};

var show_counts = function(){
    svg_districts().forEach(function(path){
        var district_name = path.getAttribute('title'),
            count = (district_photos[district_name] || []).length,
            color;
        if (count == 0) {
            color = 'red';
        } else if (count < 4) {
            color = 'orange';
        } else {
            color = 'green';
        }
        path.setAttribute('style', 'fill:'+color);
    });
};

var setup_svg_map = function(){
    if (photos.length > 0){
        add_svg_event_handlers();
        group_photos_by_district();
        show_counts();
        svg_setup = true;
    } else {
        // FIXME: Show this to the user
        console.log("Photos not fetched, yet");
    }
};

// Main ////
setup_map(pari_map);
fetch_photo_data(show_faces);
