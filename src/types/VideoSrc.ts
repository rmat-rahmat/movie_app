export interface VideoSrc {
  id: number | string;
  title: string;
  description: string;
  backdrop_image?: string;
  potrait_image?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  casts?: {
    id: string | number;
    name: string;
    character?: string;
    profile_image?: string;
  }[];
}