'use client';

import React, { useState } from 'react';
import { FolderPlus, Check, Plus, ChevronDown } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useProfile } from '@/hooks/useProfile';
import CollectionModal from './CollectionModal';
import './AddToCollection.css';

/**
 * AddToCollectionButton - レシピをコレクションに追加するボタン
 * 
 * レシピ詳細ページや保存済みレシピ一覧で使用
 */

export const AddToCollectionButton = ({
    recipeId,
    recipeName,
    variant = 'default', // 'default' | 'compact' | 'icon-only'
}) => {
    const { user } = useProfile();
    const {
        collections,
        loading,
        createCollection,
        addRecipeToCollection,
        removeRecipeFromCollection,
        isRecipeInCollection,
    } = useCollections(user?.id);

    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    if (!user) return null;

    const collectionsWithRecipe = collections.filter(c =>
        isRecipeInCollection(recipeId, c.id)
    );

    const handleToggleCollection = async (collection) => {
        const isInCollection = isRecipeInCollection(recipeId, collection.id);

        if (isInCollection) {
            await removeRecipeFromCollection(collection.id, recipeId);
        } else {
            await addRecipeToCollection(collection.id, recipeId);
        }
    };

    const handleCreateCollection = async (data) => {
        setIsCreating(true);
        try {
            const newCollection = await createCollection(data);
            if (newCollection) {
                // Automatically add recipe to new collection
                await addRecipeToCollection(newCollection.id, recipeId);
                setShowCreateModal(false);
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="add-to-collection-wrapper">
            <button
                className={`add-to-collection-btn ${variant} ${collectionsWithRecipe.length > 0 ? 'has-collections' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <FolderPlus size={variant === 'icon-only' ? 20 : 16} />
                {variant !== 'icon-only' && (
                    <>
                        <span>
                            {collectionsWithRecipe.length > 0
                                ? `${collectionsWithRecipe.length}件のコレクション`
                                : 'コレクションに追加'}
                        </span>
                        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="add-to-collection-backdrop"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="add-to-collection-dropdown">
                        <div className="dropdown-header">
                            <span>コレクションを選択</span>
                        </div>

                        {loading ? (
                            <div className="dropdown-loading">
                                <div className="spinner" />
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="dropdown-empty">
                                <FolderPlus size={24} className="text-slate-300" />
                                <p>まだコレクションがありません</p>
                            </div>
                        ) : (
                            <div className="dropdown-list">
                                {collections.map(collection => {
                                    const isInCollection = isRecipeInCollection(recipeId, collection.id);
                                    return (
                                        <button
                                            key={collection.id}
                                            className={`dropdown-item ${isInCollection ? 'selected' : ''}`}
                                            onClick={() => handleToggleCollection(collection)}
                                        >
                                            <span className="item-icon">{collection.icon}</span>
                                            <span className="item-name">{collection.name}</span>
                                            <span className="item-count">{collection.recipeCount}</span>
                                            {isInCollection && (
                                                <Check size={16} className="item-check" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            className="dropdown-create-btn"
                            onClick={() => {
                                setIsOpen(false);
                                setShowCreateModal(true);
                            }}
                        >
                            <Plus size={16} />
                            <span>新しいコレクションを作成</span>
                        </button>
                    </div>
                </>
            )}

            <CollectionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateCollection}
                isLoading={isCreating}
            />
        </div>
    );
};

export default AddToCollectionButton;
