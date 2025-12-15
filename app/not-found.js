import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="container min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="text-8xl mb-6 animate-bounce-slow">
                🍪
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-700">
                レシピが見つかりません
            </h2>
            <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
                お探しのレシピは、誰かが美味しく食べちゃったか、<br />
                削除された可能性があります。
            </p>
            <Link href="/">
                <button className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-orange-200 flex items-center gap-2 hover:bg-orange-600 transition-colors">
                    <Home size={20} />
                    ホームに戻る
                </button>
            </Link>
        </div>
    );
}
