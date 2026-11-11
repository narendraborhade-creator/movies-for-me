import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { tmdbFetch, imgUrl, isAnimeContent } from "../utils/api";
import { SearchIcon, CloseIcon } from "./Icons";
import { storage } from "../utils/storage";

const HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 12;

const GENRES = [
  { id: "all", name: "All Genres" },
  { id: 28, tvId: 10759, name: "Action" },
  { id: 35, tvId: 35, name: "Comedy" },
  { id: 18, tvId: 18, name: "Drama" },
  { id: 16, tvId: 16, name: "Animation" },
  { id: 878, tvId: 10765, name: "Sci-Fi & Fantasy" },
  { id: 27, tvId: 9648, name: "Horror" },
  { id: 10749, tvId: 10749, name: "Romance" },
  { id: 53, tvId: 9648, name: "Thriller" },
  { id: 9648, tvId: 9648, name: "Mystery" },
  { id: 99, tvId: 99, name: "Documentary" },
];

function loadHistory() {
  return storage.get(HISTORY_KEY) || [];
}

function saveHistory(history) {
  storage.set(HISTORY_KEY, history);
}

export default function SearchModal({ apiKey, onSelect, onClose, offline }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'movie' | 'tv' | 'anime'
  const [genreFilter, setGenreFilter] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const inputRef = useRef();

  useEffect(() => {
    const tid = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      if (typeFilter !== "all" || genreFilter !== "all") {
        // Browse/discover by genre or type when query is empty
        let mounted = true;
        setLoading(true);
        const endpoint =
          typeFilter === "tv" || typeFilter === "anime"
            ? `/trending/tv/week`
            : `/trending/movie/week`;
        tmdbFetch(endpoint, apiKey)
          .then((data) => {
            if (mounted) {
              const res = (data.results || []).map((item) => ({
                ...item,
                media_type:
                  item.media_type || (typeFilter === "tv" || typeFilter === "anime" ? "tv" : "movie"),
              }));
              setResults(res.slice(0, 20));
            }
          })
          .catch(() => {})
          .finally(() => {
            if (mounted) setLoading(false);
          });
        return () => {
          mounted = false;
        };
      } else {
        setResults([]);
        return;
      }
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await tmdbFetch(
          `/search/multi?query=${encodeURIComponent(query)}&page=1`,
          apiKey,
        );
        if (mounted) {
          setResults(
            (data.results || [])
              .filter((r) => r.media_type !== "person")
              .slice(0, 24),
          );
        }
      } catch {}
      if (mounted) setLoading(false);
    }, 380);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query, apiKey, typeFilter, genreFilter]);

  // Apply unified type and genre filtering
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const isAnime = isAnimeContent(item);
      const isTv = item.media_type === "tv";
      const isMovie = item.media_type === "movie";

      // Type filter
      if (typeFilter === "movie" && !isMovie) return false;
      if (typeFilter === "tv" && (!isTv || isAnime)) return false;
      if (typeFilter === "anime" && !isAnime) return false;

      // Genre filter
      if (genreFilter !== "all") {
        const itemGenres = item.genre_ids || (item.genres || []).map((g) => g.id);
        const targetGenre = GENRES.find((g) => g.id === genreFilter);
        if (targetGenre) {
          const matchMovie = targetGenre.id && itemGenres.includes(targetGenre.id);
          const matchTv = targetGenre.tvId && itemGenres.includes(targetGenre.tvId);
          if (!matchMovie && !matchTv) return false;
        }
      }

      return true;
    });
  }, [results, typeFilter, genreFilter]);

  const addToHistory = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(
        0,
        MAX_HISTORY,
      );
      saveHistory(next);
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((e, term) => {
    e.stopPropagation();
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const handleSelect = (r) => {
    const trimmed = query.trim();
    if (trimmed) {
      const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
        0,
        MAX_HISTORY,
      );
      saveHistory(next);
      setHistory(next);
    }
    onSelect(r);
    onClose();
  };

  const handleHistoryClick = useCallback((term) => {
    setQuery(term);
    inputRef.current?.focus();
  }, []);

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && query.trim()) addToHistory(query);
  };

  const showHistory = !query && history.length > 0 && typeFilter === "all" && genreFilter === "all";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="search-box">
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search movies, TV shows, and anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query ? (
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setQuery("")}
            >
              <CloseIcon />
            </button>
          ) : (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Filter Toolbar: Type & Genre */}
        <div className="search-filters-bar">
          <div className="search-type-tabs">
            <button
              className={`search-filter-tab${typeFilter === "all" ? " active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              All
            </button>
            <button
              className={`search-filter-tab${typeFilter === "movie" ? " active" : ""}`}
              onClick={() => setTypeFilter("movie")}
            >
              Movies
            </button>
            <button
              className={`search-filter-tab${typeFilter === "tv" ? " active" : ""}`}
              onClick={() => setTypeFilter("tv")}
            >
              TV Shows
            </button>
            <button
              className={`search-filter-tab${typeFilter === "anime" ? " active" : ""}`}
              onClick={() => setTypeFilter("anime")}
            >
              Anime
            </button>
          </div>
          <div className="search-genre-chips">
            {GENRES.map((g) => (
              <button
                key={g.id}
                className={`search-genre-chip${genreFilter === g.id ? " active" : ""}`}
                onClick={() => setGenreFilter(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="search-results">
          {offline && (
            <div
              style={{
                padding: "12px 20px",
                background: "rgba(255,165,0,0.1)",
                borderBottom: "1px solid var(--border)",
                fontSize: 13,
                color: "#ff9800",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🌐 No internet, search is unavailable offline.
            </div>
          )}

          {!offline && loading && (
            <div className="loader">
              <div className="spinner" />
            </div>
          )}

          {!loading && (query || typeFilter !== "all" || genreFilter !== "all") && filteredResults.length === 0 && (
            <div className="search-empty">
              No results found{query ? ` for "${query}"` : ""}. Try adjusting your filters.
            </div>
          )}

          {!loading &&
            filteredResults.map((r) => {
              const isAnime = isAnimeContent(r);
              return (
                <div
                  key={`${r.media_type || "item"}_${r.id}`}
                  className="search-result"
                  onClick={() => handleSelect(r)}
                >
                  <img
                    src={
                      r.poster_path
                        ? imgUrl(r.poster_path, "w92")
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='58'%3E%3Crect fill='%23222' width='40' height='58'/%3E%3C/svg%3E"
                    }
                    alt=""
                  />
                  <div className="search-result-info">
                    <div className="search-result-title">{r.title || r.name}</div>
                    <div className="search-result-meta">
                      {(r.release_date || r.first_air_date || "").slice(0, 4)}
                      {r.vote_average ? ` · ★ ${r.vote_average.toFixed(1)}` : ""}
                    </div>
                  </div>
                  <span
                    className={`search-result-type ${
                      isAnime
                        ? "type-anime"
                        : r.media_type === "tv"
                          ? "type-tv"
                          : "type-movie"
                    }`}
                  >
                    {isAnime ? "Anime" : r.media_type === "tv" ? "Series" : "Movie"}
                  </span>
                </div>
              );
            })}

          {showHistory && (
            <div className="search-history">
              <div className="search-history-header">
                <span className="search-history-label">Recent searches</span>
                <button className="search-history-clear" onClick={clearHistory}>
                  Clear all
                </button>
              </div>
              {history.map((term) => (
                <div
                  key={term}
                  className="search-history-item"
                  onClick={() => handleHistoryClick(term)}
                >
                  <span className="search-history-icon">
                    <SearchIcon />
                  </span>
                  <span className="search-history-term">{term}</span>
                  <button
                    className="search-history-remove"
                    onClick={(e) => removeFromHistory(e, term)}
                    title="Remove"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!query && history.length === 0 && typeFilter === "all" && genreFilter === "all" && (
            <div className="search-hint">
              Search for movies, TV series, and anime &nbsp;·&nbsp; <kbd>ESC</kbd> to close
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
