"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { RiDownloadLine, RiMoonLine, RiSunLine } from "@remixicon/react"
import { useTheme } from "next-themes"
import React from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

// City Lights theme by Yummygum (https://citylights.xyz/)
const cityLights: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: "#B7C5D3",
    background: "#1D252C",
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "#B7C5D3",
    background: "#1D252C",
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none",
    padding: "1em",
    margin: "0.5em 0",
    overflow: "auto",
    borderRadius: "0.375rem",
  },
  comment: { color: "#718CA1", fontStyle: "italic" },
  prolog: { color: "#718CA1" },
  doctype: { color: "#718CA1" },
  cdata: { color: "#718CA1" },
  punctuation: { color: "#B7C5D3" },
  property: { color: "#70E1E8" },
  tag: { color: "#D95468" },
  boolean: { color: "#E27E8D" },
  number: { color: "#E27E8D" },
  constant: { color: "#E27E8D" },
  symbol: { color: "#8BD49C" },
  deleted: { color: "#D95468" },
  selector: { color: "#8BD49C" },
  "attr-name": { color: "#70E1E8" },
  string: { color: "#68A1F0" },
  char: { color: "#68A1F0" },
  builtin: { color: "#70E1E8" },
  inserted: { color: "#8BD49C" },
  operator: { color: "#B7C5D3" },
  entity: { color: "#EBBF83", cursor: "help" },
  url: { color: "#5EC4FF" },
  ".language-css .token.string": { color: "#5EC4FF" },
  ".style .token.string": { color: "#5EC4FF" },
  variable: { color: "#B7C5D3" },
  atrule: { color: "#D95468" },
  "attr-value": { color: "#68A1F0" },
  function: { color: "#33CED8" },
  "class-name": { color: "#70E1E8" },
  keyword: { color: "#D95468" },
  regex: { color: "#EBBF83" },
  important: { color: "#D95468", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
}

interface ReadmeContentProps {
  content: string
}

export function ReadmeContent({ content }: ReadmeContentProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const articleRef = React.useRef<HTMLElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleDownloadPdf = async () => {
    if (!articleRef.current) return

    setIsGeneratingPdf(true)

    try {
      const html2pdf = (await import("html2pdf.js")).default

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: "README.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        enableLinks: true,
      }

      await html2pdf().set(opt).from(articleRef.current).save()
    } catch (error) {
      console.error("Failed to generate PDF:", error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Documentation
            </h1>
            {/* <p className="text-gray-500 sm:text-sm/6 dark:text-gray-500">
              Project README and technical documentation
            </p> */}
          </div>
        </div>
        <Divider />
        <div className="mt-8 animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mt-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Documentation
          </h1>
          {/* <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
            Project README and technical documentation
          </p> */}
        </div>
        <div className="flex items-center gap-2">
          {resolvedTheme === "light" ? (
            <Button
              variant="secondary"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              <RiDownloadLine
                className="-ml-0.5 mr-1.5 size-4"
                aria-hidden="true"
              />
              {isGeneratingPdf ? "Generating..." : "Download PDF"}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? (
              <RiSunLine className="size-4" aria-hidden="true" />
            ) : (
              <RiMoonLine className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      <Divider />
      <article
        ref={articleRef}
        className="prose prose-gray mt-8 max-w-none dark:prose-invert"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              const isInline = !match

              if (isInline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <SyntaxHighlighter
                  style={resolvedTheme === "dark" ? cityLights : oneLight}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              )
            },
            a({ href, children, ...props }) {
              // Handle anchor links with smooth scrolling
              if (href?.startsWith("#")) {
                return (
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault()
                      const target = document.getElementById(href.slice(1))
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth" })
                        window.history.pushState(null, "", href)
                      }
                    }}
                    {...props}
                  >
                    {children}
                  </a>
                )
              }
              // External links open in new tab
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              )
            },
            img({ src, alt, ...props }) {
              // Fix paths from ./public/... to /... for Next.js
              let fixedSrc = src || ""
              if (fixedSrc.startsWith("./public/")) {
                fixedSrc = fixedSrc.replace("./public", "")
              } else if (fixedSrc.startsWith("/public/")) {
                fixedSrc = fixedSrc.replace("/public", "")
              }
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fixedSrc} alt={alt || ""} {...props} />
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </>
  )
}
