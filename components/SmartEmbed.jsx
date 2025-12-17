import React from 'react';

export const SmartEmbed = ({ url }) => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch && youtubeMatch[1]) {
        return (
            <div className="my-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-lg">🎥</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Video</span>
                </div>
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        );
    }

    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/@.+\/video\/(\d+)/);
    if (tiktokMatch && tiktokMatch[1]) {
        return (
            <div className="my-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-lg">🎥</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Video</span>
                </div>
                <div className="w-full rounded-xl overflow-hidden shadow-sm border bg-black relative group">
                    {/* Overlay for "Click to Interact" could be added here if needed, but iframe handles it */}
                    <iframe
                        name="__tiktok_iframe__"
                        src={`https://www.tiktok.com/embed/v2/${tiktokMatch[1]}?lang=ja-JP`}
                        className="w-full h-[500px] border-none"
                        allowFullScreen
                        scrolling="no"
                    ></iframe>
                </div>
            </div>
        );
    }

    // Instagram
    const instagramMatch = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
    if (instagramMatch && instagramMatch[1]) {
        return (
            <div className="w-full flex justify-center my-4">
                <iframe
                    className="bg-white border rounded-xl shadow-sm"
                    src={`https://www.instagram.com/p/${instagramMatch[1]}/embed`}
                    width="400"
                    height="480"
                    frameBorder="0"
                    scrolling="no"
                    allowTransparency="true"
                ></iframe>
            </div>
        );
    }

    return null; // Not a recognized video URL
};
