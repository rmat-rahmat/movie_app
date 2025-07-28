export interface ShortVideo {
  id: number;
  backdrop_path: string;
  poster_path: string;
  original_title: string;
  description: string;
  overview: string;
  release_date: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  casts?: {
    id: string;
    name: string;
    character: string;
    profile_path: string;
  }[];
}