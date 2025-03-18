import { BlogMeta } from '@/app/common/types';

export interface BlogIndexData {
  titleIndex: Map<string, Set<string>>;  // word -> blogIds
  contentIndex: Map<string, Set<string>>; // word -> blogIds
  categoryIndex: Map<string, Set<string>>; // category -> blogIds
  tagIndex: Map<string, Set<string>>;     // tag -> blogIds
}

export class BlogIndex {
  private titleIndex: Map<string, Set<string>> = new Map();
  private contentIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  // 重建索引
  rebuild(blogs: Record<string, BlogMeta>): void {
    this.clear();
    
    for (const [id, blog] of Object.entries(blogs)) {
      this.addBlog(id, blog);
    }
  }

  // 添加单个博客到索引
  addBlog(id: string, blog: BlogMeta): void {
    // 标题索引
    const titleWords = blog.title.toLowerCase().split(/\W+/);
    titleWords.forEach(word => {
      if (!word) return;
      if (!this.titleIndex.has(word)) {
        this.titleIndex.set(word, new Set());
      }
      this.titleIndex.get(word)!.add(id);
    });

    // 分类索引
    blog.categories?.forEach(category => {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category)!.add(id);
    });

    // 标签索引
    blog.tags?.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    });
  }

  // 从索引中移除博客
  removeBlog(id: string, blog: BlogMeta): void {
    // 从标题索引中移除
    const titleWords = blog.title.toLowerCase().split(/\W+/);
    titleWords.forEach(word => {
      if (!word) return;
      const ids = this.titleIndex.get(word);
      if (ids) {
        ids.delete(id);
        if (ids.size === 0) {
          this.titleIndex.delete(word);
        }
      }
    });

    // 从分类索引中移除
    blog.categories?.forEach(category => {
      const ids = this.categoryIndex.get(category);
      if (ids) {
        ids.delete(id);
        if (ids.size === 0) {
          this.categoryIndex.delete(category);
        }
      }
    });

    // 从标签索引中移除
    blog.tags?.forEach(tag => {
      const ids = this.tagIndex.get(tag);
      if (ids) {
        ids.delete(id);
        if (ids.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  // 更新博客索引
  updateBlog(id: string, oldBlog: BlogMeta, newBlog: BlogMeta): void {
    this.removeBlog(id, oldBlog);
    this.addBlog(id, newBlog);
  }

  // 搜索博客
  search(query: string): Set<string> {
    const words = query.toLowerCase().split(/\W+/).filter(Boolean);
    let result: Set<string> | null = null;

    words.forEach(word => {
      const titleMatches = this.titleIndex.get(word) || new Set();
      const contentMatches = this.contentIndex.get(word) || new Set();
      const matches = new Set([...titleMatches, ...contentMatches]);

      if (result === null) {
        result = matches;
      } else {
        // 交集
        result = new Set([...result].filter(x => matches.has(x)));
      }
    });

    return result || new Set();
  }

  // 按分类搜索
  searchByCategories(categories: string[]): Set<string> {
    let result: Set<string> | null = null;

    categories.forEach(category => {
      const matches = this.categoryIndex.get(category) || new Set();

      if (result === null) {
        result = new Set(matches);
      } else {
        // 并集
        matches.forEach(id => result!.add(id));
      }
    });

    return result || new Set();
  }

  // 按标签搜索
  searchByTags(tags: string[]): Set<string> {
    let result: Set<string> | null = null;

    tags.forEach(tag => {
      const matches = this.tagIndex.get(tag) || new Set();

      if (result === null) {
        result = new Set(matches);
      } else {
        // 并集
        matches.forEach(id => result!.add(id));
      }
    });

    return result || new Set();
  }

  // 清空索引
  clear(): void {
    this.titleIndex.clear();
    this.contentIndex.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
  }
} 