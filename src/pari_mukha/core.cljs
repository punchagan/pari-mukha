(ns pari-mukha.core
  (:require [goog.dom :as gdom]
            [om.next :as om :refer-macros [defui]]
            [om.dom :as dom :include-macros true]
            [cljsjs.react-leaflet]))

(enable-console-print!)

;; define your app data so that it doesn't get over-written on reload

(defonce app-state (atom {:text "Hello world!"}))

(def india-coords #js [22.199166 78.476681])
(def attribution "&copy; <a href=http://osm.org/copyright>OpenStreetMap</a> contributors")
(def tile-url "http://{s}.tile.osm.org/{z}/{x}/{y}.png")

(def Map (js/React.createFactory js/ReactLeaflet.Map))
(def TileLayer (js/React.createFactory js/ReactLeaflet.TileLayer))

(defui MyMap
  Object
  (render [this]
          (Map #js {:center india-coords :zoom 5}
               (TileLayer #js {:url tile-url :attribution attribution}))))


(def reconciler
  (om/reconciler {:state app-state}))

(om/add-root! reconciler
              MyMap (gdom/getElement "app"))
