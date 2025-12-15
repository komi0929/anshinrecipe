import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { User } from 'lucide-react';
import './ChildSelector.css';

const ChildSelector = ({ selected = [], onChange }) => {
    const { profile } = useProfile();

    const toggleChild = (childId) => {
        if (selected.includes(childId)) {
            onChange(selected.filter(id => id !== childId));
        } else {
            onChange([...selected, childId]);
        }
    };

    if (profile.children.length === 0) {
        return (
            <div className="child-selector-empty">
                <p>お子様が登録されていません。</p>
                <p className="text-sm">プロフィールページでお子様を追加してください。</p>
            </div>
        );
    }

    return (
        <div className="child-selector">
            <p className="child-selector-label">誰のためのレシピですか？</p>
            <p className="child-selector-note">選択したお子様が食べられるレシピです</p>

            <div className="child-selector-grid">
                {profile.children.map((child) => (
                    <button
                        key={child.id}
                        type="button"
                        className={`child-selector-item ${selected.includes(child.id) ? 'selected' : ''}`}
                        onClick={() => toggleChild(child.id)}
                    >
                        <div className="child-selector-avatar">
                            {child.photo ? (
                                <img src={child.photo} alt={child.name} className="child-selector-photo" />
                            ) : (
                                <span className="child-selector-icon">{child.icon || '👶'}</span>
                            )}
                        </div>
                        <span className="child-selector-name">{child.name}</span>
                        {selected.includes(child.id) && (
                            <div className="child-selector-check">✓</div>
                        )}
                    </button>
                ))}
            </div>

            {selected.length > 0 && (
                <div className="child-selector-summary">
                    <p>選択中: {profile.children.filter(c => selected.includes(c.id)).map(c => c.name).join('、')}</p>
                </div>
            )}
        </div>
    );
};

export default ChildSelector;
