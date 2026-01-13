'use client';

import React, { useState } from 'react';
import { X, Star, Upload, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';
import './ReviewModal.css';

export const ReviewModal = ({ restaurantId, isOpen, onClose }) => {
    const { user } = useProfile();
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [menuName, setMenuName] = useState('');
    const [loading, setLoading] = useState(false);
    const [pricePaid, setPricePaid] = useState('');
    const [selectedMenuId, setSelectedMenuId] = useState(null);
    const [safeAllergens, setSafeAllergens] = useState([]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simple validation
        if (rating === 0) {
            alert('星の数を選択してください');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    restaurant_id: restaurantId,
                    menu_id: selectedMenuId,
                    user_id: user?.id,
                    rating,
                    content,
                    price_paid: pricePaid ? parseInt(pricePaid) : null,
                    allergens_safe: safeAllergens,
                    visit_date: new Date().toISOString(),
                });

            if (error) throw error;

            alert('口コミを投稿しました！');
            onClose();
            // Trigger refresh if needed
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('投稿に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const toggleAllergen = (allergen) => {
        setSafeAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    return (
        <div className="review-modal-overlay">
            <div className="review-modal-container">
                <button onClick={onClose} className="close-btn">
                    <X size={24} />
                </button>

                <h2 className="modal-title">口コミを投稿</h2>
                <p className="modal-subtitle">あなたの体験が、誰かの「安心」に。</p>

                <form onSubmit={handleSubmit} className="review-form">
                    {/* Stars */}
                    <div className="stars-input">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`star-btn ${rating >= star ? 'active' : ''}`}
                            >
                                <Star fill={rating >= star ? '#FBBF24' : 'none'} color={rating >= star ? '#FBBF24' : '#CBD5E1'} size={32} />
                            </button>
                        ))}
                    </div>

                    {/* Allergens Safe Check */}
                    <div className="allergens-input-section">
                        <label className="section-label">対応してくれた（食べられた）もの</label>
                        <div className="allergens-chips">
                            {['wheat', 'milk', 'egg', 'nut'].map(allergen => {
                                const labels = { wheat: '小麦', milk: '乳', egg: '卵', nut: 'ナッツ類' };
                                return (
                                    <button
                                        key={allergen}
                                        type="button"
                                        onClick={() => toggleAllergen(allergen)}
                                        className={`allergen-chip-select ${safeAllergens.includes(allergen) ? 'selected' : ''}`}
                                    >
                                        {safeAllergens.includes(allergen) && <Check size={14} />}
                                        {labels[allergen] || allergen}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Menu Name Input */}
                        <div className="menu-name-input-section flex-1">
                            <label className="section-label">食べたメニュー（必須）</label>
                            <input
                                type="text"
                                className="menu-name-input"
                                placeholder="例：米粉のパンケーキ"
                                value={menuName}
                                onChange={(e) => setMenuName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Price Paid Input */}
                        <div className="price-input-section w-32">
                            <label className="section-label">価格（税込）</label>
                            <input
                                type="number"
                                className="menu-name-input"
                                placeholder="1200"
                                value={pricePaid}
                                onChange={(e) => setPricePaid(e.target.value)}
                            />
                        </div>
                    </div>

                    <textarea
                        className="review-textarea"
                        placeholder="味の感想や、お店の対応について詳しく教えてください"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                    />

                    {/* Image Upload Placeholder - Enhanced */}
                    <div className="image-upload-placeholder">
                        <Upload size={24} className="upload-icon" />
                        <span className="upload-text">写真を追加</span>
                        <span className="upload-subtext">メニューの写真をアップロード</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? '送信中...' : '投稿する'}
                    </button>
                </form>
            </div>
        </div>
    );
};
