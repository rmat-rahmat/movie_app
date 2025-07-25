export const getMovies = async (number: number) => {
    const res = await fetch(`https://jsonfakery.com/movies/random/${number}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch top-rated movies');
    return res.json();
}