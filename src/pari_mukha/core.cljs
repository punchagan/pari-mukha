(ns pari-mukha.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [goog.dom :as gdom]
            [om.next :as om]
            [pari-mukha.map :as pari-map :refer [PariMap]]
            [cljsjs.react-leaflet]
            [cljs-http.client :as http]
            [cljs.core.async :refer [<!]]))

(enable-console-print!)

(defonce app-state (atom {:faces []}))

(def reconciler
  (om/reconciler {:state app-state}))

(om/add-root! reconciler
              PariMap (gdom/getElement "app"))

(go (let [response (<! (http/get "data/faces.edn"))]
      (swap! app-state assoc :faces (:body response))))
