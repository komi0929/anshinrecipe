import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>😢</div>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                ページが見つかりません
            </h2>
            <p className="text-sub mb-4">
                お探しのページは削除されたか、<br />
                URLが間違っている可能性があります。
            </p>
            <Link href="/" className="btn btn-primary">
                <Home size={20} />
                ホームに戻る
            </Link>
        </div>
    );
}
