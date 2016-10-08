(ns pari-mukha.scraper
  (:import (java.net URLEncoder URLDecoder))
  (:require [net.cgrand.enlive-html :as html]
            [me.raynes.fs :as fs :refer [*cwd* file exists?]]
            [clojure.string :as str]
            [clojure.data.json :as json]
            [clojure.edn :as edn]))

(defn fetch-url
  "Grab the contents of the url specified"
  [url]
  (html/html-resource (java.net.URL. url)))

(def base-url "https://ruralindiaonline.org")
(def start-url (str base-url "/categories/faces/"))
;; FIXME: Assumes lein run is called from pari-mukha directory
(def scraped-data-path (file *cwd* "resources" "public" "data" "faces-new.edn"))

(defn pm-face-page-urls
  "Get urls of all pages with faces"
  [url]
  (map #(str base-url (:href (:attrs %)))
       (html/select (fetch-url url) [:div.face_paginator :a])))

(defn make-keyword [s]
  (->> s
       str/lower-case
       (#(str/replace % #"[^a-z]+" "-"))
       (#(str/replace % #"^-|-$" ""))
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

(defn -clean-up-data [info]
  ;; Hackish data clean up function
  (let [{:keys [state]} info]
    (when (not (nil? state))
      (->> (cond
             (str/includes? state "Andhra Pradesh*") "Andhra Pradesh"
             (str/includes? state "Kalahandi") "Odisha"
             (str/includes? state "Telangana") "Telangana"
             (str/includes? state "201") "West Bengal")
           (assoc info :state)))))

(defn extract [node]
  (let [attrs (:attrs (first (html/select node [:a])))
        name (-> (:data-title attrs) str/capitalize str/trim)
        district (-> (:data-district attrs) str/capitalize str/trim)
        description (:data-description attrs)
        photo (:src (:attrs (first (html/select node [:img]))))]

    (-> (parse-description description)
        (merge (zipmap [:name :district :photo] [name district photo]))
        (-clean-up-data))))

(defn pm-page-faces
  "Get all the faces on a page"
  [url]
  ;; FIXME: Causes the EDN file to go bonkers!!!
  ;; (println "Scraping page" url)
  (map extract (html/select (fetch-url url) [:div.categories])))

;;; Maps/Geocoding stuff

(def maps-api-url "https://maps.googleapis.com/maps/api/geocode/json?&address=")

(defn get-address [face]
  (let [{:keys [village district state]} face]
    (->> [village district state]
         (filter (fn [x] (not (str/blank? x))))
         (str/join ", "))))

(defn url-encode [url]
  (some-> url str (URLEncoder/encode "UTF-8") (.replace "+" "%20")))

(defn geolocate [face]
  (let [address (get-address face)
        url (str maps-api-url (url-encode address))]
    (print (slurp url))))

;; Main

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
  (println (str "Scraped data is at " scraped-data-path)))
