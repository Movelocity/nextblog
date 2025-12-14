"use client";

import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import "./Markdown.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { copyToClipboard } from "@/app/services/utils";
// import mermaid from "mermaid";
import { RiLoader4Line } from "react-icons/ri";
import cn from "classnames";
import { useDebouncedCallback } from "use-debounce";
import { useToast } from '@/app/components/layout/ToastHook';

/** preview code */
export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [isMermaid, setIsMermaid] = useState(false);
  const { showToast } = useToast();

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current && !hiddenRef.current) return;
    const targetRef = isMermaid ? hiddenRef.current : ref.current;
    const mermaidDom = targetRef?.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setIsMermaid(true);
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
  }, 600);

  //Wrap the paragraph for plain-text
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        "code",
      ) as NodeListOf<HTMLElement>;
      const wrapLanguages = [
        "",
        "md",
        "markdown",
        "text",
        "txt",
        "plaintext",
        "tex",
        "latex",
      ];
      codeElements.forEach((codeElement) => {
        const languageClass = codeElement.className.match(/language-(\w+)/);
        const name = languageClass ? languageClass[1] : "";
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = "pre-wrap";
        }
      });
      renderArtifacts();
    }
  }, []);

  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidError, setMermaidError] = useState(false);

  useEffect(() => {
    if (mermaidCode && mermaidRef.current) {
      import("mermaid").then((mermaid) => {
        mermaid.default.initialize({startOnLoad: false, suppressErrorRendering: false})
        mermaid.default
          .run({nodes: [mermaidRef.current as HTMLElement], suppressErrors: false})
          .catch((e) => {
            console.log("[Mermaid] " + e.message);
            setMermaidError(true);
          })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mermaidCode]);

  const shouldRenderMermaid = isMermaid && mermaidCode.length > 0 && !mermaidError;

  return (
    <>
      {shouldRenderMermaid ? (
        <div
          className="no-dark mermaid"
          style={{overflow: "auto"}}
          ref={mermaidRef}
        >
          {mermaidCode}
        </div>
      ) : (
        <pre ref={ref} className="relative group/code-body">
          <span
            className="opacity-0 group-hover/code-body:opacity-80 absolute top-2 right-2 cursor-pointer z-50 translate-x-2 group-hover/code-body:translate-x-0 transition-all duration-200"
            onClick={() => {
              if (ref.current) {
                copyToClipboard(ref.current.querySelector("code")?.innerText ?? "",);
                showToast('Copied to clipboard', 'success');
              }
            }}
          >copy</span>
          {props.children}
        </pre>
      )}
    </>
  );
}

function CustomCode(props: { children: any; className?: string }) {
  const enableCodeFold = true;  // TODO: configure in dashboard
  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);
  const isInlineCode = !props.className;  // If no className is provided, it's inline code

  useEffect(() => {
    if (ref.current && !isInlineCode) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 600);
    }
  }, [props.children, isInlineCode]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };

  const renderToggleButton = () => {
    if (!showToggle || !enableCodeFold || isInlineCode) return null;

    return (
      <div
        className={cn(
          "group/code-toggle absolute bottom-0 left-0 flex justify-center w-full pb-2 transition-opacity duration-200",
          collapsed ? "bg-gradient-to-t from-gray-800 to-transparent" : "pointer-events-none",
        )}
      >
        <button
          onClick={toggleCollapsed}
          className={cn(
            "px-2 py-0.5 text-sm rounded-full bg-gray-700/90 pointer-events-auto transition-all duration-200 opacity-0",
            collapsed ? "group-hover/code-toggle:opacity-80 group-hover/code-toggle:translate-y-0 translate-y-2" : "hover:opacity-80 hover:translate-y-0 translate-y-2"
          )}
        >
          {collapsed ? "Show more" : "Show less"}
        </button>
      </div>
    );
  };

  if (isInlineCode) {
    return (
      <code
        className="inline-code"
        style={{
          whiteSpace: "break-spaces",
          fontWeight: "inherit"
        }}
      >
        {props.children}
      </code>
    );
  }

  return (
    <div className="relative w-full">
      <code
        className={cn("block overflow-x-scroll", props?.className)}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: "hidden",
          display: "block",
        }}
      >
        {props.children}
      </code>

      {renderToggleButton()}
    </div>
  );
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

function tryWrapHtmlCode(text: string) {
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

function MarkdownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(props.content));
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[
        RemarkMath, 
        RemarkGfm, 
        RemarkBreaks
      ]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode as any,  // eslint-disable-line no-explicit-any
        code: CustomCode as any,  // eslint-disable-line no-explicit-any
        p: (pProps) => <p {...pProps} dir="auto" />,
        h1: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h1 id={id} {...props} />;
        },
        h2: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h2 id={id} {...props} />;
        },
        h3: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h3 id={id} {...props} />;
        },
        h4: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h4 id={id} {...props} />;
        },
        h5: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h5 id={id} {...props} />;
        },
        h6: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          return <h6 id={id} {...props} />;
        },
        a: (aProps) => {
          const href = aProps.href || "";
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure>
                <audio controls src={href}></audio>
              </figure>
            );
          }
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video controls width="99.9%">
                <source src={href} />
              </video>
            );
          }
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          return <a {...aProps} target={target} />;
        },
        table: (tableProps) => {
          return (
            <div className="w-full overflow-x-auto">
              <table {...tableProps} />
            </div>
          )
        },
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}


export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  // const mdRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="mkd-body prose dark:prose-invert md:mx-auto max-w-none sm:p-4 sm:pl-6"
      style={{
        fontSize: `${props.fontSize ?? 16}px`,
        fontFamily: props.fontFamily || "inherit",
      }}
    >
      {props.loading ? (
        <RiLoader4Line className="animate-spin" />
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}