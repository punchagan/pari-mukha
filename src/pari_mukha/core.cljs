(ns pari-mukha.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [clojure.browser.dom :refer [replace-node html->dom]]
   [cljs-http.client :as http]
   [cljs.core.async :refer [<!]]
   [cljs.reader :refer [read-string]]
   [pari-mukha.map :as pari-map]))

(enable-console-print!)

(defonce app-state (atom {:faces []}))

(defn get-face-data []
  (go (let [response (<! (http/get "data/faces.data"))
            body (:body response)]
        (swap! app-state assoc :faces (read-string body)))))

(defn teardown []
  (print "Tearing down!"))

(defn setup []
  (pari-map/setup-map "map-container")
  (get-face-data))

(setup)

;; define a :on-jsload hook in your :cljsbuild options
(defn on-js-reload []
  (teardown)
  (setup))
