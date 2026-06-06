import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every
 * web page rendered by the static rendering.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Atomic Practice - Nền tảng thực hành tâm linh</title>
        <meta property="og:title" content="Atomic Practice" />
        <meta property="og:description" content="Nền tảng thực hành tâm linh chuyên sâu." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA Specific Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Atomic Practice" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="description" content="Nền tảng thực hành tâm linh chuyên sâu." />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />

        <ScrollViewStyleReset />

        {/* Add any additional <head> elements here */}
      </head>
      <body>{children}</body>
    </html>
  );
}
