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
// interface Slide {
//   id: number;
//   image: string;
//   title: string;
//   description: string;
//   highlight?: string;
//   navigation?: ButtonLink;
// }
interface ButtonLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function transformEpisodesToSlides(
  episodes: RawEpisode[],
  maxSlides: number
): [] {
  return episodes
    .slice(0, maxSlides)
    .map((ep) => {
      const show = ep.show;
      if (!show?.image?.original) return null; // Skip if there's no image

      // Convert ep.airstamp to local date and time string
      let highlight = "";
      if (ep.airstamp) {
        const date = new Date(ep.airstamp);
        highlight = date.toLocaleString();
      }

      return {
        id: show.id,
        image: show.image.original,
        title: `${show.name} ${ep.name ? `: ${ep.name}` : ''}`,
        description: stripHtml(show.summary) || "",
        highlight, // Add highlight field
        navigation: {
          href: show.url,
          label: "View Show",
          icon: null, // Set a React icon here if needed
        },
      };
    })
    .filter(Boolean) as [];
}

// Simple HTML tag remover
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

