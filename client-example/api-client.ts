/**
 * Next Blog API Client
 * TypeScript/JavaScript 客户端库，用于与 Go 后端通信
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

/**
 * HTTP 请求工具函数
 */
const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * 文章相关 API
 */
export const postsApi = {
  /**
   * 获取文章列表
   */
  getAll: (page = 1, pageSize = 10, published = true) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      published: String(published),
    });
    return request(`/posts?${params}`);
  },

  /**
   * 获取文章详情
   */
  getById: (id: string) => {
    return request(`/posts/${id}`);
  },

  /**
   * 创建文章
   */
  create: (data: {
    title: string;
    content: string;
    description?: string;
    published?: boolean;
    categories?: string[];
    tags?: string[];
  }) => {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新文章
   */
  update: (id: string, data: {
    title?: string;
    content?: string;
    description?: string;
    published?: boolean;
    categories?: string[];
    tags?: string[];
  }) => {
    return request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除文章
   */
  delete: (id: string) => {
    return request(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 搜索文章
   */
  search: (keyword: string, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      keyword,
      page: String(page),
      pageSize: String(pageSize),
    });
    return request(`/posts/search?${params}`);
  },

  /**
   * 按分类获取文章
   */
  getByCategory: (category: string, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return request(`/posts/category/${category}?${params}`);
  },

  /**
   * 按标签获取文章
   */
  getByTag: (tag: string, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return request(`/posts/tag/${tag}?${params}`);
  },
};

/**
 * 笔记相关 API
 */
export const notesApi = {
  /**
   * 获取所有笔记
   */
  getAll: () => {
    return request('/notes');
  },

  /**
   * 获取指定日期的笔记
   */
  getByDate: (date: string) => {
    return request(`/notes/date/${date}`);
  },

  /**
   * 获取笔记详情
   */
  getById: (id: string) => {
    return request(`/notes/detail/${id}`);
  },

  /**
   * 获取公开笔记
   */
  getPublic: () => {
    return request('/notes/public');
  },

  /**
   * 创建笔记
   */
  create: (data: {
    data: string;
    date?: string;
    isPublic?: boolean;
    tags?: string[];
  }) => {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新笔记
   */
  update: (id: string, data: {
    data?: string;
    date?: string;
    isPublic?: boolean;
    tags?: string[];
  }) => {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除笔记
   */
  delete: (id: string) => {
    return request(`/notes/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * 分类相关 API
 */
export const categoriesApi = {
  /**
   * 获取所有分类
   */
  getAll: () => {
    return request('/categories');
  },

  /**
   * 获取分类详情
   */
  getByName: (name: string) => {
    return request(`/categories/${name}`);
  },
};

/**
 * 标签相关 API
 */
export const tagsApi = {
  /**
   * 获取所有标签
   */
  getAll: () => {
    return request('/tags');
  },

  /**
   * 获取标签详情
   */
  getByName: (name: string) => {
    return request(`/tags/${name}`);
  },
};

/**
 * 图片相关 API
 */
export const imagesApi = {
  /**
   * 上传图片
   */
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      body: formData,
      // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
    });

    if (!response.ok) {
      throw new Error(`Upload failed! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 获取图片列表
   */
  getAll: () => {
    return request('/images');
  },

  /**
   * 获取图片 URL
   */
  getUrl: (filename: string) => {
    return `${API_BASE_URL}/images/${filename}`;
  },

  /**
   * 删除图片
   */
  delete: (filename: string) => {
    return request(`/images/${filename}`, {
      method: 'DELETE',
    });
  },
};

/**
 * 站点配置相关 API
 */
export const configApi = {
  /**
   * 获取站点配置
   */
  get: () => {
    return request('/config');
  },

  /**
   * 更新站点配置
   */
  update: (data: {
    siteName?: string;
    siteDescription?: string;
    icpInfo?: string;
  }) => {
    return request('/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/**
 * 健康检查
 */
export const healthApi = {
  check: () => {
    return request('/health');
  },
};

/**
 * 默认导出所有 API
 */
export default {
  posts: postsApi,
  notes: notesApi,
  categories: categoriesApi,
  tags: tagsApi,
  images: imagesApi,
  config: configApi,
  health: healthApi,
};

