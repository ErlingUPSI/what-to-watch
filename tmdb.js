const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";


async function searchTmdbMovie(
    title,
    year
) {
    const params =
        new URLSearchParams({
            action: "search",
            query: title
        });


    if (year) {
        params.set(
            "year",
            year
        );
    }


    const response =
        await fetch(
            `/.netlify/functions/tmdb?${params}`
        );


    if (!response.ok) {
        throw new Error(
            `TMDB search failed: ${response.status}`
        );
    }


    const data =
        await response.json();


    return data.results;
}

async function getTmdbMovieDetails(
    tmdbId
) {
    const params =
        new URLSearchParams({
            action: "details",
            id: tmdbId
        });


    const response =
        await fetch(
            `/.netlify/functions/tmdb?${params}`
        );


    if (!response.ok) {
        throw new Error(
            `TMDB details failed: ${response.status}`
        );
    }


    return await response.json();
}
function getDirector(movieDetails) {
    const director = movieDetails.credits?.crew?.find(
        person => person.job === "Director"
    );

    return director?.name ?? null;
}


function normalizeTmdbMovie(details) {
    return {
        tmdbId: details.id,

        poster: details.poster_path
            ? `${TMDB_IMAGE_URL}${details.poster_path}`
            : null,

        runtime: details.runtime ?? null,

        genres: details.genres?.map(
            genre => genre.name
        ) ?? [],

        director: getDirector(details),

        keywords:
            details.keywords?.keywords?.map(
                keyword => keyword.name
            ) ?? [],

        overview: details.overview ?? "",

        originalLanguage:
            details.original_language ?? null
    };
}