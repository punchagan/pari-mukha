(ns pari-mukha.map
  (:require [om.next :as om :refer-macros [defui]]
            [om.dom :as dom :include-macros true]
            [cljsjs.react-leaflet]))

(def india-coords #js [22 81])
(def osm-attribution "&copy; <a href=http://osm.org/copyright>OpenStreetMap</a> contributors")
(def pari-attribution "&copy; <a href=https://ruralindiaonline.org>People's Archive of Rural India</a>")
(def tile-url "http://{s}.tile.osm.org/{z}/{x}/{y}.png")

(def Map (js/React.createFactory js/ReactLeaflet.Map))
(def TileLayer (js/React.createFactory js/ReactLeaflet.TileLayer))
(def GeoJson (js/React.createFactory js/ReactLeaflet.GeoJson))
(def ImageOverlay (js/React.createFactory js/ReactLeaflet.ImageOverlay))

(def faces [{:occupation "Hawker"
             :village "Aulakunnu"
             :block "Ambalapuzha"
             :district "Alappuzha"
             :state "Kerala"
             :date "May 18, 2014"
             :photographer "Jipson Kodiamkunnel"
             :camera "Canon 600D"
             :photo "https://ruralindiaonline.org/media/images/Ravindran_Nair_4_copy.2e16d0ba.fill-1110x1410.jpg"}
            {
             :occupation "Vegetable Vendor"
             :village "Padinjare"
             :block "Alappuzha"
             :district "Alappuzha"
             :state "Kerala"
             :date "May 18, 2014"
             :photographer "Jipson Kodiamkunnel"
             :camera "Canon 600D"
             :photo "https://ruralindiaonline.org/media/images/Mithun_S_1_copy.2e16d0ba.fill-1110x1410.jpg"}])

(def image-bounds [[[21 82] [22 83]]
                   [[12 76] [13 77]]])


(defui PariMap
  Object
  (render [this]
          (let [{:keys [faces]} (om/props this)]
            (Map #js {:center india-coords :zoom 5}
                 (TileLayer #js {:url tile-url :attribution osm-attribution})
                 (for [[face bounds] (map vector faces image-bounds)]
                   (ImageOverlay (clj->js {:bounds bounds
                                           :opacity 0.9
                                           :url (:photo face)
                                           :attribution pari-attribution
                                           :key (:photo face)})))))))
