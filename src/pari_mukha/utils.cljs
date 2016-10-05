(ns pari-mukha.utils)

(defn overlap-area [object-1 object-2]
  "Compute the area of overlap between object-1 and object-2."
  (let [[x1 y1] (:center object-1)
        [x2 y2] (:center object-2)
        h1 (or (:height object-1) (:size object-1))
        w1 (or (:width object-1) (:size object-1))
        h2 (or (:height object-2) (:size object-2))
        w2 (or (:width object-2) (:size object-2))

        ;; left
        l1 (- x1 (/ w1 2)) l2 (- x2 (/ w2 2))

        ;; right
        r1 (+ x1 (/ w1 2)) r2 (+ x2 (/ w2 2))

        ;; top
        t1 (+ y1 (/ h1 2)) t2 (+ y2 (/ h2 2))

        ;; bottom
        b1 (- y1 (/ h1 2)) b2 (- y2 (/ h2 2))

        dx (max 0 (- (min r1 r2) (max l1 l2)))
        dy (max 0 (- (min t1 t2) (max b1 b2)))]

    (* dx dy)))

(defn net-force [object objects]
  (reduce add-components
          [(attraction object) (repulsion object objects)]))


(defn distance [[x1 y1] [x2 y2]]
  (.sqrt js/Math (+ (.pow js/Math (- x1 x2) 2)
                    (.pow js/Math (- y1 y2) 2))))

(defn attraction [object]
  "Object is pulled towards it's location by linear/log spring force"
  (let [c_1 2
        c_2 1
        [x1 y1] (:location object)
        [x2 y2] (:center object)
        d (distance [x1 y1] [x2 y2])
        x_component (if (= 0 d) 0.5 (/ (- x1 x2) d))
        y_component (if (= 0 d) 0.5 (/ (- y1 y2) d))
        ;; FIXME: Do we really need the log?
        F (* c_1 (.log10 js/Math (/ d c_2)))]
    [(* F x_component) (* F y_component)]))

(defn add-components [[x1 y1] [x2 y2]]
  [(+ x1 x2) (+ y1 y2)])

(defn repulsion [object objects]
  "Objects are repelled by a force proportional to the area of overlap"
  (reduce add-components
          (for [other-object objects
                :when (not (identical? object other-object))]
            (let [c_3 1
                  [x1 y1] (:center object)
                  [x2 y2] (:center other-object)
                  d (distance [x1 y1] [x2 y2])
                  ;; FIXME: If distance is 0, we need to pick a random direction
                  x_component (if (= 0 d) 0.5 (/ (- x1 x2) d))
                  y_component (if (= 0 d) 0.5 (/ (- y1 y2) d))
                  F (* c_3 (overlap-area object other-object))]
              [(* F x_component) (* F y_component) ]))))



;; ;; FIXME: Write tests for this code!

;; (def objects
;;   [{:center [0 0]
;;     :location [1 1]
;;     :size 1}
;;    {:center [0 0]
;;     :location [1 1]
;;     :size 1}
;;    {:center [0.5 0.5]
;;     :location [1 1]
;;     :size 1}
;;    {:center [0.4 0.7]
;;     :location [1 1]
;;     :size 1}])

;; (repulsion (first objects) objects)
;; (attraction (nth objects 3))
;; (net-force (first objects) objects)
