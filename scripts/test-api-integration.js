#!/usr/bin/env node

/**
 * API 集成测试脚本
 * 测试前端是否正确连接到 Go 后端 API
 * 
 * 使用方法:
 * 1. 确保 Go 后端运行在 http://localhost:8080
 * 2. 运行: node scripts/test-api-integration.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

/**
 * 执行 HTTP 请求
 */
async function request(method, path, body = null) {
  const url = `${API_BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * 测试用例
 */
const tests = [
  {
    name: '健康检查',
    run: async () => {
      const result = await request('GET', '/health');
      if (result.ok && result.data.status === 'ok') {
        return { success: true, message: '后端运行正常' };
      }
      return { success: false, message: `健康检查失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取文章列表',
    run: async () => {
      const result = await request('GET', '/posts?page=1&pageSize=5');
      if (result.ok && result.data.posts) {
        return {
          success: true,
          message: `成功获取 ${result.data.posts.length} 篇文章，总计 ${result.data.total} 篇`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取笔记列表',
    run: async () => {
      const result = await request('GET', '/notes');
      if (result.ok && result.data.notes) {
        return {
          success: true,
          message: `成功获取 ${result.data.notes.length} 条笔记`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取分类列表',
    run: async () => {
      const result = await request('GET', '/categories');
      if (result.ok && Array.isArray(result.data)) {
        return {
          success: true,
          message: `成功获取 ${result.data.length} 个分类`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取标签列表',
    run: async () => {
      const result = await request('GET', '/tags');
      if (result.ok && Array.isArray(result.data)) {
        return {
          success: true,
          message: `成功获取 ${result.data.length} 个标签`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取站点配置',
    run: async () => {
      const result = await request('GET', '/config');
      if (result.ok && result.data.siteName) {
        return {
          success: true,
          message: `站点名称: ${result.data.siteName}`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
  
  {
    name: '获取图片列表',
    run: async () => {
      const result = await request('GET', '/images');
      if (result.ok && Array.isArray(result.data)) {
        return {
          success: true,
          message: `成功获取 ${result.data.length} 张图片`
        };
      }
      return { success: false, message: `获取失败: ${result.error || result.data.error}` };
    }
  },
];

/**
 * 运行所有测试
 */
async function runTests() {
  log(colors.bright + colors.cyan, '\n=================================');
  log(colors.bright + colors.cyan, '  API 集成测试');
  log(colors.bright + colors.cyan, '=================================');
  log(colors.blue, `\n目标后端: ${API_BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`${colors.yellow}[测试]${colors.reset} ${test.name}... `);
    
    try {
      const result = await test.run();
      if (result.success) {
        log(colors.green, `✓ ${result.message}`);
        passed++;
      } else {
        log(colors.red, `✗ ${result.message}`);
        failed++;
      }
    } catch (error) {
      log(colors.red, `✗ 异常: ${error.message}`);
      failed++;
    }
  }

  // 打印总结
  log(colors.bright + colors.cyan, '\n=================================');
  log(colors.bright + colors.cyan, '  测试结果');
  log(colors.bright + colors.cyan, '=================================\n');
  
  log(colors.green, `通过: ${passed}/${tests.length}`);
  if (failed > 0) {
    log(colors.red, `失败: ${failed}/${tests.length}`);
  }
  
  log(colors.cyan, '\n=================================\n');

  // 返回退出代码
  process.exit(failed > 0 ? 1 : 0);
}

// 主程序
(async () => {
  // 检查是否安装了 node-fetch（Node.js < 18）
  if (!global.fetch) {
    try {
      const fetch = await import('node-fetch');
      global.fetch = fetch.default;
    } catch (error) {
      log(colors.red, '\n错误: 需要 Node.js 18+ 或安装 node-fetch');
      log(colors.yellow, '解决方案: npm install node-fetch@2\n');
      process.exit(1);
    }
  }

  await runTests();
})();

