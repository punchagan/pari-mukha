(defproject pari-mukha "0.1.0-SNAPSHOT"
  :description "PARI's facial map of India on a map"
  :license {:name "GNU Affero General Public License, version 3"
            :url "https://www.gnu.org/licenses/agpl.html"}

  :min-lein-version "2.7.1"

  :dependencies [[org.clojure/clojure "1.8.0"]
                 [org.clojure/clojurescript "1.9.229"]
                 ;; For the scraper
                 [enlive "1.1.6"]
                 [me.raynes/fs "1.4.6"]]

  :main ^:skip-aot pari-mukha.scraper

  :source-paths ["src"]

  :clean-targets ^{:protect false} ["target"]

)
