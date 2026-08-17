const importButton = document.querySelector("#importButton");
const fileInput = document.querySelector("#fileInput");
const status = document.querySelector("#status");

const stats = document.querySelector("#stats");

const watchlistCount = document.querySelector("#watchlistCount");
const ratingsCount = document.querySelector("#ratingsCount");
const watchedCount = document.querySelector("#watchedCount");
const reviewsCount = document.querySelector("#reviewsCount");

const pendingDrawerToggle =
    document.querySelector(
        "#pendingDrawerToggle"
    );

const pendingDrawer =
    document.querySelector(
        "#pendingDrawer"
    );

const pendingDrawerOverlay =
    document.querySelector(
        "#pendingDrawerOverlay"
    );

const pendingDrawerClose =
    document.querySelector(
        "#pendingDrawerClose"
    );

const pendingMovies =
    document.querySelector(
        "#pendingMovies"
    );

const pendingCount =
    document.querySelector(
        "#pendingCount"
    );

const runtimeButtons =
    document.querySelectorAll(
        "#runtimeOptions .option-button"
    );

const moodButtons =
    document.querySelectorAll(
        ".mood-button"
    );

const brainSlider =
    document.querySelector("#brainSlider");

const brainValue =
    document.querySelector("#brainValue");

const exploreSlider =
    document.querySelector("#exploreSlider");

const exploreValue =
    document.querySelector("#exploreValue");

const pickMovieButton =
    document.querySelector("#pickMovieButton");

const pickerError =
    document.querySelector("#pickerError");

const recommendationSection =
    document.querySelector("#recommendationSection");

const recommendationContent =
    document.querySelector("#recommendationContent");

const shownMovieIds = new Set();

const pickerState = {
    maxRuntime: null,

    moods: [],

    brainPower: 3,

    exploreLevel: 0.5
};

const enrichmentSection =
    document.querySelector("#enrichmentSection");

const enrichButton =
    document.querySelector("#enrichButton");

const enrichStatus =
    document.querySelector("#enrichStatus");

const progressBar =
    document.querySelector("#progressBar");

const watchlistSection =
    document.querySelector("#watchlistSection");

const movieGrid =
    document.querySelector("#movieGrid");

const watchlistTotal =
    document.querySelector("#watchlistTotal");

const savedMoviesJson = localStorage.getItem("whatToWatchMovies");

runtimeButtons.forEach(button => {
    button.addEventListener("click", () => {

        runtimeButtons.forEach(otherButton => {
            otherButton.classList.remove("selected");
        });

        button.classList.add("selected");


        const value =
            button.dataset.runtime;

        pickerState.maxRuntime =
            value
                ? Number(value)
                : null;
    });
});

moodButtons.forEach(button => {
    button.addEventListener("click", () => {

        const mood =
            button.dataset.mood;

        const alreadySelected =
            pickerState.moods.includes(mood);


        if (alreadySelected) {
            pickerState.moods =
                pickerState.moods.filter(
                    item => item !== mood
                );

            button.classList.remove("selected");

            return;
        }


        if (pickerState.moods.length >= 2) {
            pickerError.textContent =
                "Choose up to two moods.";

            return;
        }


        pickerState.moods.push(mood);

        button.classList.add("selected");

        pickerError.textContent = "";
    });
});

brainSlider.addEventListener(
    "input",
    () => {
        pickerState.brainPower =
            Number(brainSlider.value);

        brainValue.textContent =
            brainSlider.value;
    }
);

exploreSlider.addEventListener(
    "input",
    () => {
        pickerState.exploreLevel =
            Number(exploreSlider.value);


        const value =
            pickerState.exploreLevel;


        if (value <= 0.2) {
            exploreValue.textContent =
                "Very safe";
        }

        else if (value <= 0.4) {
            exploreValue.textContent =
                "Safe";
        }

        else if (value <= 0.6) {
            exploreValue.textContent =
                "Balanced";
        }

        else if (value <= 0.8) {
            exploreValue.textContent =
                "Explore";
        }

        else {
            exploreValue.textContent =
                "Surprise me";
        }
    }
);

function pickMovie(reset = true) {
    if (!window.movies) {
        pickerError.textContent =
            "Import Letterboxd data first.";

        return;
    }

    if (pickerState.moods.length === 0) {
        pickerError.textContent =
            "Choose at least one mood.";

        return;
    }

    const taste =
        buildTasteProfile(window.movies);

    const ranking =
        rankMoviesForMoment(
            window.movies,
            taste,
            pickerState
        );

    if (ranking.length === 0) {
        pickerError.textContent =
            "No movies match these settings.";

        return;
    }

    pickerError.textContent = "";

    if (reset) {
        shownMovieIds.clear();
        recommendationContent.innerHTML = "";
    }

    const availableCandidates =
        ranking.filter(item => {
            const id =
                item.movie.metadata?.tmdbId
                ?? item.movie.letterboxdUri;

            return !shownMovieIds.has(id);
        });

    if (availableCandidates.length === 0) {
        appendNoMoreMoviesMessage();
        return;
    }

    const candidatePool =
        availableCandidates.slice(0, 10);

    const weights =
        candidatePool.map(
            (_, index) =>
                candidatePool.length - index
        );

    const selected =
        weightedRandom(
            candidatePool,
            weights
        );

    const selectedId =
        selected.movie.metadata?.tmdbId
        ?? selected.movie.letterboxdUri;

    shownMovieIds.add(selectedId);

    appendRecommendation(
        selected,
        taste
    );
}

function weightedRandom(
    items,
    weights
) {
    const total =
        weights.reduce(
            (sum, weight) =>
                sum + weight,
            0
        );


    let random =
        Math.random() * total;


    for (
        let i = 0;
        i < items.length;
        i++
    ) {
        random -= weights[i];

        if (random <= 0) {
            return items[i];
        }
    }


    return items[0];
}

function appendRecommendation(
    result,
    taste
) {
    const movie =
        result.movie;

    const metadata =
        movie.metadata;


    const finalPercent =
        Math.round(
            result.finalScore * 100
        );


    const reasons =
        buildRecommendationReasons(
            result,
            taste
        );


    const posterHtml =
        metadata.poster

            ? `
                <img
                    class="recommendation-poster"
                    src="${metadata.poster}"
                    alt="${escapeHtml(movie.name)} poster"
                >
            `

            : `
                <div class="recommendation-poster">
                </div>
            `;


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "recommendation-item";

    wrapper.innerHTML = `
        <article class="recommendation-card">

            ${posterHtml}

            <div class="recommendation-info">

                <h2>
                    ${escapeHtml(movie.name)}
                </h2>

                <p class="recommendation-meta">
                    ${movie.year}

                    ${
                        metadata.runtime
                            ? ` · ${metadata.runtime} min`
                            : ""
                    }

                    ${
                        metadata.director
                            ? ` · ${escapeHtml(metadata.director)}`
                            : ""
                    }
                </p>
                <a
                    class="letterboxd-link"
                    href="${movie.letterboxdUri}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    LETTERBOXD PAGE
                </a>    

                <div class="recommendation-score">
                    ${finalPercent}%

                    <span>
                        MATCH FOR TONIGHT
                    </span>
                </div>

                <ul class="recommendation-reasons">
                    ${reasons
                        .map(
                            reason =>
                                `<li>+ ${escapeHtml(reason)}</li>`
                        )
                        .join("")}
                </ul>

                <div class="recommendation-actions">

                    <button
                        class="primary-button watched-button"
                    >
                        I WATCHED IT
                    </button>

                    <button
                        class="secondary-button another-button"
                    >
                        NAH, ANOTHER
                    </button>

                </div>

            </div>

        </article>
    `;

    recommendationContent.appendChild(wrapper);
    const anotherButton =
        wrapper.querySelector(
            ".another-button"
        );

    const watchedButton =
        wrapper.querySelector(
            ".watched-button"
        );


    anotherButton.addEventListener(
        "click",
        () => {
            anotherButton.disabled = true;

            anotherButton.textContent =
                "PASSED";

            pickMovie(false);
        }
    );


    watchedButton.addEventListener(
        "click",
        () => {
            markMovieWatched(
                movie,
                wrapper
            );
        }
    );
    recommendationSection
        .classList
        .remove("hidden");


    recommendationSection
        .scrollIntoView({
            behavior: "smooth"
        });

    watchedButton.addEventListener(
        "click",
        () => {
            markMovieWatched(movie, wrapper);
        }
    );
    wrapper.scrollIntoView({
        behavior: "smooth",
        block: "start"
    }); 
}

function buildRecommendationReasons(
    result,
    taste
) {
    const reasons = [];


    const tasteReasons =
        explainTasteScore(
            result.movie,
            taste
        );


    reasons.push(
        ...tasteReasons.slice(0, 2)
    );


    if (result.momentScore >= 0.75) {
        reasons.push(
            "Fits what you're in the mood for"
        );
    }


    if (
        pickerState.maxRuntime &&
        result.movie.metadata.runtime
    ) {
        reasons.push(
            `Fits your ${pickerState.maxRuntime}-minute limit`
        );
    }


    if (
        result.movie.watched
    ) {
        reasons.push(
            "Already watched - good rewatch candidate"
        );
    }


    return reasons.slice(0, 4);
}

function markMovieWatched(movie, wrapper) {
    movie.localWatched = true;

    movie.inWatchlist = false;

    movie.pendingLetterboxdLog = true;

    saveMovies(window.movies);

    renderWatchlist(window.movies);

    renderPendingMovies();
    
    wrapper.innerHTML = `
        <div class="watched-message">

            <h2>
                ${escapeHtml(movie.name)}
            </h2>

            <p>
                Watched. Check it on Letterboxd when you get a chance.
            </p>

            <a
                href="${movie.letterboxdUri}"
                target="_blank"
                rel="noopener noreferrer"
                class="primary-button"
            >
                Open Letterboxd
            </a>

        </div>
    `;
}

pickMovieButton.addEventListener(
    "click",
    pickMovie
);

if (savedMoviesJson) {
    const savedMovies = JSON.parse(savedMoviesJson);

    window.movies = savedMovies;
    renderPendingMovies();
    renderWatchlist(savedMovies);
    updateEnrichmentUI(savedMovies);

    const savedWatchlist = savedMovies.filter(
        movie => movie.inWatchlist
    );

    watchlistCount.textContent = savedWatchlist.length;

    ratingsCount.textContent = savedMovies.filter(
        movie => movie.rating !== null
    ).length;

    watchedCount.textContent = savedMovies.filter(
        movie => movie.watched
    ).length;

    reviewsCount.textContent = savedMovies.filter(
        movie => movie.reviewed
    ).length;

    stats.classList.remove("hidden");

    status.textContent = "Saved Letterboxd data loaded.";
}

importButton.addEventListener("click", () => {
    fileInput.click();
});


fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    status.textContent = "Reading Letterboxd export...";

    try {
        const zip = await JSZip.loadAsync(file);

        const watchlist = await readCsvFromZip(zip, "watchlist.csv");
        const ratings = await readCsvFromZip(zip, "ratings.csv");
        const watched = await readCsvFromZip(zip, "watched.csv");
        const reviews = await readCsvFromZip(zip, "reviews.csv");
        const diary = await readCsvFromZip(zip, "diary.csv");
        window.letterboxdData = {
            watchlist,
            ratings,
            watched,
            reviews,
            diary
        };
        const movies = buildMovieDatabase(
            watchlist,
            ratings,
            watched,
            reviews
        );
        const mergedMovies =
            mergeLetterboxdSync(
                window.movies ?? [],
                movies,
                diary,
                reviews
            );
        localStorage.setItem(
            "whatToWatchMovies",
            JSON.stringify(movies)
        );

        localStorage.setItem(
            "whatToWatchLastSync",
            new Date().toISOString()
        );
        window.movies = mergedMovies;
        renderWatchlist(mergedMovies);
        renderPendingMovies();
        updateEnrichmentUI(movies);

        watchlistCount.textContent = movies.filter(
            movie => movie.inWatchlist
        ).length;
        ratingsCount.textContent = ratings.length;
        watchedCount.textContent = watched.length;
        reviewsCount.textContent = reviews.length;

        stats.classList.remove("hidden");

        status.textContent = "Letterboxd data imported successfully.";

        console.log("Watchlist:", watchlist);
        console.log("Ratings:", ratings);
        console.log("Watched:", watched);
        console.log("Reviews:", reviews);

    } catch (error) {
        console.error(error);

        status.textContent = "Could not read this Letterboxd export.";
    }
});


async function readCsvFromZip(zip, filename) {
    const file = zip.file(filename);

    if (!file) {
        console.warn(`${filename} not found`);
        return [];
    }

    const text = await file.async("text");

    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true
    });

    return result.data;
}
function buildMovieDatabase(watchlist, ratings, watched, reviews) {
    const movies = new Map();

    function getOrCreateMovie(item) {
        const uri = item["Letterboxd URI"];

        if (!movies.has(uri)) {
            movies.set(uri, {
                letterboxdUri: uri,
                name: item.Name,
                year: Number(item.Year),

                inWatchlist: false,
                watched: false,

                rating: null,
                reviewed: false
            });
        }

        return movies.get(uri);
    }

    for (const item of watchlist) {
        const movie = getOrCreateMovie(item);

        movie.inWatchlist = true;
    }

    for (const item of watched) {
        const movie = getOrCreateMovie(item);

        movie.watched = true;
    }

    for (const item of ratings) {
        const movie = getOrCreateMovie(item);

        movie.rating = Number(item.Rating);
    }

    for (const item of reviews) {
        const movie = getOrCreateMovie(item);

        movie.reviewed = true;

        if (item.Rating) {
            movie.rating = Number(item.Rating);
        }
    }

    return Array.from(movies.values());
}
function renderWatchlist(movies) {
    const watchlistMovies = movies
        .filter(movie => movie.inWatchlist)
        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );

    movieGrid.innerHTML = "";

    for (const movie of watchlistMovies) {
        const card =
            document.createElement("article");

        card.className = "movie-card";

        const metadata = movie.metadata;

        const poster = metadata?.poster
            ? `
                <img
                    class="movie-poster"
                    src="${metadata.poster}"
                    alt="${escapeHtml(movie.name)} poster"
                >
            `
            : `
                <div class="poster-placeholder">
                    No poster
                </div>
            `;

        const runtime = metadata?.runtime
            ? `${metadata.runtime} min`
            : "";

        const genres = metadata?.genres?.length
            ? metadata.genres.slice(0, 2).join(" · ")
            : "";

        const director = metadata?.director
            ? metadata.director
            : "";

        const rewatchLabel = movie.watched
            ? `<span class="rewatch">REWATCH</span>`
            : "";

        card.innerHTML = `
            ${poster}

            <div class="movie-card-content">

                <h3>
                    ${escapeHtml(movie.name)}
                </h3>

                <p class="movie-meta">
                    ${movie.year}
                    ${runtime ? ` · ${runtime}` : ""}
                </p>

                ${
                    genres
                        ? `<p>${escapeHtml(genres)}</p>`
                        : ""
                }

                ${
                    director
                        ? `<p>${escapeHtml(director)}</p>`
                        : ""
                }

                ${rewatchLabel}

            </div>
        `;

        movieGrid.appendChild(card);
    }

    watchlistTotal.textContent =
        `${watchlistMovies.length} movies`;

    watchlistSection.classList.remove("hidden");
}
function updateEnrichmentUI(movies) {
    const relevantMovies = movies.filter(
        movie => movie.inWatchlist || movie.rating !== null
    );

    const enrichedMovies = relevantMovies.filter(
        movie => movie.metadata
    );

    enrichmentSection.classList.remove("hidden");

    const total = relevantMovies.length;
    const completed = enrichedMovies.length;

    const percentage =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);

    progressBar.style.width = `${percentage}%`;

    if (completed === total && total > 0) {
        enrichStatus.textContent =
            `Movie data loaded: ${completed} / ${total}`;

        enrichButton.textContent = "Movie data loaded";
        enrichButton.disabled = true;

        return;
    }

    enrichStatus.textContent =
        `${completed} / ${total} movies have TMDB data`;

    enrichButton.textContent = "Load movie data";
    enrichButton.disabled = false;
}
async function enrichMovie(movie) {
    if (movie.metadata) {
        return movie;
    }

    let results = await searchTmdbMovie(
        movie.name,
        movie.year
    );

    // Иногда поиск с годом ничего не находит.
    // Тогда пробуем только название.
    if (results.length === 0) {
        results = await searchTmdbMovie(
            movie.name
        );
    }

    if (results.length === 0) {
        throw new Error(
            `TMDB movie not found: ${movie.name} (${movie.year})`
        );
    }

    const match = findBestTmdbMatch(
        movie,
        results
    );

    const details =
        await getTmdbMovieDetails(match.id);

    movie.metadata =
        normalizeTmdbMovie(details);

    return movie;
}
function findBestTmdbMatch(movie, results) {
    const exactYearMatch = results.find(result => {
        if (!result.release_date) {
            return false;
        }

        const year =
            Number(result.release_date.slice(0, 4));

        return year === movie.year;
    });

    if (exactYearMatch) {
        return exactYearMatch;
    }

    return results[0];
}
async function enrichWatchlistMovies(movies) {
    const relevantMovies = movies.filter(
        movie => movie.inWatchlist || movie.rating !== null
    );

    const pendingMovies = relevantMovies.filter(
        movie => !movie.metadata
    );

    if (pendingMovies.length === 0) {
        updateEnrichmentUI(movies);
        return;
    }

    enrichButton.disabled = true;

    let completed =
        relevantMovies.length -
        pendingMovies.length;

    const total = relevantMovies.length;

    let nextIndex = 0;


    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= pendingMovies.length) {
                return;
            }

            const movie = pendingMovies[index];

            enrichStatus.textContent =
                `Loading ${movie.name}... ${completed} / ${total}`;

            try {
                await enrichMovie(movie);

                console.log(
                    `TMDB loaded: ${movie.name}`,
                    movie.metadata
                );

            } catch (error) {
                console.error(
                    `Could not load ${movie.name}:`,
                    error
                );

                // Сохраняем информацию,
                // что попытка была неудачной.
                movie.tmdbError = true;
            }

            completed++;

            const percentage =
                Math.round(
                    (completed / total) * 100
                );

            progressBar.style.width =
                `${percentage}%`;

            enrichStatus.textContent =
                `${completed} / ${total} movies processed`;

            // Сохраняемся после каждого фильма.
            // Если страницу закрыть посередине,
            // уже обработанные данные не потеряются.
            saveMovies(mergedMovies);

            renderWatchlist(mergedMovies);
            renderPendingMovies();
        }
    }


    const workers = [];

    const WORKER_COUNT = 4;

    for (let i = 0; i < WORKER_COUNT; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    window.movies = mergedMovies;

    saveMovies(mergedMovies);

    updateEnrichmentUI(movies);

    enrichStatus.textContent =
        `Finished processing ${total} movies.`;
}
function saveMovies(movies) {
    localStorage.setItem(
        "whatToWatchMovies",
        JSON.stringify(movies)
    );

    window.movies = movies;
}
enrichButton.addEventListener(
    "click",
    async () => {
        if (!window.movies) {
            return;
        }

        await enrichWatchlistMovies(
            window.movies
        );
    }
);
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function appendNoMoreMoviesMessage() {
    const message =
        document.createElement("p");

    message.className =
        "no-more-movies";

    message.textContent =
        "No more matching movies for these settings.";

    recommendationContent.appendChild(
        message
    );
}
function renderPendingMovies() {
    if (!window.movies) {
        return;
    }


    const movies =
        window.movies.filter(
            movie =>
                movie.pendingLetterboxdLog === true
        );


    pendingCount.textContent =
        movies.length;


    if (movies.length === 0) {
        pendingMovies.innerHTML = `
            <p class="pending-empty">
                Nothing waiting to be logged.
            </p>
        `;

        return;
    }


    pendingMovies.innerHTML = "";


    for (const movie of movies) {
        const metadata =
            movie.metadata ?? {};


        const item =
            document.createElement("article");


        item.className =
            "pending-movie";


        const posterHtml =
            metadata.poster

                ? `
                    <img
                        class="pending-movie-poster"
                        src="${metadata.poster}"
                        alt="${escapeHtml(movie.name)} poster"
                    >
                `

                : `
                    <div
                        class="pending-movie-poster"
                    ></div>
                `;


        item.innerHTML = `
            ${posterHtml}

            <h3>
                ${escapeHtml(movie.name)}
            </h3>

            <p class="pending-movie-meta">
                ${movie.year}

                ${
                    metadata.runtime
                        ? ` · ${metadata.runtime} min`
                        : ""
                }

                ${
                    metadata.director
                        ? ` · ${escapeHtml(metadata.director)}`
                        : ""
                }
            </p>


            <div class="pending-movie-actions">

                <a
                    href="${movie.letterboxdUri}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flag-letterboxd-button"
                >
                    FLAG IT ON LETTERBOXD
                </a>


                <button
                    class="logged-button"
                >
                    I LOGGED IT
                </button>

            </div>
        `;


        const loggedButton =
            item.querySelector(
                ".logged-button"
            );


        loggedButton.addEventListener(
            "click",
            () => {
                confirmMovieLogged(movie);
            }
        );


        pendingMovies.appendChild(item);
    }
}
function confirmMovieLogged(movie) {
    movie.pendingLetterboxdLog = false;

    movie.letterboxdLogged = true;

    saveMovies(window.movies);

    renderPendingMovies();
}
function openPendingDrawer() {
    renderPendingMovies();

    pendingDrawer.classList.add(
        "open"
    );

    pendingDrawerOverlay.classList.add(
        "open"
    );
}


function closePendingDrawer() {
    pendingDrawer.classList.remove(
        "open"
    );

    pendingDrawerOverlay.classList.remove(
        "open"
    );
}


pendingDrawerToggle.addEventListener(
    "click",
    openPendingDrawer
);


pendingDrawerClose.addEventListener(
    "click",
    closePendingDrawer
);


pendingDrawerOverlay.addEventListener(
    "click",
    closePendingDrawer
);

function mergeLetterboxdSync(
    oldMovies,
    newMovies,
    diary,
    reviews
) {
    const oldByUri =
        new Map(
            oldMovies.map(movie => [
                movie.letterboxdUri,
                movie
            ])
        );


    const loggedUris =
        new Set();


    for (const item of diary) {
        const uri =
            item["Letterboxd URI"];

        if (uri) {
            loggedUris.add(uri);
        }
    }


    for (const item of reviews) {
        const uri =
            item["Letterboxd URI"];

        if (uri) {
            loggedUris.add(uri);
        }
    }


    return newMovies.map(newMovie => {
        const oldMovie =
            oldByUri.get(
                newMovie.letterboxdUri
            );


        if (!oldMovie) {
            return newMovie;
        }


        const loggedOnLetterboxd =
            loggedUris.has(
                newMovie.letterboxdUri
            );


        return {
            ...newMovie,

            metadata:
                oldMovie.metadata
                ?? newMovie.metadata
                ?? null,

            localWatched:
                oldMovie.localWatched
                ?? false,

            pendingLetterboxdLog:
                loggedOnLetterboxd
                    ? false
                    : oldMovie.pendingLetterboxdLog
                      ?? false,

            letterboxdLogged:
                loggedOnLetterboxd
                    ? true
                    : oldMovie.letterboxdLogged
                      ?? false
        };
    });
}