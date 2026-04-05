package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jmoiron/sqlx"

	"identity-service/internal/middleware"
	"identity-service/pkg/utils"
)

func NewHTTPRouter(db *sqlx.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)

	r.Route("/health", func(r chi.Router) {
		r.Get("/live", func(w http.ResponseWriter, r *http.Request) {
			utils.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
		})

		r.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
			if err := db.PingContext(r.Context()); err != nil {
				utils.Error(w, http.StatusServiceUnavailable, "database unreachable")
				return
			}
			utils.JSON(w, http.StatusOK, map[string]string{"status": "ready"})
		})
	})

	return r
}
