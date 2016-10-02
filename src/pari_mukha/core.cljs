(ns pari-mukha.core
  (:require [goog.dom :as gdom]
            [om.next :as om :refer-macros [defui]]
            [om.dom :as dom :include-macros true]
            [cljsjs.react-leaflet]))

(enable-console-print!)

;; define your app data so that it doesn't get over-written on reload

(def india-coords #js [22 81])

(def attribution "&copy; <a href=http://osm.org/copyright>OpenStreetMap</a> contributors")
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
             :photo "https://ruralindiaonline.org/media/images/Mithun_S_1_copy.2e16d0ba.fill-1110x1410.jpg"           }])


(defonce app-state (atom {:faces faces}))

(def image-bounds [[[21 82] [22 83]]
                   [[12 76] [13 77]]])

(defui MyMap
  Object
  (render [this]
          (let [{:keys [faces]} (om/props this)]
            (Map #js {:center india-coords :zoom 5}
                 (TileLayer #js {:url tile-url :attribution attribution})
                 (for [[face bounds] (map vector faces image-bounds)]
                   (ImageOverlay (clj->js {:bounds bounds :opacity 0.9 :url (:photo face)})))))))

(def reconciler
  (om/reconciler {:state app-state}))

(om/add-root! reconciler
              MyMap (gdom/getElement "app"))
