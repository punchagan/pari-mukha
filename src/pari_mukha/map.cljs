(ns pari-mukha.map
  (:require
   [pari-mukha.utils :as utils]
   [cljsjs.leaflet]))

(def india-coords #js [22 81])
(def india-bounds (js/L.latLngBounds (js/L.latLng 37 67) (js/L.latLng 0 98)))
(def map-attribution "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ")
(def pari-attribution "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>")
(def tile-url "//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}")

(defn compute-bounds
  "Compute placement of images so that they don't overlap"
  ([faces] (compute-bounds faces 0.1))
  ([faces image-size]
   (let [objects (for [face faces
                       :let [location (-> face :location)
                             parsed-location (map location [:lat :lng])]]
                   (assoc face
                          :location parsed-location
                          :size image-size
                          :center parsed-location))]
     (for [face (utils/simulate objects)
           :let [[x y] (:center face)
                 bounds [[(- x (/ image-size 2)) (- y (/ image-size 2))]
                         [(+ x (/ image-size 2)) (+ y (/ image-size 2))]]]]
       (assoc face :bounds bounds)))))


(defn setup-map [map-container-id]
  (let [map (L.map map-container-id #js {:center india-coords :zoom 1})
        tile-layer (L.tileLayer tile-url)]
    (tile-layer.addTo map)))

;; L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', ).addTo(mymap);


;; {
;;  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
;;  maxZoom: 18,
;;  id: 'your.mapbox.project.id',
;;  accessToken: 'your.mapbox.public.access.token'
;;  }
