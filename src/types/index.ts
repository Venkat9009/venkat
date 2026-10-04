export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  published: boolean;
  cover_image?: string;
  tags?: string[];
  mood?: string;
  series?: string;
  word_count?: number;
  reading_time?: number;
  view_count?: number;
  like_count?: number;
  createdAt: string;
  updatedAt: string;
}

// List view never needs full content/word counts — derive from Article so
// the two stay in sync. No runtime change.
export type ArticleListItem = Pick<
  Article,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "category"
  | "published"
  | "cover_image"
  | "tags"
  | "mood"
  | "series"
  | "view_count"
  | "like_count"
  | "createdAt"
>;

// Journal + previews need content/word counts on top of the list shape.
// Reuse instead of inline intersections.
export type ArticleWithContent = ArticleListItem & Pick<Article, "content" | "word_count">;

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface SiteStats {
  totalArticles: number;
  totalWords: number;
  totalReadingTime: number;
  daysActive: number;
  categories: string[];
}

