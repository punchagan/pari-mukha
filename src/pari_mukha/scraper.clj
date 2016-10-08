(ns pari-mukha.scraper
  (:import (java.net URLEncoder URLDecoder))
  (:require [net.cgrand.enlive-html :as html]
            [me.raynes.fs :as fs :refer [*cwd* file exists?]]
            [clojure.string :as str]
            [clojure.data.json :as json]
            [clojure.edn :as edn]))

;; PARI website scraping

(def base-url "https://ruralindiaonline.org")
(def start-url (str base-url "/categories/faces/"))
;; FIXME: Assumes lein run is called from pari-mukha directory
(def scraped-data-path (file *cwd* "resources" "public" "data" "faces-scraped.edn"))

(defn fetch-url
  "Grab the contents of the url specified"
  [url]
  (html/html-resource (java.net.URL. url)))

(defn write-edn-data
  "Writes EDN data to the faces.edn file"
  [path data]
  (spit path (with-out-str (pr data))))

(defn pm-face-page-urls
  "Get urls of all pages with faces"
  [url]
  (map #(str base-url (:href (:attrs %)))
       (html/select (fetch-url url) [:div.face_paginator :a])))

(defn make-keyword [s]
  (-> s
      str/lower-case
      (str/replace #"[^a-z]+" "-")
      (str/replace #"^-|-$" "")
      keyword))

(defn parse-description [description]
  (let [description (str/replace description #"<br\s*/>" "</p><p>")
        texts (html/texts (html/select (html/html-snippet description) [:p]))]
    (->> texts
         (map (fn [x] (str/replace x #" +" " ")))
         (map str/trim)
         (filter (fn [x] (not (str/blank? x))))
         (map (fn [s] (str/split s #"[ \s]*[-:][ \s]*" 2)))
         (map (fn [[x y]]
                [(make-keyword x) y]))
         (filter (fn [[x y]] (not (or (nil? x) (str/blank? y)))))
         flatten
         (apply array-map))))

(defn extract [node]
  (let [attrs (:attrs (first (html/select node [:a])))
        name (-> (:data-title attrs) str/trim)
        district (-> (:data-district attrs) str/trim)
        description (:data-description attrs)
        photo (:src (:attrs (first (html/select node [:img]))))]

    (-> (parse-description description)
        (merge (zipmap [:name :district :photo] [name district photo])))))

(defn pm-page-faces
  "Get all the faces on a page"
  [url]
  ;; FIXME: Causes the EDN file to go bonkers!!!
  ;; (println "Scraping page" url)
  (map extract (html/select (fetch-url url) [:div.categories])))

(defn pm-scrape-all
  "Scrape all the faces info from PARI"
  []
  (->> start-url
       pm-face-page-urls
       (map pm-page-faces)
       flatten
       (write-edn-data scraped-data-path)))

;;; Maps/Geocoding stuff

(def maps-api-url "https://maps.googleapis.com/maps/api/geocode/json?&address=")
(def geo-data-path (file *cwd* "resources" "public" "data" "faces-geo-data.edn"))

(defn -clean-up-data [info]
  ;; Hackish data clean up function
  (let [{:keys [state]} info]
    (when (not (nil? state))
      (->> (cond
             (str/includes? state "Andhra Pradesh*") "Andhra Pradesh"
             (str/includes? state "Kalahandi") "Odisha"
             (str/includes? state "Telangana") "Telangana"
             (str/includes? state "201") "West Bengal"
             true state)
           (assoc info :state)))))

(defn url-encode
  "Encodes a string to use as url query param"
  [s]
  (some-> s str (URLEncoder/encode "UTF-8") (.replace "+" "%20")))

(defn make-address
  "Generate a query address from segments"
  [address-segments]
  (->> address-segments
       (filter (fn [x] (not (str/blank? x))))
       (str/join ", ")))

(defn get-addresses
  "Generate a bunch of addresses for geo-location

  We can't really be sure which address works, well. So, we generate a couple
  of different addresses (currently, with/without block).  We use the
  geolocation that seems most appropriate."
  [face]
  (let [{:keys [hamlet village block district state union-territory]} face
        country "India"]
    (map make-address
         [[hamlet village district (or state union-territory) country]
          [hamlet village block district (or state union-territory) country]])))

(defn geolocate-address
  "Get possible locations for the given address"
  [address]
  (let [url (str maps-api-url (url-encode address))]
    (json/read-json (slurp url))))

(defn geolocate
  "Get geo location data for one face."
  [face]
  (let [face (-clean-up-data face)
        addresses (get-addresses face)]
    (->> addresses
         (map geolocate-address)
         flatten)))

(defn geolocate-all
  "Get geo-location data for all the faces we scraped.

  NOTE: The function doesn't respect any rate limits.  So, some responses may
  not be fetched on the first run.  You may need to run the script multiple
  times to fix this."
  []
  (let [;; FIXME: we should be merging data from both files for correct updates!
        data-path (if (exists? geo-data-path) geo-data-path scraped-data-path)
        to-fetch #(contains? (set (map :status (:locations %))) "OVER_QUERY_LIMIT")
        faces (edn/read-string (slurp data-path))
        faces-geo-data (for [face faces]
                         (if (to-fetch face)
                           (assoc face :locations (geolocate face))
                           face))
        remaining (count (filter to-fetch faces-geo-data))]
    (write-edn-data geo-data-path faces-geo-data)
    (println "Remaining geo-locations to fetch:" remaining)))

;; Main

(defn -main []
  ;; Scrape data if not already scraped
  (when-not (exists? scraped-data-path)
    (println (str "Starting scraping from " start-url " ..."))
    (pm-scrape-all))
  (println (str "Scraped data is at " scraped-data-path))

  ;; Get geo data if not already done
  (println "Getting missing geo data")
  (geolocate-all)
  (println (str "Geo data is at " geo-data-path)))
