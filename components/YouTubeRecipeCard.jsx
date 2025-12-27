import React from 'react';
import { PlayCircle, Check, ExternalLink } from 'lucide-react';
import './YouTubeRecipeCard.css';

const YouTubeRecipeCard = ({ video, onSelect, isSelected }) => {
    // Determine if it's a high-quality relevant video (simple heuristic for UI)
    const isHighQuality = video.title.length > 5 && video.description.length > 10;

    return (
        <div className={`youtube-recipe-card ${isSelected ? 'selected' : ''}`}>
            {/* Thumbnail */}
            <div className="youtube-card-thumbnail">
                <img src={video.thumbnail} alt={video.title} />
                <div className="youtube-play-overlay">
                    <PlayCircle size={32} className="text-white opacity-80" />
                </div>
                {isSelected && (
                    <div className="selected-overlay">
                        <Check size={32} className="text-white" />
                        <span>選択中</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="youtube-card-content">
                <h3 className="youtube-card-title" title={video.title}>
                    {video.title}
                </h3>
                <p className="youtube-card-channel">{video.channelTitle}</p>

                {/* Actions */}
                <div className="youtube-card-actions">
                    <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-link"
                        onClick={(e) => e.stopPropagation()} // Prevent selection when clicking link
                    >
                        確認する <ExternalLink size={12} />
                    </a>

                    <button
                        type="button"
                        onClick={() => onSelect(video)}
                        className={`select-btn ${isSelected ? 'selected' : ''}`}
                    >
                        {isSelected ? 'これにする' : '自分のメモに追加'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YouTubeRecipeCard;
