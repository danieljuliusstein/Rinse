import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body {
  height: 100%;
}
body {
  background-color: #f4f4f5;
  color: #18181b;
}
#root {
  display: flex;
  flex: 1;
  min-height: 100%;
  width: 100%;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #f4f4f5;
    color: #18181b;
  }
}

/* iPhone frame for marketing / Playwright captures — enable with ?screenshot=1 */
body.screenshot-mode {
  min-height: 100dvh;
  background: #111;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 12px;
  box-sizing: border-box;
}
body.screenshot-mode #root {
  width: 100%;
  max-width: 390px;
  min-height: 844px;
  background: #f2f2f7;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex: 0 0 auto;
}`;
