import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import "./Markdown.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { copyToClipboard } from "../../services/utils";
import mermaid from "mermaid";
import { RiLoader4Line } from "react-icons/ri";
import React from "react";

import classnames from "classnames";
import { useDebouncedCallback } from "use-debounce";

/* This component is a modified version of the code from https://github.com/ChatGPTNextWeb/NextChat/blob/main/app/components/markdown.tsx */

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  if (hasError) {
    return null;
  }

  return (
    <div
      className={classnames("no-dark", "mermaid")}
      style={{
        overflow: "auto",
      }}
      ref={ref}
    >
      {props.code}
    </div>
  );
}

/** preview code */
export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [isMermaid, setIsMermaid] = useState(false);

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

  return (
    <>
      {!isMermaid && (
        <pre ref={ref} className="group relative">
          <span
            className="group-hover:opacity-100 opacity-0 absolute top-2 right-2 cursor-pointer"
            onClick={() => {
              if (ref.current) {
                copyToClipboard(
                  ref.current.querySelector("code")?.innerText ?? "",
                );
              }
            }}
          >copy</span>
          {props.children}
        </pre>
      )}
      {isMermaid && mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {!isMermaid && <div ref={hiddenRef} className="hidden">{props.children}</div>}
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
      setShowToggle(codeHeight > 400);
    }
  }, [props.children, isInlineCode]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };

  const renderToggleButton = () => {
    if (!showToggle || !enableCodeFold || isInlineCode) return null;

    return (
      <div
        className={classnames(
          "absolute bottom-0 left-0 right-0 flex justify-center w-full py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          {
            "bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent": collapsed,
          }
        )}
      >
        <button
          onClick={toggleCollapsed}
          className="px-2 py-0.5 text-sm rounded-full bg-gray-200/90 dark:bg-gray-700/90 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {collapsed ? "Show more" : "Show less"}
        </button>
      </div>
    );
  };

  if (isInlineCode) {
    return (
      <code
        className={classnames("inline-code", props?.className)}
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
    <div className="group relative">
      <code
        className={classnames(props?.className)}
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

function MarkDownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(props.content));
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
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
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return <h1 id={id} {...props} />;
        },
        h2: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return <h2 id={id} {...props} />;
        },
        h3: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return <h3 id={id} {...props} />;
        },
        h4: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return <h4 id={id} {...props} />;
        },
        h5: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return <h5 id={id} {...props} />;
        },
        h6: (props) => {
          const id = props.children?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
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
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContentMemo = React.memo(MarkDownContent);

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
  const mdRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="mkd-body prose dark:prose-invert"
      style={{
        fontSize: `${props.fontSize ?? 16}px`,
        fontFamily: props.fontFamily || "inherit",
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <RiLoader4Line className="animate-spin" />
      ) : (
        <MarkdownContentMemo content={props.content} />
      )}
    </div>
  );
}