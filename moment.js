function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}


function inferMovieTraits(movie) {
    const metadata = movie.metadata;

    if (!metadata) {
        return null;
    }

    const genres = new Set(
        (metadata.genres ?? []).map(
            genre => genre.toLowerCase()
        )
    );

    const keywords = new Set(
        (metadata.keywords ?? []).map(
            keyword => keyword.toLowerCase()
        )
    );


    const traits = {
        lightness: 0.5,
        energy: 0.5,
        tension: 0.5,
        complexity: 0.5,
        weirdness: 0.3,

        comedy: 0,
        emotional: 0.4
    };


    // COMEDY

    if (genres.has("comedy")) {
        traits.comedy += 0.6;
        traits.lightness += 0.15;
    }
    if (
        genres.has("comedy") &&
        genres.has("animation")
    ) {
        traits.comedy += 0.2;
        traits.lightness += 0.2;
    }
    if (
        genres.has("comedy") &&
        genres.has("drama")
    ) {
        traits.lightness -= 0.1;
    }
    // HORROR / THRILLER

    if (genres.has("horror")) {
        traits.tension += 0.4;
        traits.lightness -= 0.3;
    }

    if (genres.has("thriller")) {
        traits.tension += 0.35;
        traits.energy += 0.15;
    }


    // ACTION

    if (genres.has("action")) {
        traits.energy += 0.35;
    }


    // DRAMA

    if (genres.has("drama")) {
        traits.emotional += 0.2;
        traits.lightness -= 0.1;
    }


    // ROMANCE

    if (genres.has("romance")) {
        traits.emotional += 0.25;
    }


    // MYSTERY

    if (genres.has("mystery")) {
        traits.complexity += 0.25;
        traits.tension += 0.1;
    }


    // SCIENCE FICTION

    if (genres.has("science fiction")) {
        traits.weirdness += 0.15;
        traits.complexity += 0.1;
    }


    // ANIMATION

    if (genres.has("animation")) {
        traits.lightness += 0.1;
    }


    // KEYWORDS

    const darkKeywords = [
        "murder",
        "serial killer",
        "death",
        "suicide",
        "revenge",
        "violence",
        "crime"
    ];

    const weirdKeywords = [
        "surrealism",
        "dream",
        "hallucination",
        "alternate reality",
        "time travel",
        "mind bending",
        "absurdism"
    ];

    const emotionalKeywords = [
        "family",
        "grief",
        "love",
        "friendship",
        "coming of age",
        "loss"
    ];
    const complexKeywords = [
        "satire",
        "existentialism",
        "identity",
        "psychological",
        "metaphor",
        "allegory",
        "philosophy",
        "nonlinear timeline",
        "multiple storylines",
        "surrealism",
        "dream",
        "hallucination",
        "mental illness",
        "obsession"
    ];

    for (const keyword of darkKeywords) {
        if (keywords.has(keyword)) {
            traits.lightness -= 0.08;
            traits.tension += 0.05;
        }
    }


    for (const keyword of weirdKeywords) {
        if (keywords.has(keyword)) {
            traits.weirdness += 0.12;
            traits.complexity += 0.06;
        }
    }


    for (const keyword of emotionalKeywords) {
        if (keywords.has(keyword)) {
            traits.emotional += 0.08;
        }
    }
    for (const keyword of complexKeywords) {
        if (keywords.has(keyword)) {
            traits.complexity += 0.1;
        }
    }

    // Runtime slightly affects perceived effort

    if (metadata.runtime >= 150) {
        traits.complexity += 0.1;
    }


    for (const key of Object.keys(traits)) {
        traits[key] = clamp01(traits[key]);
    }

    return traits;
}
function getMoodTarget(mood) {
    const moods = {

        relax: {
            target: {
                lightness: 0.85,
                energy: 0.3,
                tension: 0.1,
                complexity: 0.2
            },

            weights: {
                lightness: 3,
                tension: 3,
                complexity: 2,
                energy: 1
            }
        },

        tense: {
            target: {
                tension: 0.95,
                energy: 0.75,
                lightness: 0.2
            },

            weights: {
                tension: 4,
                energy: 2,
                lightness: 1
            }
        },

        funny: {
            target: {
                comedy: 1,
                lightness: 0.85,
                tension: 0.15,
                complexity: 0.25
            },

            weights: {
                comedy: 5,
                lightness: 2,
                tension: 1,
                complexity: 1
            }
        },

        emotional: {
            target: {
                emotional: 1,
                lightness: 0.4,
                energy: 0.4
            },

            weights: {
                emotional: 5,
                lightness: 1,
                energy: 1
            }
        },

        weird: {
            target: {
                weirdness: 1,
                complexity: 0.7
            },

            weights: {
                weirdness: 5,
                complexity: 2
            }
        },

        absorbing: {
            target: {
                tension: 0.7,
                energy: 0.65,
                complexity: 0.6,
                emotional: 0.6
            },

            weights: {
                tension: 2,
                energy: 2,
                complexity: 1,
                emotional: 1
            }
        }

    };

    return moods[mood] ?? null;
}
function compareTraits(
    movieTraits,
    moodDefinition
) {
    const targetTraits =
        moodDefinition.target;

    const weights =
        moodDefinition.weights;

    let weightedDifference = 0;
    let totalWeight = 0;


    for (
        const key of Object.keys(targetTraits)
    ) {
        const movieValue =
            movieTraits[key];

        const targetValue =
            targetTraits[key];

        if (movieValue === undefined) {
            continue;
        }

        const weight =
            weights[key] ?? 1;

        weightedDifference +=
            Math.abs(
                movieValue - targetValue
            ) * weight;

        totalWeight += weight;
    }


    if (totalWeight === 0) {
        return 0.5;
    }


    const averageDifference =
        weightedDifference / totalWeight;

    return clamp01(
        1 - averageDifference
    );
}
function getBrainScore(movieTraits, brainPower) {
    // brainPower приходит от 1 до 5

    const desiredComplexity =
        (brainPower - 1) / 4;

    return clamp01(
        1 -
        Math.abs(
            movieTraits.complexity -
            desiredComplexity
        )
    );
}
function fitsRuntime(movie, maxRuntime) {
    if (!maxRuntime) {
        return true;
    }

    if (!movie.metadata?.runtime) {
        return true;
    }

    return movie.metadata.runtime <= maxRuntime;
}
function scoreMovieByMoment(
    movie,
    preferences
) {
    const traits =
        inferMovieTraits(movie);

    if (!traits) {
        return null;
    }


    if (
        !fitsRuntime(
            movie,
            preferences.maxRuntime
        )
    ) {
        return null;
    }


    const selectedMoods =
        preferences.moods ?? [];


    let moodScore = 0.5;


    if (selectedMoods.length > 0) {
        const moodScores =
        selectedMoods
            .map(getMoodTarget)
            .filter(Boolean)
            .map(moodDefinition =>
                compareTraits(
                    traits,
                    moodDefinition
                )
            );


        const averageMoodScore =
            moodScores.reduce(
                (sum, value) => sum + value,
                0
            ) / moodScores.length;


        const weakestMoodScore =
            Math.min(...moodScores);


        // Фильм должен нормально соответствовать
        // всем выбранным желаниям, а не только одному.
        moodScore =
            averageMoodScore * 0.6 +
            weakestMoodScore * 0.4;
    }

    if (
        selectedMoods.includes("funny") &&
        traits.comedy < 0.3
    ) {
        moodScore *= 0.65;
    }
    if (
        selectedMoods.includes("tense") &&
        traits.tension < 0.4
    ) {
        moodScore *= 0.7;
    }

    const brainScore =
        getBrainScore(
            traits,
            preferences.brainPower
        );
    const adjustedBrainScore =
        Math.pow(brainScore, 1.7);


    const finalMomentScore =
        moodScore * 0.7 +
        adjustedBrainScore * 0.3;


    return clamp01(
        finalMomentScore
    );
}
function combineTasteAndMoment(
    tasteScore,
    momentScore,
    exploreLevel
) {
    // tasteScore у нас примерно -1 ... +1
    // переводим в 0 ... 1

    const normalizedTaste =
        clamp01(
            (tasteScore + 1) / 2
        );


    // exploreLevel:
    // 0 = Safe
    // 1 = Surprise me

    const tasteWeight =
        0.6 - exploreLevel * 0.35;

    const momentWeight =
        1 - tasteWeight;


    return (
        normalizedTaste * tasteWeight +
        momentScore * momentWeight
    );
}
function rankMoviesForMoment(
    movies,
    taste,
    preferences
) {
    return movies
        .filter(
            movie =>
                movie.inWatchlist &&
                movie.metadata
        )

        .map(movie => {

            const tasteScore =
                scoreMovieByTaste(
                    movie,
                    taste
                );

            const momentScore =
                scoreMovieByMoment(
                    movie,
                    preferences
                );


            if (
                tasteScore === null ||
                momentScore === null
            ) {
                return null;
            }


            const finalScore =
                combineTasteAndMoment(
                    tasteScore,
                    momentScore,
                    preferences.exploreLevel
                );


            return {
                movie,
                tasteScore,
                momentScore,
                finalScore
            };
        })

        .filter(Boolean)

        .sort(
            (a, b) =>
                b.finalScore -
                a.finalScore
        );
}