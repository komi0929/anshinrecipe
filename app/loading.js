import { Grid } from 'lucide-react';

export default function Loading() {
    return (
        <div className="container">
            <div className="animate-pulse space-y-8">
                {/* Header Skeleton */}
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>

                {/* Filter Skeleton */}
                <div className="flex gap-4 overflow-hidden mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 w-24 bg-gray-200 rounded-full shrink-0"></div>
                    ))}
                </div>

                {/* Grid Skeleton */}
                <div className="recipe-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden aspect-[4/5]">
                            <div className="h-2/3 bg-gray-200"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Inline styles for skeleton if Tailwind is not fully set up */}
            <style>{`
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .bg-gray-200 { background-color: #E2E8F0; }
                .rounded { border-radius: 0.25rem; }
                .rounded-full { border-radius: 9999px; }
                .rounded-2xl { border-radius: 1rem; }
                .h-8 { height: 2rem; }
                .h-10 { height: 2.5rem; }
                .h-4 { height: 1rem; }
                .h-3 { height: 0.75rem; }
                .w-24 { width: 6rem; }
                .shrink-0 { flex-shrink: 0; }
                .aspect-\\[4\\/5\\] { aspect-ratio: 4/5; }
            `}</style>
        </div>
    );
}
