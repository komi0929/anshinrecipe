'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';
import { COLLECTION_ICONS, COLLECTION_COLORS } from '@/hooks/useCollections';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import './CollectionModal.css';

/**
 * CollectionModal - コレクション作成・編集モーダル
 */

export const CollectionModal = ({
    isOpen,
    onClose,
    onSave,
    editingCollection = null,
    isLoading = false,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('📁');
    const [color, setColor] = useState('#f97316');
    const [errors, setErrors] = useState({});

    // Reset form when modal opens/closes or editing changes
    useEffect(() => {
        if (isOpen) {
            if (editingCollection) {
                setName(editingCollection.name || '');
                setDescription(editingCollection.description || '');
                setIcon(editingCollection.icon || '📁');
                setColor(editingCollection.color || '#f97316');
            } else {
                setName('');
                setDescription('');
                setIcon('📁');
                setColor('#f97316');
            }
            setErrors({});
        }
    }, [isOpen, editingCollection]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!name.trim()) {
            newErrors.name = '名前を入力してください';
        }
        if (name.length > 30) {
            newErrors.name = '30文字以内で入力してください';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            name: name.trim(),
            description: description.trim(),
            icon,
            color,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="collection-modal-overlay" onClick={onClose}>
            <div
                className="collection-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-row">
                        <FolderPlus size={20} className="text-primary" />
                        <h2>{editingCollection ? 'コレクションを編集' : '新しいコレクション'}</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Preview */}
                    <div className="collection-preview-section">
                        <div
                            className="collection-preview-card"
                            style={{ '--preview-color': color }}
                        >
                            <span className="preview-icon">{icon}</span>
                            <span className="preview-name">{name || 'コレクション名'}</span>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="form-group">
                        <label>
                            コレクション名 <span className="required">*</span>
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: null });
                            }}
                            placeholder="例: お弁当レシピ"
                            maxLength={30}
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && (
                            <p className="error-message">{errors.name}</p>
                        )}
                        <p className="char-count">{name.length}/30</p>
                    </div>

                    {/* Description (Optional) */}
                    <div className="form-group">
                        <label>説明（任意）</label>
                        <Input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="例: 毎日のお弁当に使えるレシピ集"
                            maxLength={100}
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="form-group">
                        <label>アイコン</label>
                        <div className="icon-picker">
                            {COLLECTION_ICONS.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`icon-option ${icon === i ? 'selected' : ''}`}
                                    onClick={() => setIcon(i)}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="form-group">
                        <label>カラー</label>
                        <div className="color-picker">
                            {COLLECTION_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                >
                                    {color === c && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                        >
                            キャンセル
                        </button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? '保存中...' : (editingCollection ? '保存' : '作成')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CollectionModal;
