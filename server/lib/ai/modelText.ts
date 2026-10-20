// gpt-oss writes in OpenAI's harmony format, whose control tokens (<|channel|>, <|message|>,
// <|constrain|>...) sometimes leak into the text Groq returns, as in a chat title once
// ("Dinner ideas from fridge <|constrain|>2 650kcal day"). Keeps the final message only
export function stripModelTokens(text: string) {
  const marker = '<|message|>'
  const last = text.lastIndexOf(marker)
  const message = last >= 0 ? text.slice(last + marker.length) : text
  const cut = message.indexOf('<|')
  return cut >= 0 ? message.slice(0, cut) : message
}

// At most `max` characters, cut between two words
export function shorten(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  return (space > max / 2 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,;.:!?-]+$/, '')
}
