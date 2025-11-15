'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

/**
 * Markdown preview component with GitHub-flavored markdown support
 */
const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-4 h-full overflow-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content || '*No content to preview*'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;

