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

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published: boolean;
  cover_image?: string;
  tags?: string[];
  mood?: string;
  series?: string;
  view_count?: number;
  like_count?: number;
  createdAt: string;
}

export interface SiteStats {
  totalArticles: number;
  totalWords: number;
  totalReadingTime: number;
  daysActive: number;
  categories: string[];
}

