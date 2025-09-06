export type UUID = string;

export type Timestamp = string | null;

export type News = {
  id: UUID;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  slug: string | null;
  image_url: string | null;
  published_at: Timestamp;
  created_by: UUID | null;
  created_at: string | null;
  updated_at: string | null;
};

export type NewsAZ = Omit<News, "id"> & { id: UUID };

export type Project = {
  id: UUID;
  title: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  published_at: Timestamp;
  created_by: UUID | null;
  created_at: string | null;
  updated_at: string | null;
  slug: string | null;
};

export type ProjectAZ = Project;

export type Event = {
  id: UUID;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
  published_at: Timestamp;
  created_by: UUID | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EventAZ = Event; 