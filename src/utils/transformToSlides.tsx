import type { VideoSrc } from "@/types/VideoSrc";

interface RawEpisode {
  id: number;
  url: string;
  name: string;
  airstamp?: string; // Added airstamp field
  show: {
    id: number;
    name: string;
    summary: string | null;
    image: {
      medium: string;
      original: string;
    } | null;
    url: string;
  };
}

export function transformEpisodesToSlides(
  episodes: RawEpisode[],
  maxSlides: number
): VideoSrc[] {
  return episodes
    .slice(0, maxSlides)
    .map((ep) => {
      const show = ep.show;
      if (!show?.image?.original) return null; // Skip if there's no image

      // Convert ep.airstamp to local date and time string
      let highlight = "";
      let release_date = "";
      if (ep.airstamp) {
        const date = new Date(ep.airstamp);
        highlight = date.toLocaleString();
        release_date = date.toISOString().split("T")[0];
      }

      return {
        id: show.id,
        title: `${show.name}${ep.name ? `: ${ep.name}` : ''}`,
        description: stripHtml(show.summary) || "",
        backdrop_image: show.image.original,
        potrait_image: show.image.medium,
        release_date,
        popularity: undefined,
        vote_average: undefined,
        vote_count: undefined,
        casts: [],
      } as VideoSrc;
    })
    .filter(Boolean) as VideoSrc[];
}

// Simple HTML tag remover
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

