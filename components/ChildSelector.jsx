import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { Check } from 'lucide-react';
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

    if (!profile?.children || profile.children.length === 0) {
        return (
            <div className="child-selector-empty">
                <p>お子様が登録されていません。</p>
                <p className="text-sm">プロフィールページでお子様を追加してください。</p>
            </div>
        );
    }

    return (
        <div className="child-selector">
            <div className="child-selector-grid">
                {profile.children.map(child => (
                    <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChild(child.id)}
                        className={`child-select-card ${selected.includes(child.id) ? 'selected' : ''}`}
                    >
                        <div className="child-select-icon">
                            {child.photo ? (
                                <img src={child.photo} alt={child.name} />
                            ) : (
                                <span>{child.icon}</span>
                            )}
                        </div>
                        <div className="child-select-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                            <span className="child-select-name" style={{ fontWeight: 'bold' }}>{child.name}</span>
                            {child.allergens && child.allergens.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {child.allergens.map(a => (
                                        <span key={a} style={{ fontSize: '12px', padding: '2px 8px', background: '#fff7ed', color: '#ea580c', borderRadius: '9999px', fontWeight: 'bold', border: '1px solid #fed7aa' }}>
                                            {a}なし
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selected.includes(child.id) && (
                            <Check size={20} className="check-icon" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ChildSelector;
