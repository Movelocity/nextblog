/**
 * Configuration for all available tools in the tools aggregation page
 */

import { 
  RiCodeSSlashLine, 
  RiFileTextLine, 
  RiPaletteLine, 
  RiCalculatorLine,
  RiTranslate,
  RiTimeLine,
  RiLockPasswordLine,
  RiQrCodeLine,
  RiImageEditLine,
  RiFileCodeLine,
  RiScissorsLine
} from 'react-icons/ri';
import { IconType } from 'react-icons';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: IconType;
  path: string;
  isNew?: boolean;
  isPopular?: boolean;
  adminOnly?: boolean;
}

export enum ToolCategory {
  TEXT = 'text',
  DATA = 'data',
  DEVELOPER = 'developer',
  CONVERTER = 'converter',
  SECURITY = 'security',
  MEDIA = 'media'
}

export const toolCategories: Record<ToolCategory, { name: string; color: string }> = {
  [ToolCategory.TEXT]: { name: '文本处理', color: 'category-blue' },
  [ToolCategory.DATA]: { name: '数据转换', color: 'category-green' },
  [ToolCategory.DEVELOPER]: { name: '开发工具', color: 'category-purple' },
  [ToolCategory.CONVERTER]: { name: '格式转换', color: 'category-yellow' },
  [ToolCategory.SECURITY]: { name: '安全工具', color: 'category-red' },
  [ToolCategory.MEDIA]: { name: '媒体处理', color: 'category-teal' }
};

const tools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON 编辑器',
    description: '多框编辑器，支持语法高亮、Markdown 预览、文本操作和自定义脚本。可调整大小，状态自动保存',
    category: ToolCategory.DEVELOPER,
    icon: RiFileCodeLine,
    path: '/tools/json',
    isNew: true,
    isPopular: true
  },
  {
    id: 'image-processor',
    name: '图像处理器',
    description: '纯前端图像处理工具，支持裁剪、圆角、边距、背景等功能，多格式导出',
    category: ToolCategory.MEDIA,
    icon: RiScissorsLine,
    path: '/tools/image-processor',
    isNew: true,
    isPopular: true
  },
  // Future tools placeholder
  {
    id: 'image-edit',
    name: 'AI 图片编辑',
    description: '使用 AI 编辑图片，支持智能修改和效果处理',
    category: ToolCategory.MEDIA,
    icon: RiImageEditLine,
    path: '/tools/image-edit',
    isNew: false,
    isPopular: false,
    adminOnly: true
  },
  {
    id: 'image-api-test',
    name: '图片 API 测试',
    description: '测试图片上传、编辑和资产管理 API',
    category: ToolCategory.DEVELOPER,
    icon: RiImageEditLine,
    path: '/tools/image-test',
    adminOnly: true
  },
  {
    id: 'text-diff',
    name: '文本对比',
    description: '对比两段文本的差异，高亮显示不同之处',
    category: ToolCategory.TEXT,
    icon: RiFileTextLine,
    path: '/tools/text-diff'
  },
  {
    id: 'color-picker',
    name: '颜色选择器',
    description: '选择和转换颜色格式 (HEX, RGB, HSL)',
    category: ToolCategory.DEVELOPER,
    icon: RiPaletteLine,
    path: '/tools/color-picker'
  },
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: '编码和解码 Base64 字符串',
    category: ToolCategory.CONVERTER,
    icon: RiCodeSSlashLine,
    path: '/tools/base64'
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '科学计算器，支持复杂运算',
    category: ToolCategory.DATA,
    icon: RiCalculatorLine,
    path: '/tools/calculator'
  },
  {
    id: 'translator',
    name: '翻译工具',
    description: '多语言文本翻译',
    category: ToolCategory.TEXT,
    icon: RiTranslate,
    path: '/tools/translator'
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转',
    category: ToolCategory.CONVERTER,
    icon: RiTimeLine,
    path: '/tools/timestamp'
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    description: '生成安全的随机密码',
    category: ToolCategory.SECURITY,
    icon: RiLockPasswordLine,
    path: '/tools/password'
  },
  {
    id: 'qr-code',
    name: '二维码生成',
    description: '生成和解析二维码',
    category: ToolCategory.MEDIA,
    icon: RiQrCodeLine,
    path: '/tools/qr-code'
  },
  {
    id: 'image-compress',
    name: '图片压缩',
    description: '压缩图片文件大小',
    category: ToolCategory.MEDIA,
    icon: RiImageEditLine,
    path: '/tools/image-compress'
  },
];

export const getTools = (isAdmin: boolean = false): Tool[] => {
  return tools.filter(tool => !tool.adminOnly || (tool.adminOnly && isAdmin));
};

/**
 * Search tools by name or description
 */
export const searchTools = (query: string, isAdmin: boolean = false): Tool[] => {
  const lowerQuery = query.toLowerCase();
  console.log('isAdmin', isAdmin);
  return tools.filter(tool => 
    !tool.adminOnly || (tool.adminOnly && isAdmin) &&
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery)
  );
};
