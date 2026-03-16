const React = require('react')
const { Text, View } = require('react-native')

// Simple markdown mock that strips common markers so text content is testable
function stripMarkdown(text) {
  if (typeof text !== 'string') return text
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^[-*]\s+/gm, '') // list items
    .trim()
}

function MarkdownMock({ children, style }) {
  const stripped = stripMarkdown(children)
  return React.createElement(Text, { style: style?.body }, stripped)
}

module.exports = MarkdownMock
module.exports.default = MarkdownMock
