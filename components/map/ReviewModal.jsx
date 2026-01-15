'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Upload, Check, Camera, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';
import './ReviewModal.css';

export const ReviewModal = ({ restaurantId, isOpen, onClose }) => {
    const { user } = useProfile();
    const [step, setStep] = useState(1); // 1: Type Selection, 2: Details
    const [reviewType, setReviewType] = useState('menu_post'); // 'menu_post' or 'shop_review'

    // Form State
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [pricePaid, setPricePaid] = useState('');
    const [safeAllergens, setSafeAllergens] = useState([]);
    // Anonymous Option
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Menu Selection State
    const [menus, setMenus] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [isCustomMenu, setIsCustomMenu] = useState(false);
    const [customMenuName, setCustomMenuName] = useState('');
    const [menuSearch, setMenuSearch] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // 2. Prepare Data


    // ...



    // Fetch Menus on Open
    useEffect(() => {
        if (isOpen && restaurantId) {
            // Validate UUID before fetching to prevent 400 error
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId);

            if (isUUID) {
                const fetchMenus = async () => {
                    const { data, error } = await supabase
                        .from('menus')
                        .select('id, name, price')
                        .eq('restaurant_id', restaurantId);

                    if (data) setMenus(data);
                    if (error) console.error('Error fetching menus:', error);
                };
                fetchMenus();
            } else {
                console.log('Skipping menu fetch for non-UUID restaurantId:', restaurantId);
                setMenus([]); // Empty menus for mock data
            }

            // Reset State
            setStep(1);
            setRating(0);
            setContent('');
            setImageFile(null);
            setImagePreview(null);
            setSelectedMenu(null);
            setIsCustomMenu(false);
            setCustomMenuName('');
            setSafeAllergens([]);
        }
    }, [isOpen, restaurantId]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleAllergen = (allergen) => {
        setSafeAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (rating === 0) {
            alert('星の数を選択してください');
            setLoading(false);
            return;
        }

        if (reviewType === 'menu_post' && !selectedMenu && !customMenuName) {
            alert('食べたメニューを選択するか、入力してください');
            setLoading(false);
            return;
        }

        // Validate: At least one of content or image is required
        if (!content.trim() && !imageFile) {
            alert('コメントまたは写真、どちらかの入力をお願いします');
            setLoading(false);
            return;
        }

        try {
            let uploadedImageUrl = null;

            // 1. Upload Image if exists
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('recipe-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('recipe-images')
                    .getPublicUrl(fileName);

                uploadedImageUrl = publicUrl;
            }

            // 2. Prepare Data
            const payload = {
                restaurant_id: restaurantId,
                user_id: user?.id,
                rating,
                content,
                price_paid: pricePaid ? parseInt(pricePaid) : null,
                allergens_safe: safeAllergens,
                visit_date: new Date().toISOString(),
                review_type: reviewType,
                images: uploadedImageUrl ? [uploadedImageUrl] : [], // Array format
                is_anonymous: isAnonymous
            };

            if (reviewType === 'menu_post') {
                if (selectedMenu) {
                    payload.menu_id = selectedMenu.id;
                    payload.is_own_menu = false;
                } else {
                    payload.custom_menu_name = customMenuName;
                    payload.is_own_menu = true;
                }
            }

            // 3. Insert
            const { error } = await supabase
                .from('reviews')
                .insert(payload);

            if (error) throw error;

            alert('投稿しました！ありがとうございました。');
            onClose();

        } catch (err) {
            console.error('Submission failed:', err);
            alert(`エラーが発生しました: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Filter Menus
    const filteredMenus = menus.filter(m => m.name.toLowerCase().includes(menuSearch.toLowerCase()));

    // --- RENDER ---

    return (
        <div className="review-modal-overlay">
            <div className="review-modal-container">
                <button onClick={onClose} className="close-btn">
                    <X size={24} />
                </button>

                {step === 1 ? (
                    // STEP 1: SELECT TYPE
                    <div className="step-container">
                        <h2 className="modal-title">何を投稿しますか？</h2>
                        <p className="modal-subtitle">体験をシェアして、みんなの「安心」を作ろう</p>

                        <div className="type-selection">
                            <button
                                className="type-card"
                                onClick={() => { setReviewType('menu_post'); setStep(2); }}
                            >
                                <div className="icon-circle bg-orange-100 text-orange-600">
                                    <Camera size={32} />
                                </div>
                                <h3>食べた！</h3>
                                <p>特定のメニューの感想やアレルギー情報をシェア</p>
                            </button>

                            <button
                                className="type-card"
                                onClick={() => { setReviewType('shop_review'); setStep(2); }}
                            >
                                <div className="icon-circle bg-blue-100 text-blue-600">
                                    <Star size={32} />
                                </div>
                                <h3>お店の感想</h3>
                                <p>お店の雰囲気や対応など全体の感想をシェア</p>
                            </button>
                        </div>
                    </div>
                ) : (
                    // STEP 2: DETAILS FORM
                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="form-header flex justify-between items-center mb-4">
                            <h2 className="modal-title transform-none mb-0">
                                {reviewType === 'menu_post' ? '食べたものの記録' : 'お店の感想'}
                            </h2>
                            {/* Anonymous Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 select-none hover:bg-slate-100 transition-colors">
                                <div className={`w-4 h-4 rounded-full border transition-colors flex items-center justify-center ${isAnonymous ? 'bg-slate-700 border-slate-700' : 'bg-white border-slate-300'}`}>
                                    {isAnonymous && <Check size={10} className="text-white" />}
                                </div>
                                <span className="text-xs font-bold text-slate-600">匿名で投稿</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                />
                            </label>
                        </div>

                        {/* Menu Selection (Only for Menu Post) */}
                        {reviewType === 'menu_post' && (
                            <div className="menu-selection-section">
                                <label className="section-label">食べたメニュー</label>

                                {!selectedMenu && !isCustomMenu ? (
                                    <div className="menu-search-box">
                                        <div className="search-input-wrapper">
                                            <Search size={16} className="text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="メニュー名で検索..."
                                                value={menuSearch}
                                                onChange={e => setMenuSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="menu-list-scroll">
                                            {filteredMenus.map(menu => (
                                                <button
                                                    key={menu.id}
                                                    type="button"
                                                    className="menu-select-item"
                                                    onClick={() => setSelectedMenu(menu)}
                                                >
                                                    {menu.name}
                                                    <span className="price">¥{menu.price}</span>
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="menu-select-item custom-trigger"
                                                onClick={() => setIsCustomMenu(true)}
                                            >
                                                リストにないメニューを入力する
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="selected-menu-display">
                                        <span className="font-bold text-gray-800">
                                            {selectedMenu ? selectedMenu.name : customMenuName}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs text-orange-500 font-bold ml-auto"
                                            onClick={() => { setSelectedMenu(null); setIsCustomMenu(false); }}
                                        >
                                            変更
                                        </button>
                                    </div>
                                )}

                                {isCustomMenu && (
                                    <input
                                        type="text"
                                        className="menu-name-input mt-2"
                                        placeholder="メニュー名を入力（例：米粉のパンケーキ）"
                                        value={customMenuName}
                                        onChange={e => setCustomMenuName(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>
                        )}

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

                        {/* Photo Upload */}
                        <div
                            className="image-upload-placeholder"
                            onClick={() => fileInputRef.current?.click()}
                            style={imagePreview ? { backgroundImage: `url(${imagePreview})`, backgroundSize: 'cover' } : {}}
                        >
                            {!imagePreview && (
                                <>
                                    <Camera size={24} className="upload-icon" />
                                    <span className="upload-text">写真を追加</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
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

                        {/* Text Content */}
                        <textarea
                            className="review-textarea"
                            placeholder="味の感想や、お店の対応について..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? '送信中...' : '投稿する'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
