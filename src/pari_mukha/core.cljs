(ns pari-mukha.core
  (:require [goog.dom :as gdom]
            [om.next :as om]
            [pari-mukha.map :as pari-map :refer [PariMap faces]]
            [cljsjs.react-leaflet]))

(enable-console-print!)

(defonce app-state (atom {:faces faces}))

(def reconciler
  (om/reconciler {:state app-state}))

(om/add-root! reconciler
              PariMap (gdom/getElement "app"))

;; For figwheel
(defn on-js-reload [])
