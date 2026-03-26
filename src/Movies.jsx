import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPricesForImdbID } from "./components/pricing";
import './styles.css';

const API_KEY = "fca438ff"; 

const BROWSE_QUERIES = [
  "movie", "film", "love", "war", "crime", "space",
  "hero", "adventure", "comedy", "drama", "horror",
  "thriller", "fantasy", "mystery", "romance"
];

function dedupeByImdbID(movies) {
  return Array.from(new Map(movies.map((m) => [m.imdbID, m])).values());
}

async function fetchMovies(query) {
  const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.Response === "False" ? [] : (data.Search || []);
}

export default function Movies() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const mode = state?.mode || "browse";
  const queries = state?.queries ?? BROWSE_QUERIES;
  const title = state?.title ?? "";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [sort, setSort] = useState("");
  const [searchInput, setSearchInput] = useState(title || "");

  useEffect(() => {
  setSearchInput(title || "");
}, [title]);

  useEffect(() => {
  let cancelled = false;

  async function load() {
    const start = Date.now();

    setLoading(true);
    setEmpty(false);

    try {
      let unique = [];

if (mode === "title") {
  // single title search
  const results = await fetchMovies(title);
  unique = dedupeByImdbID(results);
} else {
  // browse or genre-search (list of queries)
  const qList = mode === "browse" ? BROWSE_QUERIES : queries;
  const results = await Promise.all(qList.map(fetchMovies));
  const combined = results.flat();
  unique = dedupeByImdbID(combined);
}

      if (!cancelled) {
        setMovies(unique);
        setEmpty(unique.length === 0);
      }
    } catch {
      if (!cancelled) {
        setMovies([]);
        setEmpty(true);
      }
    } finally {
      const minMs = 800;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minMs - elapsed);

      await new Promise((r) => setTimeout(r, remaining));

      if (!cancelled) setLoading(false);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, [mode, queries, title]);


  const sortedMovies = useMemo(() => {
    const arr = [...movies];

    if (sort === "A_to_Z") {
      arr.sort((a, b) => a.Title.localeCompare(b.Title));
    }

    if (sort === "LOW_TO_HIGH" || sort === "HIGH_TO_LOW") {
      arr.sort((a, b) => {
        const priceA = Number(getPricesForImdbID(a.imdbID).purchase);
        const priceB = Number(getPricesForImdbID(b.imdbID).purchase);

        return sort === "LOW_TO_HIGH" ? priceA - priceB : priceB - priceA;
      });
    }

    return arr;
  }, [movies, sort]);

  function handleSearchSubmit(e) {
  e.preventDefault();

  const trimmed = searchInput.trim();
  if (!trimmed) return;

  navigate("/movies", {
    state: {
      mode: "search",
      title: trimmed,
      queries: [trimmed],
    },
  });
}

return (
  <div id="movies__body">
    <main id="movies__main">
      <section id="movies">
        <div className="container">
          <div className="row">
          <form className="movies__search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search for a movie"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="movies__search--input"
            />
            <button type="submit" className="btn movies__search--btn">
              Search
            </button>
          </form>
            <div className="movies__header">
              <h2 className="section__title movies__header--title">
                {title ? (
                  <>
                    Results for <span className="peru">"{title}"</span>
                  </>
                ) : (
                  <>
                    All <span className="peru">Movies</span>
                  </>
                )}
              </h2>

              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="" disabled>
                  Sort
                </option>
                <option value="LOW_TO_HIGH">Price: Low to High</option>
                <option value="HIGH_TO_LOW">Price: High to Low</option>
                <option value="A_to_Z">A to Z</option>
              </select>
            </div>

            {loading && <p>Loading...</p>}

            {!loading && empty && (
              <section id="moviesEmptyState" className="movies-empty">
                <figure className="movies-empty__img">
                  <img src="/assets/undraw_home-cinema_jdm1.svg" alt="" />
                </figure>
                <h2>Could not find any matches related to your search.</h2>
                <p>Please change the filter or reset it below.</p>
                <button className="btn" type="button" onClick={() => navigate("/")}>
                  Reset filter
                </button>
              </section>
            )}
            
            {!loading && !empty && (
              <div className={`movies ${loading ? "movies--hidden" : "movies--visible"}`}
              id="moviesList">

                {sortedMovies.map((movie) => {
                  const prices = getPricesForImdbID(movie.imdbID);

                  const poster =
                    movie.Poster && movie.Poster !== "N/A"
                      ? movie.Poster
                      : "/assets/no-image.svg";

                  return (
                    <div className="movie" key={movie.imdbID} onClick={() => navigate(`/movies/${movie.imdbID}`)} 
                    style={{ cursor: "pointer" }}>
                      <figure className="movie__img--wrapper">
                        <img className="movie__img" src={poster} alt={movie.Title}  loading="lazy" onError={(e) => { e.currentTarget.src = "/assets/no-image.svg"; }} />
                      </figure>

                      <h3 className="movie__title">{movie.Title}</h3>

                      <div className="movie__prices">
                        <span className="movie__price--purchase">
                          Purchase: ${prices.purchase}
                        </span>
                        <span>Rent: ${prices.rent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  </div>
);}