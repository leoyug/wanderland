export type AiStatus = "complete" | "pending" | "failed";

export interface InspirationItem {
  id: string;
  title: string;
  siteHost: string;
  description: string;
  url: string;
  channelIds: string[];
  tags: string[];
  note: string;
  savedAt: string;
  aiStatus: AiStatus;
  cover: {
    background: string;
    foreground: string;
    label: string;
    motif: "type" | "grid" | "orb";
    image?: string;
  };
  siteIcon?: string;
}

export interface Channel {
  id: string;
  name: string;
  count: number;
  color: string;
  group: "网页" | "文章" | "关注";
}
