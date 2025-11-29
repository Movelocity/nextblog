/**
 * React Hooks 示例
 * 使用 API 客户端的 React Hooks
 */

import { useState, useEffect } from 'react';
import api from './api-client';

/**
 * 使用文章列表
 */
export const usePosts = (page = 1, pageSize = 10, published = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const result = await api.posts.getAll(page, pageSize, published);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, pageSize, published]);

  return { data, loading, error };
};

/**
 * 使用单篇文章
 */
export const usePost = (id: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const result = await api.posts.getById(id);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  return { data, loading, error };
};

/**
 * 使用分类列表
 */
export const useCategories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const result = await api.categories.getAll();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { data, loading, error };
};

/**
 * 使用标签列表
 */
export const useTags = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const result = await api.tags.getAll();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { data, loading, error };
};

/**
 * 使用图片上传
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      const result = await api.images.upload(file);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};

/**
 * React 组件使用示例
 */

// 示例 1: 文章列表组件
export const PostList = () => {
  const { data, loading, error } = usePosts(1, 10, true);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data?.posts) return <div>暂无文章</div>;

  return (
    <div>
      <h1>文章列表</h1>
      {data.posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
          <div>
            分类: {post.categories.join(', ')}
            {' | '}
            标签: {post.tags.join(', ')}
          </div>
        </div>
      ))}
      <div>
        第 {data.page} 页，共 {data.totalPages} 页
      </div>
    </div>
  );
};

// 示例 2: 文章详情组件
export const PostDetail = ({ postId }: { postId: string }) => {
  const { data: post, loading, error } = usePost(postId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!post) return <div>文章不存在</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div>
        <span>创建时间: {new Date(post.createdAt).toLocaleString()}</span>
        {' | '}
        <span>更新时间: {new Date(post.updatedAt).toLocaleString()}</span>
      </div>
      <div>
        分类: {post.categories.map(cat => (
          <span key={cat} style={{ marginRight: '8px' }}>{cat}</span>
        ))}
      </div>
      <div>
        标签: {post.tags.map(tag => (
          <span key={tag} style={{ marginRight: '8px' }}>{tag}</span>
        ))}
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
};

// 示例 3: 图片上传组件
export const ImageUploader = () => {
  const { upload, uploading, error } = useImageUpload();
  const [imageUrl, setImageUrl] = useState(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await upload(file);
      setImageUrl(result.url);
      alert('上传成功！');
    } catch (err) {
      alert('上传失败：' + err.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <div>上传中...</div>}
      {error && <div>错误: {error.message}</div>}
      {imageUrl && (
        <div>
          <p>图片 URL: {imageUrl}</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '400px' }} />
        </div>
      )}
    </div>
  );
};

// 示例 4: 分类标签侧边栏
export const CategoryTagSidebar = () => {
  const { data: categories, loading: catLoading } = useCategories();
  const { data: tags, loading: tagLoading } = useTags();

  if (catLoading || tagLoading) return <div>加载中...</div>;

  return (
    <aside>
      <div>
        <h3>分类</h3>
        <ul>
          {categories.map((category) => (
            <li key={category.name}>
              {category.name} ({category.count})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>标签</h3>
        <ul>
          {tags.map((tag) => (
            <li key={tag.name}>
              {tag.name} ({tag.count})
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

