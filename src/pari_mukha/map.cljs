(ns pari-mukha.map
  (:require [om.next :as om :refer-macros [defui]]
            [om.dom :as dom :include-macros true]
            [pari-mukha.utils :as utils]
            [cljsjs.react-leaflet]))

(def india-coords #js [22 81])
(def india-bounds (js/L.latLngBounds (js/L.latLng 37 67) (js/L.latLng 0 98)))
(def map-attribution "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ")
(def pari-attribution "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>")
(def tile-url "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}")

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

(def Map (js/React.createFactory js/ReactLeaflet.Map))
(def TileLayer (js/React.createFactory js/ReactLeaflet.TileLayer))
(def GeoJson (js/React.createFactory js/ReactLeaflet.GeoJson))
(def ImageOverlay (js/React.createFactory js/ReactLeaflet.ImageOverlay))

(defui PariMap
  Object
  (render [this]
          (let [{:keys [faces]} (om/props this)]
            (Map #js {:center india-coords :zoom 5 :maxZoom 16}
                 (TileLayer #js {:url tile-url :attribution map-attribution :ext "png"})
                 (for [face (compute-bounds faces)]
                   (ImageOverlay (clj->js {:bounds (:bounds face)
                                           :opacity 0.9
                                           :url (:photo face)
                                           :attribution pari-attribution
                                           :key (:photo face)})))))))
