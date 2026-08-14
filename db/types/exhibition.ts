export type ExhibitionStatus = "upcoming" | "ongoing" | "ended";

export type ContentSource = {
  label: string;
  url: string;
  accessedAt: string;
};

export type ExhibitionSeed = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  theme: string;
  summary: string;
  description: string;
  nature: string;
  venue: string;
  address: string;
  startDate: string;
  endDate: string;
  operatingHours?: string;
  status: ExhibitionStatus;
  artists: string[];
  audiences: string[];
  tags: string[];
  keyMessage: string;
  featuredQuote?: string;
  floorMap: Array<{
    floor: string;
    description: string;
  }>;
  directionPrinciples: string[];
  source: ContentSource;
};

export type ArtworkSeed = {
  id: string;
  exhibitionId: string;
  slug: string;
  title: string;
  artistName: string;
  imageUrl?: string;
  collaborator?: string;
  series?: string;
  type: string;
  form?: string;
  material?: string;
  location: string;
  summary: string;
  description: string;
  titleMeaning?: string;
  interpretation: string;
  viewingTips: string[];
  keywords: string[];
  tmi: string[];
  facts: string[];
  contents?: string[];
  displayOrder: number;
  source: ContentSource;
};
