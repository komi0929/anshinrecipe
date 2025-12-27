'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import './CollectionCard.css';

/**
 * CollectionCard - コレクション表示カード
 * 
 * 4つのプレビュー画像をグリッドで表示
 */

export const CollectionCard = ({
    collection,
    onEdit,
    onDelete,
    showActions = true
}) => {
    const [showMenu, setShowMenu] = React.useState(false);

    const handleMenuClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        onEdit?.(collection);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        if (confirm(`「${collection.name}」を削除しますか？\nレシピは削除されません。`)) {
            onDelete?.(collection.id, collection.name);
        }
    };

    return (
        <div className="collection-card-wrapper">
            <Link
                href={`/?tab=saved&collection=${collection.id}`}
                className="collection-card"
                style={{ '--collection-color': collection.color }}
            >
                {/* Preview Grid */}
                <div className="collection-preview">
                    {collection.previewImages.length > 0 ? (
                        <div className="preview-grid">
                            {collection.previewImages.slice(0, 4).map((img, i) => (
                                <div key={i} className="preview-item">
                                    <img src={img} alt="" />
                                </div>
                            ))}
                            {/* Fill remaining slots */}
                            {Array.from({ length: Math.max(0, 4 - collection.previewImages.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="preview-item empty">
                                    <Folder size={16} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="preview-empty">
                            <span className="collection-icon-large">{collection.icon}</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="collection-info">
                    <div className="collection-header">
                        <span className="collection-icon">{collection.icon}</span>
                        <h3 className="collection-name">{collection.name}</h3>
                    </div>
                    <p className="collection-count">{collection.recipeCount}件のレシピ</p>
                </div>

                {/* Actions Menu */}
                {showActions && (
                    <button
                        className="collection-menu-btn"
                        onClick={handleMenuClick}
                    >
                        <MoreVertical size={18} />
                    </button>
                )}

                {showMenu && (
                    <>
                        <div
                            className="collection-menu-backdrop"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMenu(false);
                            }}
                        />
                        <div className="collection-menu">
                            <button onClick={handleEdit}>
                                <Pencil size={14} />
                                <span>編集</span>
                            </button>
                            <button onClick={handleDelete} className="danger">
                                <Trash2 size={14} />
                                <span>削除</span>
                            </button>
                        </div>
                    </>
                )}
            </Link>
        </div>
    );
};

export default CollectionCard;
