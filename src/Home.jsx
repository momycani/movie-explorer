import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './styles.css';

const SEARCH_MAP = {
  holiday: ["christmas", "holiday", "winter"],
  family: ["family", "kids", "animated"],
  action: ["action", "adventure", "hero"],
  comedy: ["comedy", "funny", "laugh"],
  drama: ["drama", "life", "story"],
  horror: ["horror", "ghost", "zombie", "thriller"],
  romance: ["romance", "love", "heart"],
};

function normalizeQuery(q) {
  const x = q.toLowerCase().trim();

  if (["holiday", "holidays", "christmas", "xmas"].includes(x)) return "holiday";
  if (["family", "families", "kids", "animated"].includes(x)) return "family";
  if (["action", "actions", "adventure", "hero"].includes(x)) return "action";
  if (["comedy", "funny", "laugh"].includes(x)) return "comedy";
  if (["drama", "dramatic"].includes(x)) return "drama";
  if (["horror", "scary", "terror", "thriller"].includes(x)) return "horror";
  if (["romance", "romantic", "love"].includes(x)) return "romance";

  return "other";
}

export default function Home() {
  const navigate = useNavigate();

  const menuOpen = false;

  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

function runSearch() {
  const raw = value.trim();
  if (!raw) {
    setError(true);
    return;
  }

  const t = normalizeQuery(raw);

  // 1) If it's a known genre keyword → use your mapped genre queries
  if (t !== "other") {
    const queries = SEARCH_MAP[t];
    setError(false);
    setLoading(true);

    navigate("/movies", { state: { mode: "search", title: raw,  queries } });

    setLoading(false);
    return;
  }

  // 2) Otherwise → treat it as a movie title search
  setError(false);
  setLoading(true);

  navigate("/movies", { state: { mode: "title", title: raw } });

  setLoading(false);
}

  return (
    <div className={menuOpen ? "menu--open" : ""}>
      <section id="landing">
        

        <header>
          <div className="header__container">
            <div className="header__description">
              <h1>
                America's <span className="peru">top</span> choice for movie reviews,
                purchase, and rentals.
              </h1>
              <h2>
                Discover a movie that matches your{" "}
                <span className="peru hover-wiggle">vibe.</span>
              </h2>

              <div className="header__search-area">
                {!error ? (
                  <div className="header__search" id="searchNormal">
                    <input
                      type="text"
                      className="header__search--input"
                      placeholder="Search movies by title or genre..."
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") runSearch();
                      }}
                    />

                    <button
                      type="button"
                      className="header__btn"
                      onClick={runSearch}
                      disabled={loading}
                    >
                      <span className="btn__iconwrap">
                        <i
                          className={`fa-solid fa-magnifying-glass btn__icon ${
                            loading ? "" : "is-visible"
                          }`}
                        ></i>
                        <i className={`fa-solid fa-spinner movies__loading--spinner ${
                            loading ? "is-visible" : ""
                          }`}
                        ></i>
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="header__search-error" id="searchError">
                    <p className="search-error__text">Could not find any matches.</p>
                    <div className="search-error__actions">
                      <button type="button" className="btn btn--small" onClick={() => setError(false)}>
                        Try Again
                      </button>
                      <button
                        type="button"
                        className="btn btn--small btn--outline"
                        onClick={() => {
                          setValue("");
                          setError(false);
                        }}
                      >
                        Reset filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <figure className="header__img--wrapper">
              <img src="/assets/3593-v2.jpg" alt="" />
            </figure>
          </div>
        </header>
      </section>   
        </div>
  );
}
