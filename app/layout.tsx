import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { restoreSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Closet Chronicle",
  description: "This is the story of taking back your closet—and your life.",
  generator: "cc01",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add this script to clean up vsc-initialized class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // Remove vsc-initialized class from body if it exists
              document.addEventListener('DOMContentLoaded', function() {
                if (document.body && document.body.classList.contains('vsc-initialized')) {
                  document.body.classList.remove('vsc-initialized');
                }
              });
            })();
          `,
          }}
        />

        {/* セッション復元スクリプト */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (async function() {
              // ログインページ、サインアップページ、トップページではセッション復元をスキップ
              if (window.location.pathname === '/login' || 
                  window.location.pathname === '/signup' || 
                  window.location.pathname === '/') {
                return;
              }

              try {
                // PlayFab SDKが読み込まれるまで待機
                let retryCount = 0;
                const maxRetries = 5;
                
                const checkPlayFab = () => {
                  return new Promise((resolve) => {
                    if (window.PlayFab) {
                      resolve(true);
                    } else if (retryCount < maxRetries) {
                      retryCount++;
                      setTimeout(() => resolve(checkPlayFab()), 1000);
                    } else {
                      console.error('PlayFab SDKの読み込みに失敗しました');
                      resolve(false);
                    }
                  });
                };

                const playFabLoaded = await checkPlayFab();
                if (!playFabLoaded) {
                  throw new Error('PlayFab SDKが利用できません');
                }

                // セッション復元を試みる
                const response = await fetch('/api/restore-session');
                const data = await response.json();
                
                if (!response.ok) {
                  console.log('セッション復元に失敗しました:', data.error);
                  // セッションが無効な場合はログインページにリダイレクト
                  if (response.status === 401) {
                    // 現在のURLを保存
                    const currentPath = window.location.pathname;
                    // ログインページにリダイレクト（元のページに戻れるように）
                    window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
                  }
                } else {
                  console.log('セッション復元成功');
                }
              } catch (error) {
                console.error('セッション復元中にエラーが発生しました:', error);
                // エラーが発生した場合はログインページにリダイレクト
                const currentPath = window.location.pathname;
                window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
              }
            })();
          `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}

