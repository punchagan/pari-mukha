var run_simulated_annealing = function(photos, photo_size){
    console.log("Running simulated annealing for " + photos.size + " photos");
    var photos_ = Array.from(photos),
        // Number of monte carlo runs
        N = 1000,
        current_T = 1.0,
        initial_T = 1.0,
        anchors = photos_.map(function(x){return L.latLng (x.location);}),
        bboxes = photos_.map(function(x){return image_bounds(x, photo_size);}),
        result;

    for (var i=0; i < N; i++){
        result = mc_sweep(current_T, anchors, bboxes);
        anchors = result.anchors;
        bboxes = result.bboxes;
        current_T = cooling_schedule(initial_T, i, N);
    }
    bboxes.forEach(function(bbox, i){photos_[i].display_bounds=L.latLngBounds(bbox);});
    return new Set(photos_);
};

var mc_sweep = function(current_T, anchors, bboxes){
    var n = anchors.length,
        current_energy = energy(anchors, bboxes),
        result, new_energy, delta_energy;

    for (var i=0; i<n; i++){
        result = mc_transform(current_T, anchors, bboxes, Math.random() < 0.5);
        new_energy = energy(result.anchors, result.bboxes);
        delta_energy = (new_energy - current_energy);
        if (Math.random() < Math.exp(-delta_energy / current_T)) {
            anchors = result.anchors;
            bboxes = result.bboxes;
            current_energy = new_energy;
        }
    }
    return {anchors: anchors, bboxes: bboxes};
};

var mc_transform = function(current_T, anchors, bboxes, rotate){
    var idx = choose_random(bboxes),
        bbox = bboxes[idx],
        moved_bbox = rotate?rotate_bbox(bbox):move_bbox(bbox),
        moved_bboxes = Array.from(bboxes);

    moved_bboxes[idx] = moved_bbox;
    return {anchors: anchors, bboxes: moved_bboxes};
};

var move_bbox = function(bbox){
    var max_move = 0.1 * (bbox.getNorth() - bbox.getSouth()),  // FIXME: play around with this?
        sw = bbox.getSouthWest(),
        ne = bbox.getNorthEast(),
        dlat = (Math.random() - 0.5) * max_move,
        dlng = (Math.random() - 0.5) * max_move;

    return L.latLngBounds([
        [sw.lat+dlat, sw.lng+dlng],
        [ne.lat+dlat, ne.lng+dlng]
    ]);
};

var rotate_bbox = move_bbox;

var choose_random = function(xs){
    var n = xs.length,
        i = Math.min(n - 1, Math.floor(Math.random() * n));
    return i;
};

// FIXME: define energy function!
var energy = function(anchors, bboxes){
    var sum = function(x, y){return x+y;},
        distances = anchors.map(function(a, i){return image_moved_distance(a, bboxes[i].getCenter());}),
        distance = distances.reduce(sum, 0),
        overlaps = bboxes.map(function(bbox, i){
            var o = bboxes.map(function(bbox_, j){return i === j?0:bounds_overlap(bbox, bbox_);});
            return o.reduce(sum, 0);

        }),
        overlap = overlaps.reduce(sum, 0);

    return distance*0.005+overlap*0.1;
};
