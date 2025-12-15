import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useProfile } from '../hooks/useProfile';
import { Search, Plus, User, Heart, ExternalLink } from 'lucide-react';
import { RecipeCardSkeleton } from '../components/Skeleton';
import './RecipeListPage.css';

const RecipeListPage = () => {
    const { recipes, loading } = useRecipes();
    const { profile } = useProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Simulate image loading delay for smoother transition
    useEffect(() => {
        const timer = setTimeout(() => {
            setImagesLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const filteredRecipes = recipes.filter(recipe => {
        // Search filter
        const matchesSearch = recipe.title.includes(searchTerm) ||
            (recipe.tags && recipe.tags.some(t => t.includes(searchTerm)));

        if (!matchesSearch) return false;

        // Child filter: show recipes where this child is in targetChildren
        if (selectedChildId) {
            return recipe.targetChildren && recipe.targetChildren.includes(selectedChildId);
        }

        return true;
    });

    return (
        <div className="container recipe-list-page">
            <div className="page-header">
                <h1 className="page-title">あんしんレシピ</h1>
            </div>

            <div className="filter-section">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="レシピを検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="search-icon" size={20} />
                </div>

                {profile.children.length > 0 && (
                    <div className="child-filter">
                        <button
                            className={`filter-chip ${selectedChildId === null ? 'active' : ''}`}
                            onClick={() => setSelectedChildId(null)}
                        >
                            全員
                        </button>
                        {profile.children.map(child => (
                            <button
                                key={child.id}
                                className={`filter-chip ${selectedChildId === child.id ? 'active' : ''}`}
                                onClick={() => setSelectedChildId(child.id)}
                            >
                                <div className="filter-child-icon">{child.icon || '👶'}</div>
                                {child.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Empty State: No Children */}
            {profile.children.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Heart size={48} color="#FF9F43" />
                    </div>
                    <h3>お子様を登録しましょう</h3>
                    <p>アレルギー情報を登録すると、<br />レシピの安全性をチェックできます</p>
                    <Link to="/profile" className="btn btn-primary">
                        プロフィールを設定
                    </Link>
                </div>
            )}

            {/* Empty State: No Recipes */}
            {profile.children.length > 0 && filteredRecipes.length === 0 && !searchTerm && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Plus size={48} color="#48C9B0" />
                    </div>
                    <h3>レシピをブックマーク</h3>
                    <p>Web上のレシピを保存して、<br />いつでも見返せるようにしましょう</p>
                    <Link to="/recipe/new" className="btn btn-primary">
                        レシピを追加
                    </Link>
                </div>
            )}

            {/* Empty State: No Search Results */}
            {searchTerm && filteredRecipes.length === 0 && (
                <div className="empty-state">
                    <p>「{searchTerm}」に一致するレシピが見つかりませんでした</p>
                </div>
            )}

            {/* Masonry Grid */}
            <div className="masonry-grid">
                {loading || !imagesLoaded ? (
                    // Show skeletons while loading
                    Array.from({ length: 4 }).map((_, i) => (
                        <RecipeCardSkeleton key={i} />
                    ))
                ) : (
                    filteredRecipes.map(recipe => {
                        // Get names of children who can eat this recipe
                        const targetChildren = recipe.targetChildren
                            ? profile.children.filter(c => recipe.targetChildren.includes(c.id))
                            : [];

                        return (
                            <Link to={`/recipe/${recipe.id}`} key={recipe.id} className="recipe-card fade-in">
                                <div className="recipe-image-wrapper">
                                    <img src={recipe.image} alt={recipe.title} className="recipe-image" />
                                    {targetChildren.length > 0 && (
                                        <div className="safety-badges-overlay">
                                            {targetChildren.map(child => (
                                                <span key={child.id} className="mini-child-badge" title={`${child.name}ちゃんOK`}>
                                                    {child.icon || '👶'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.title}</h3>

                                    <div className="recipe-tags">
                                        {recipe.tags && recipe.tags.map(tag => (
                                            <span key={tag} className="tag">#{tag}</span>
                                        ))}
                                    </div>

                                    {recipe.sourceUrl && (
                                        <div className="recipe-source">
                                            <ExternalLink size={12} />
                                            {new URL(recipe.sourceUrl).hostname}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            {recipes.length > 0 && (
                <Link to="/recipe/new" className="fab">
                    <Plus size={24} />
                </Link>
            )}
        </div>
    );
};

export default RecipeListPage;
