import React, { useState } from 'react';
import { ALLERGENS } from '../data/allergens';
import { Plus, X } from 'lucide-react';
import './AllergySelector.css';

const AllergySelector = ({ selected = [], onChange }) => {
    const [customInput, setCustomInput] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleAllergen = (allergen) => {
        if (selected.includes(allergen)) {
            onChange(selected.filter(item => item !== allergen));
        } else {
            onChange([...selected, allergen]);
        }
    };

    const addCustomAllergen = (e) => {
        e.preventDefault();
        if (customInput.trim() && !selected.includes(customInput.trim())) {
            onChange([...selected, customInput.trim()]);
            setCustomInput('');
        }
    };

    // Group allergens for display (Top 8 first)
    const top8 = ALLERGENS.slice(0, 8);
    const others = ALLERGENS.slice(8);

    return (
        <div className="allergy-selector">
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>アレルギー品目を選択</h3>

            {/* Selected Allergens (Chips) */}
            <div className="selected-allergens">
                {selected.length === 0 && <p style={{ color: '#aaa', fontSize: '0.875rem' }}>選択されていません</p>}
                {selected.map(item => (
                    <span key={item} className="chip selected">
                        {item}
                        <button onClick={() => toggleAllergen(item)}>
                            <X size={14} />
                        </button>
                    </span>
                ))}
            </div>

            {/* Selection Area */}
            <div className="selection-area">
                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>特定原材料8品目</p>
                <div className="allergen-group">
                    {top8.map(item => (
                        <button
                            key={item}
                            onClick={() => toggleAllergen(item)}
                            className={`allergen-btn ${selected.includes(item) ? 'active' : ''}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="toggle-link"
                >
                    {isExpanded ? 'その他の品目を隠す' : 'その他の品目（20品目）を表示'}
                </button>

                {isExpanded && (
                    <div className="allergen-group">
                        {others.map(item => (
                            <button
                                key={item}
                                onClick={() => toggleAllergen(item)}
                                className={`allergen-btn ${selected.includes(item) ? 'active' : ''}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                )}

                <div className="custom-input">
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>その他のアレルギー（自由入力）</p>
                    <form onSubmit={addCustomAllergen} className="custom-input-form">
                        <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="例: キウイ"
                        />
                        <button type="submit" className="btn-icon">
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AllergySelector;
