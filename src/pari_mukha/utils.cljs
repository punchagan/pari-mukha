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
