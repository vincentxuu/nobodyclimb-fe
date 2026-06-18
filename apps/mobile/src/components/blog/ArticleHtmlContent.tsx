import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useMemo, useState } from 'react'
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native'
import { WebView } from 'react-native-webview'

interface ArticleHtmlContentProps {
  html: string
}

const HEIGHT_SCRIPT = `
(function() {
  function postHeight() {
    var body = document.body;
    var html = document.documentElement;
    var height = Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    );
    window.ReactNativeWebView.postMessage(String(height));
  }

  window.addEventListener('load', postHeight);
  document.querySelectorAll('img').forEach(function(img) {
    img.addEventListener('load', postHeight);
  });
  setTimeout(postHeight, 50);
  setTimeout(postHeight, 250);
  setTimeout(postHeight, 1000);
})();
true;
`

function normalizeNewlines(text: string): string {
  return text.replace(/\\n/g, '\n')
}

function sanitizeArticleHtml(html: string): string {
  return normalizeNewlines(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son\w+=(["']).*?\1/gi, '')
    .replace(/\son\w+=\S+/gi, '')
    .replace(/\s(href|src)=(["'])\s*javascript:[\s\S]*?\2/gi, '')
}

function buildHtmlDocument(content: string, width: number): string {
  const readableWidth = Math.max(280, Math.floor(width - SPACING.md * 2))

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        width: ${readableWidth}px;
        overflow: hidden;
        background: transparent;
        color: #1b1a1a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 16px;
        line-height: 1.75;
      }
      body {
        overflow-wrap: anywhere;
      }
      p {
        margin: 0 0 16px;
      }
      h1,
      h2,
      h3 {
        margin: 22px 0 12px;
        color: #1b1a1a;
        line-height: 1.3;
      }
      h1 {
        font-size: 24px;
        font-weight: 700;
      }
      h2 {
        font-size: 21px;
        font-weight: 700;
      }
      h3 {
        font-size: 18px;
        font-weight: 650;
      }
      ul,
      ol {
        margin: 0 0 16px 22px;
        padding: 0;
      }
      li {
        margin: 6px 0;
      }
      blockquote {
        margin: 0 0 16px;
        padding: 2px 0 2px 14px;
        border-left: 4px solid #d3d3d3;
        color: #706f6f;
        font-style: italic;
      }
      a {
        color: #2563eb;
        text-decoration: underline;
      }
      img,
      video {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
      }
      pre,
      code {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        background: #f5f5f5;
        border-radius: 6px;
      }
      pre {
        padding: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
      }
      th,
      td {
        border: 1px solid #e5e5e5;
        padding: 8px;
        text-align: left;
      }
    </style>
  </head>
  <body>${content}</body>
</html>`
}

export function ArticleHtmlContent({ html }: ArticleHtmlContentProps) {
  const { width } = useWindowDimensions()
  const [height, setHeight] = useState(1)

  const sourceHtml = useMemo(() => {
    const sanitized = sanitizeArticleHtml(html)
    return buildHtmlDocument(sanitized, width)
  }, [html, width])

  if (!html.trim()) return null

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: sourceHtml }}
        style={[styles.webview, { height }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        injectedJavaScript={HEIGHT_SCRIPT}
        onMessage={(event) => {
          const nextHeight = Number(event.nativeEvent.data)
          if (Number.isFinite(nextHeight) && nextHeight > 0) {
            setHeight(Math.ceil(nextHeight))
          }
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === 'about:blank') return true
          if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
            Linking.openURL(request.url)
            return false
          }
          return true
        }}
        setSupportMultipleWindows={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  webview: {
    width: '100%',
    backgroundColor: 'transparent',
  },
})
