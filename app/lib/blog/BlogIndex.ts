import { BlogMeta } from '@/app/common/types';

export interface BlogIndexData {
  titleIndex: Map<string, Set<string>>;  // word -> blogIds
  categoryIndex: Map<string, Set<string>>; // category -> blogIds
  tagIndex: Map<string, Set<string>>;     // tag -> blogIds
}

/**
 * 博客索引
 * 
 * 博客索引是博客管理系统的核心组件，负责处理博客索引的构建和搜索。
 * 主要目的是减少硬盘读取次数，提高加载效率。
 * 它提供了以下功能：
 * 1. 重建索引
 * 2. 添加博客到索引
 * 3. 从索引中移除博客
 * 4. 更新博客索引
 * 5. 搜索博客
 * 6. 按分类搜索
 * 7. 按标签搜索
 * 8. 清空索引
 */
export class BlogIndex {
  private titleIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * 重建索引
   * 
   * 重建索引，清除现有索引并重新构建。
   */
  rebuild(blogs: Record<string, BlogMeta>): void {
    this.clear();
    
    for (const [id, blog] of Object.entries(blogs)) {
      this.addBlog(id, blog);
    }
  }

  /**
   * 添加单个博客到索引，将博客的标题、分类和标签添加到索引中。
   */
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

  /**
   * 将博客的标题、分类和标签从索引中移除。
   */
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

  /**
   * 将博客的标题、分类和标签从索引中移除，并添加新的博客。
   */
  updateBlog(id: string, oldBlog: BlogMeta, newBlog: BlogMeta): void {
    this.removeBlog(id, oldBlog);
    this.addBlog(id, newBlog);
  }

  /**
   * 搜索博客，返回符合条件的博客ID集合。
   */
  search(query: string): Set<string> {
    const words = query.toLowerCase().split(/\W+/).filter(Boolean);
    let result: Set<string> | null = null;

    // 按标题搜索
    words.forEach(word => {
      const titleMatches = this.titleIndex.get(word) || new Set<string>();
      const matches = new Set<string>([...titleMatches]);
      if (result === null) {
        result = matches;
      } else { // 交集
        result = new Set<string>([...result].filter((x: string) => matches.has(x)));
      }
    });

    const finalResult: Set<string> = result || new Set<string>();
    return finalResult;
  }

  /**
   * 按分类搜索，返回符合条件的博客ID集合。
   */
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

  /**
   * 按标签搜索，返回符合条件的博客ID集合。
   */
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

  /**
   * 清除所有索引。
   */
  clear(): void {
    this.titleIndex.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
  }
} 