import ReactMarkdown, { defaultUrlTransform } from "react-markdown";

const allowedElements = [
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "a",
  "code",
  "blockquote",
  "hr",
  "br",
] as const;

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      allowedElements={[...allowedElements]}
      skipHtml
      urlTransform={(url) => defaultUrlTransform(url)}
      components={{
        a: ({ children: linkChildren, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer">
            {linkChildren}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
