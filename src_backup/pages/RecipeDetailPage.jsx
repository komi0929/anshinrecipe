import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/Toast';
import { ArrowLeft, CheckCircle, ExternalLink, Trash2, Share2 } from 'lucide-react';
import './RecipeDetailPage.css';

const RecipeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { recipes, deleteRecipe } = useRecipes();
    const { profile } = useProfile();
    const { addToast } = useToast();

    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
        return (
            <div className="container">
                <div className="empty-state">
                    <p>レシピが見つかりませんでした</p>
                    <Link to="/" className="btn btn-primary">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm('このレシピを削除してもよろしいですか？')) {
            deleteRecipe(id);
            addToast('レシピを削除しました', 'info');
            navigate('/');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipe.title,
                    text: `${recipe.title} - あんしんレシピ`,
                    url: recipe.sourceUrl || window.location.href,
                });
                addToast('シェアしました');
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(recipe.sourceUrl || window.location.href);
            addToast('URLをコピーしました');
        }
    };

    // Get children who can eat this recipe
    const targetChildren = recipe.targetChildren
        ? profile.children.filter(c => recipe.targetChildren.includes(c.id))
        : [];

    return (
        <div className="recipe-detail-page">
            <div className="detail-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="detail-title">レシピ詳細</h1>
                <div className="header-actions">
                    <button onClick={handleShare} className="action-button">
                        <Share2 size={20} />
                    </button>
                    <button onClick={handleDelete} className="action-button delete-button">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="detail-image-container">
                <img src={recipe.image} alt={recipe.title} className="detail-image" />
            </div>

            <div className="container">
                <h2 className="recipe-name">{recipe.title}</h2>

                <p className="recipe-description">{recipe.description}</p>

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-tags">
                        {recipe.tags.map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Target Children Info */}
                {targetChildren.length > 0 && (
                    <div className="target-children-section">
                        <h3 className="section-heading">誰のためのレシピ？</h3>
                        <div className="target-children-list">
                            {targetChildren.map(child => (
                                <div key={child.id} className="target-child-item">
                                    <div className="target-child-icon">{child.icon || '👶'}</div>
                                    <span>{child.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="alert alert-success mt-4">
                            <CheckCircle size={20} />
                            <div>
                                <strong>安心レシピ</strong>
                                <p>選択したお子様のアレルギー食材は含まれていません</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="action-section">
                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-large">
                        レシピサイトを開く <ExternalLink size={20} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetailPage;
