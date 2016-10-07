(ns pari-mukha.scraper
  (:require [net.cgrand.enlive-html :as html]
            [me.raynes.fs :as fs :refer [*cwd* file]]))

(defn fetch-url
  "Grab the contents of the url specified"
  [url]
  (html/html-resource (java.net.URL. url)))

(def base-url "https://ruralindiaonline.org")
(def start-url (str base-url "/categories/faces/"))

(defn pm-face-pages
  "Get urls of all pages with faces"
  [url]
  (map #(str base-url (:href (:attrs %)))
       (html/select (fetch-url url) [:div.face_paginator :a])))

(defn extract [node]
  (let [attrs (:attrs (first (html/select node [:a])))
        name (:data-title attrs)
        district (:data-district attrs)
        description (:data-description attrs)
        photo (:src (:attrs (first (html/select node [:img]))))]

    (zipmap [:name :district :description :photo]
            [name district description photo])))

(defn page-faces
  "Get all the faces on a page"
  [url]
  (map extract (html/select (fetch-url url) [:div.categories])))

(defn write-edn-data [data]
  "Writes EDN data to the faces.edn file"
  ;; FIXME: Assumes lein run is called from pari-mukha directory
  (let [path (file *cwd* "resources" "public" "data" "faces-new.edn")]
    (spit path (with-out-str (pr data)))))

(defn -main []
  (println (str "Starting scraping from " start-url " ..."))
  (-> start-url
      pm-face-pages
      first
      page-faces
      write-edn-data))
