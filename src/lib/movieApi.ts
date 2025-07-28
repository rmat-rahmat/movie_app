import { transformEpisodesToSlides } from "@/utils/transformToSlides";
import { parseStringPromise } from 'xml2js';
import { NextRequest, NextResponse } from "next/server";
import { on } from "events";
import type { ShortVideo } from "@/types/ShortVideo";

export const getMovies = async (number: number) => {
    const res = await fetch(`https://jsonfakery.com/movies/random/${number}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch top-rated movies');
    return res.json();
}

export const getSeries = async (country: string) => {
    const res = await fetch(`https://api.tvmaze.com/schedule?country=${country}`, { cache: 'default' });
    if (!res.ok) throw new Error('Failed to fetch top-rated series');
    const episodes = await res.json();
    return transformEpisodesToSlides(episodes, 10);
}   
export const getShort = async (channel_id: string,limit: number): Promise<ShortVideo[]> => {
  const corsProxy = "https://corsproxy.io/?";
  const feedUrl = corsProxy + encodeURIComponent("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel_id);

  const res = await fetch(feedUrl);
  const xmlText = await res.text();
  const parsed = await parseStringPromise(xmlText);

  const entries = parsed.feed.entry || [];

  const mockMovies: ShortVideo[] = entries.slice(0, limit).map((entry: any, index: number) => {
    const id = entry['yt:videoId'][0];
    const title = entry.title[0];
    const description = entry['media:group'][0]['media:description'][0];
    const videoId = entry['yt:videoId'][0];
    const publishDate = entry.published[0];
    const popularity = entry['media:group'][0]['media:community'][0]['media:statistics'][0].$.views || "0";
    const vote_count = entry['media:group'][0]['media:community'][0]['media:starRating'][0].$.count || "0";
    const vote_average = entry['media:group'][0]['media:community'][0]['media:starRating'][0].$.average || "0";

//     <media:community>
// <media:starRating count="119" average="5.00" min="1" max="5"/>
// <media:statistics views="8147"/>
// </media:community>

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id,
      original_title: title,
      description,
      overview: description,
      release_date: new Date(publishDate).toISOString().split("T")[0],
      backdrop_path: thumbnail,
      poster_path: thumbnail,
      vote_average: vote_average ? parseFloat(vote_average) : 0,
      vote_count: vote_count ? parseInt(vote_count, 10) : 0,
      popularity: popularity,
      casts: [
        // {
        //   id: `cast-${index}`,
        //   name: "YouTube Creator",
        //   character: "Main",
        //   profile_path: `https://i.pravatar.cc/150?img=${index + 1}`
        // }
      ]
    };
  });
console.log(mockMovies);
  return mockMovies;
};
