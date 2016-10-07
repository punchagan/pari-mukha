(ns pari-mukha.scraper
  (:require [net.cgrand.enlive-html :as html]
            [me.raynes.fs :as fs :refer [*cwd* file exists?]]
            [clojure.string :as str]))

(defn fetch-url
  "Grab the contents of the url specified"
  [url]
  (html/html-resource (java.net.URL. url)))

(def base-url "https://ruralindiaonline.org")
(def start-url (str base-url "/categories/faces/"))

(defn pm-face-page-urls
  "Get urls of all pages with faces"
  [url]
  (map #(str base-url (:href (:attrs %)))
       (html/select (fetch-url url) [:div.face_paginator :a])))

(defn parse-description [description]
  (let [texts (html/texts (html/select (html/html-snippet description) [:p]))]
    (->> texts
         (map (fn [s] (str/split s #":[ \s]+" 2)))
         (map (fn [[x y]]
                [(symbol (str ":" (str/lower-case x))) y]))
         flatten
         (apply hash-map))))

(defn extract [node]
  (let [attrs (:attrs (first (html/select node [:a])))
        name (:data-title attrs)
        district (:data-district attrs)
        description (:data-description attrs)
        photo (:src (:attrs (first (html/select node [:img]))))]
    (merge (zipmap [:name :district :photo] [name district photo])
           (parse-description description))))

(defn pm-page-faces
  "Get all the faces on a page"
  [url]
  (println "Scraping page" url)
  (map extract (html/select (fetch-url url) [:div.categories])))


;; FIXME: Assumes lein run is called from pari-mukha directory
(def scraped-data-path (file *cwd* "resources" "public" "data" "faces-new.edn"))

(defn write-edn-data [path data]
  "Writes EDN data to the faces.edn file"
  (spit path (with-out-str (pr data))))

(defn -main []
  ;; Scrape data if not already scraped
  (when-not (exists? scraped-data-path)
    (println (str "Starting scraping from " start-url " ..."))
    (->> start-url
         pm-face-page-urls
         (map pm-page-faces)
         flatten
         (write-edn-data scraped-data-path)))
  (println (str "Scraped data is at" scraped-data-path)))
