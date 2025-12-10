import { NextRequest, NextResponse } from 'next/server';

/**
 * API 代理路由
 * 将所有 /api/* 请求转发到后端 API 服务器
 * 
 * 环境变量:
 *  - API_BASE_URL: 后端 API 服务器地址 (默认: http://localhost:8080/api)
 * 
 * 示例:
 *  前端请求: /api/posts
 *  转发到: ${API_BASE_URL}/posts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

/**
 * 通用请求处理函数
 * @param request - Next.js 请求对象
 * @param context - 路由上下文，包含 params
 */
async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { path } = await context.params;
    const pathname = path.join('/');
    
    // 构建完整的后端 URL（包含 query parameters）
    const url = new URL(request.url);
    const backendUrl = `${API_BASE_URL}/${pathname}${url.search}`;
    
    console.log(`[API Proxy] ${request.method} ${pathname}${url.search} -> ${backendUrl}`);
    
    // 准备请求头
    const headers = new Headers();
    
    // 复制重要的请求头
    const headersToForward = [
      'content-type',
      'authorization',
      'cookie',
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding',
    ];
    
    headersToForward.forEach((headerName) => {
      const value = request.headers.get(headerName);
      if (value) {
        headers.set(headerName, value);
      }
    });
    
    // 准备请求选项
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    
    // 对于 POST/PUT/PATCH/DELETE 请求，处理请求体
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type');
        
        // 检查是否是文件上传（multipart/form-data）
        if (contentType?.includes('multipart/form-data')) {
          // 对于文件上传，直接使用原始的 body
          // 不要手动设置 content-type，让浏览器自动设置 boundary
          const formData = await request.formData();
          fetchOptions.body = formData as any;
          // 移除 content-type，让 fetch 自动设置正确的 boundary
          headers.delete('content-type');
        } else {
          // 对于普通请求，读取文本内容
          const body = await request.text();
          if (body) {
            fetchOptions.body = body;
          }
        }
      } catch (error) {
        console.error('[API Proxy] Error reading request body:', error);
      }
    }
    
    // 发送请求到后端
    const response = await fetch(backendUrl, fetchOptions);
    
    // 读取响应
    const data = await response.text();
    
    // 准备响应头
    const responseHeaders = new Headers();
    
    // 复制重要的响应头
    const responseHeadersToForward = [
      'content-type',
      'cache-control',
      'set-cookie',
    ];
    
    responseHeadersToForward.forEach((headerName) => {
      const value = response.headers.get(headerName);
      if (value) {
        responseHeaders.set(headerName, value);
      }
    });
    
    // 返回响应
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    
    // 返回详细的错误信息
    return NextResponse.json(
      { 
        error: 'API proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
        backend_url: API_BASE_URL,
      },
      { status: 502 }
    );
  }
}

// 导出所有 HTTP 方法的处理函数
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const HEAD = handleRequest;
export const OPTIONS = handleRequest;
