function ratingToWeight(rating) {
    return (rating - 2.5) / 2.5;
}
function addTasteValue(storage, key, value) {
    if (!key) {
        return;
    }

    if (!storage[key]) {
        storage[key] = {
            total: 0,
            count: 0
        };
    }

    storage[key].total += value;
    storage[key].count += 1;
}
function finalizeTasteCategory(storage) {
    const result = {};

    for (const [key, data] of Object.entries(storage)) {
        const average = data.total / data.count;

        const confidence = Math.min(
            data.count / 5,
            1
        );

        result[key] = {
            score: average * confidence,
            average,
            count: data.count
        };
    }

    return result;
}
function buildTasteProfile(movies) {
    const genres = {};
    const directors = {};
    const decades = {};
    const languages = {};

    const ratedMovies = movies.filter(
        movie =>
            movie.rating !== null &&
            movie.metadata
    );

    let runtimeTotal = 0;
    let runtimeCount = 0;

    for (const movie of ratedMovies) {
        const weight =
            ratingToWeight(movie.rating);

        const metadata = movie.metadata;

        for (const genre of metadata.genres ?? []) {
            addTasteValue(
                genres,
                genre,
                weight
            );
        }

        if (metadata.director) {
            addTasteValue(
                directors,
                metadata.director,
                weight
            );
        }

        const decade =
            `${Math.floor(movie.year / 10) * 10}s`;

        addTasteValue(
            decades,
            decade,
            weight
        );

        if (metadata.originalLanguage) {
            addTasteValue(
                languages,
                metadata.originalLanguage,
                weight
            );
        }

        if (
            metadata.runtime &&
            weight > 0
        ) {
            runtimeTotal += metadata.runtime * weight;
            runtimeCount += weight;
        }
    }

    return {
        genres:
            finalizeTasteCategory(genres),

        directors:
            finalizeTasteCategory(directors),

        decades:
            finalizeTasteCategory(decades),

        languages:
            finalizeTasteCategory(languages),

        preferredRuntime:
            runtimeCount > 0
                ? runtimeTotal / runtimeCount
                : null,

        ratedMoviesCount:
            ratedMovies.length
    };
}
function scoreMovieByTaste(movie, taste) {
    if (!movie.metadata) {
        return null;
    }

    let score = 0;
    let weightSum = 0;

    const metadata = movie.metadata;


    // GENRES
    const genreScores = [];

    for (const genre of metadata.genres ?? []) {
        const genreData = taste.genres[genre];

        if (genreData) {
            genreScores.push(genreData.score);
        }
    }

    if (genreScores.length > 0) {
        const genreScore =
            genreScores.reduce((sum, value) => sum + value, 0)
            / genreScores.length;

        score += genreScore * 4;
        weightSum += 4;
    }


    // DIRECTOR
    if (metadata.director) {
        const directorData =
            taste.directors[metadata.director];

        if (directorData) {
            score += directorData.score * 3;
            weightSum += 3;
        }
    }


    // DECADE
    const decade =
        `${Math.floor(movie.year / 10) * 10}s`;

    const decadeData =
        taste.decades[decade];

    if (decadeData) {
        score += decadeData.score * 1;
        weightSum += 1;
    }


    // LANGUAGE
    if (metadata.originalLanguage) {
        const languageData =
            taste.languages[metadata.originalLanguage];

        if (languageData) {
            score += languageData.score * 0.5;
            weightSum += 0.5;
        }
    }


    // RUNTIME
    if (
        metadata.runtime &&
        taste.preferredRuntime
    ) {
        const difference =
            Math.abs(
                metadata.runtime -
                taste.preferredRuntime
            );

        // 0 минут разницы -> 1
        // 60 минут разницы -> примерно 0.5
        // 120 минут -> 0

        const runtimeScore =
            Math.max(
                0,
                1 - difference / 120
            );

        score += runtimeScore * 1;
        weightSum += 1;
    }


    if (weightSum === 0) {
        return 0;
    }

    return score / weightSum;
}
function rankWatchlistByTaste(movies, taste) {
    return movies
        .filter(
            movie =>
                movie.inWatchlist &&
                movie.metadata
        )
        .map(movie => ({
            movie,
            tasteScore:
                scoreMovieByTaste(movie, taste)
        }))
        .filter(
            item => item.tasteScore !== null
        )
        .sort(
            (a, b) =>
                b.tasteScore - a.tasteScore
        );
}
function tasteScoreToPercent(score) {
    const normalized =
        (score + 1) / 2;

    return Math.round(
        Math.max(
            0,
            Math.min(1, normalized)
        ) * 100
    );
}
function explainTasteScore(movie, taste) {
    const reasons = [];

    if (!movie.metadata) {
        return reasons;
    }

    const metadata = movie.metadata;


    for (const genre of metadata.genres ?? []) {
        const data = taste.genres[genre];

        if (data?.score > 0.4) {
            reasons.push(
                `You tend to like ${genre}`
            );
        }
    }


    if (metadata.director) {
        const data =
            taste.directors[metadata.director];

        if (data?.score > 0.4) {
            reasons.push(
                `You rate ${metadata.director} highly`
            );
        }
    }


    const decade =
        `${Math.floor(movie.year / 10) * 10}s`;

    if (taste.decades[decade]?.score > 0.4) {
        reasons.push(
            `${decade} films work well for you`
        );
    }


    if (
        metadata.runtime &&
        taste.preferredRuntime
    ) {
        const difference =
            Math.abs(
                metadata.runtime -
                taste.preferredRuntime
            );

        if (difference <= 20) {
            reasons.push(
                `Runtime is close to your usual preference`
            );
        }
    }


    return reasons.slice(0, 3);
}