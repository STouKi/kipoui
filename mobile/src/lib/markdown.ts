import MarkdownIt from 'markdown-it'

// The coach answers in markdown. Raw HTML is escaped (html: false) and markdown-it refuses
// javascript: links, so the result is safe for v-html
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

// Tables scroll sideways in their own box (.table-scroll), and the text of each cell sits in a
// block whose width is capped (.cell, styled in ChatMessage): short columns stay narrow, long ones
// wrap at a readable width. Table layout ignores a max-width set on the cell itself
const rules = markdown.renderer.rules
type RenderRule = NonNullable<typeof rules.table_open>
const afterOpen = (html: string): RenderRule => (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options) + html
const beforeClose = (html: string): RenderRule => (tokens, idx, options, _env, self) => html + self.renderToken(tokens, idx, options)
rules.table_open = (tokens, idx, options, _env, self) => '<div class="table-scroll">' + self.renderToken(tokens, idx, options)
rules.table_close = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options) + '</div>\n'
rules.th_open = afterOpen('<div class="cell">')
rules.td_open = afterOpen('<div class="cell">')
rules.th_close = beforeClose('</div>')
rules.td_close = beforeClose('</div>')

// The coach breaks lines inside table cells with <br>, which html: false would show as text.
// Only this exact tag, without attributes, comes back
const LINE_BREAK = /&lt;br\s*\/?&gt;/gi

export function renderMarkdown(text: string) {
  return markdown.render(text).replace(LINE_BREAK, '<br>')
}
