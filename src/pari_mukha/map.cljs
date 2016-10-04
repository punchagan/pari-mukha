(ns pari-mukha.map
  (:require [om.next :as om :refer-macros [defui]]
            [om.dom :as dom :include-macros true]
            [cljsjs.react-leaflet]))

(def Map (js/React.createFactory js/ReactLeaflet.Map))
(def TileLayer (js/React.createFactory js/ReactLeaflet.TileLayer))
(def GeoJson (js/React.createFactory js/ReactLeaflet.GeoJson))
(def ImageOverlay (js/React.createFactory js/ReactLeaflet.ImageOverlay))

(def india-coords #js [22 81])
(def india-bounds (js/L.latLngBounds (js/L.latLng 37 67) (js/L.latLng 0 98)))
(def osm-attribution "Map tiles by <a href=http://stamen.com>Stamen Design</a>, <a href=http://creativecommons.org/licenses/by/3.0>CC BY 3.0</a> &mdash; Map data &copy; <a href=http://www.openstreetmap.org/copyright>OpenStreetMap</a>")
(def pari-attribution "Photos &copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>")
(def tile-url "http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}")

(def faces [{:occupation "Hawker"
             :village "Aulakunnu"
             :block "Ambalapuzha"
             :district "Alappuzha"
             :state "Kerala"
             :date "May 18, 2014"
             :photographer "Jipson Kodiamkunnel"
             :camera "Canon 600D"
             :photo "https://ruralindiaonline.org/media/images/Ravindran_Nair_4_copy.2e16d0ba.fill-1110x1410.jpg"
             :location [9.4981 76.3388]}

            {
             :occupation "Vegetable Vendor"
             :village "Padinjare"
             :block "Alappuzha"
             :district "Alappuzha"
             :state "Kerala"
             :date "May 18, 2014"
             :photographer "Jipson Kodiamkunnel"
             :camera "Canon 600D"
             :photo "https://ruralindiaonline.org/media/images/Mithun_S_1_copy.2e16d0ba.fill-1110x1410.jpg"
             :location [9.4981 76.3388]}])


(defn compute-bounds
  "Compute placement of images so that they don't overlap"
  ;; http://vis.berkeley.edu/courses/cs294-10-fa13/wiki/images/5/55/FP_EvanWang_paper.pdf
  ;; https://github.com/tinker10/D3-Labeler/blob/master/labeler.js
  ([faces] (compute-bounds faces 0.1))
  ([faces image-size] (for [face faces]
                        (let [[x y] (:location face)
                              bounds [[x y] [(+ x image-size) (+ y image-size)]]]
                          (assoc face :bounds bounds)))))

(defui PariMap
  Object
  (render [this]
          (let [{:keys [faces]} (om/props this)]
            (Map #js {:center india-coords :zoom 5}
                 (TileLayer #js {:url tile-url :attribution osm-attribution :bounds india-bounds :ext "png"})
                 (for [face (compute-bounds faces)]
                   (ImageOverlay (clj->js {:bounds (:bounds face)
                                             :opacity 0.9
                                             :url (:photo face)
                                             :attribution pari-attribution
                                             :key (:photo face)})))))))
