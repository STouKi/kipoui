import MarkdownIt from 'markdown-it'

// The coach answers in markdown. Raw HTML is escaped (html: false) and markdown-it refuses
// javascript: links, so the result is safe for v-html
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

export function renderMarkdown(text: string) {
  return markdown.render(text)
}
