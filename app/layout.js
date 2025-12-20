import { Zen_Maru_Gothic } from 'next/font/google'
import { ToastProvider } from '../components/Toast'
import BottomNav from '../components/BottomNav'
import SafetyBanner from '../components/SafetyBanner'
import GoogleAnalytics from '../components/GoogleAnalytics'
import './globals.css'

const zenMaruGothic = Zen_Maru_Gothic({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-zen-maru',
})

export const metadata = {
    title: 'あんしんレシピ',
    description: '食物アレルギーを持つお子様のための、安心レシピ共有アプリ',
    openGraph: {
        title: 'あんしんレシピ',
        description: '食物アレルギーを持つお子様のための、安心レシピ共有アプリ',
        siteName: 'あんしんレシピ',
        locale: 'ja_JP',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'あんしんレシピ',
        description: '食物アレルギーを持つお子様のための、安心レシピ共有アプリ',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'あんしんレシピ',
        startupImage: [],
    },
    icons: {
        icon: '/icon-512x512.png',
        shortcut: '/icon-512x512.png',
        apple: '/pwa-icon.png',
    },
}



export const viewport = {
    themeColor: "#ffffff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
}

import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function RootLayout({ children }) {
    return (
        <html lang="ja" className={zenMaruGothic.variable} suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ToastProvider>
                    <div className="app-container flex flex-col min-h-screen">
                        <SafetyBanner />
                        <main className="flex-grow pb-16">
                            {children}
                        </main>

                        <BottomNav />
                        <PWAInstallPrompt />
                    </div>
                </ToastProvider>
            </body>
        </html>
    )
}
