const TMDB_BASE_URL =
    "https://api.themoviedb.org/3";


export default async function handler(req) {
    try {
        const url =
            new URL(req.url);

        const action =
            url.searchParams.get("action");

        const apiKey =
            process.env.TMDB_API_KEY;


        if (!apiKey) {
            return Response.json(
                {
                    error:
                        "TMDB API key is not configured"
                },
                {
                    status: 500
                }
            );
        }


        if (action === "search") {
            const query =
                url.searchParams.get("query");

            const year =
                url.searchParams.get("year");


            if (!query) {
                return Response.json(
                    {
                        error:
                            "Missing query"
                    },
                    {
                        status: 400
                    }
                );
            }


            const params =
                new URLSearchParams({
                    api_key: apiKey,
                    query
                });


            if (year) {
                params.set(
                    "year",
                    year
                );
            }


            const response =
                await fetch(
                    `${TMDB_BASE_URL}/search/movie?${params}`
                );


            const data =
                await response.json();


            return Response.json(
                data,
                {
                    status:
                        response.status
                }
            );
        }


        if (action === "details") {
            const id =
                url.searchParams.get("id");


            if (!id) {
                return Response.json(
                    {
                        error:
                            "Missing movie id"
                    },
                    {
                        status: 400
                    }
                );
            }


            const params =
                new URLSearchParams({
                    api_key: apiKey,
                    append_to_response:
                        "credits,keywords"
                });


            const response =
                await fetch(
                    `${TMDB_BASE_URL}/movie/${id}?${params}`
                );


            const data =
                await response.json();


            return Response.json(
                data,
                {
                    status:
                        response.status
                }
            );
        }


        return Response.json(
            {
                error:
                    "Unknown action"
            },
            {
                status: 400
            }
        );
    }

    catch (error) {
        console.error(error);

        return Response.json(
            {
                error:
                    "TMDB proxy failed"
            },
            {
                status: 500
            }
        );
    }
}