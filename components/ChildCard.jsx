'use client'

import React, { useState } from 'react';
import AllergySelector from './AllergySelector';
import IconPicker from './IconPicker';
import { Edit2, Trash2, Check, X, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import './ChildCard.css';

export const ChildCard = ({ child, onUpdate, onDelete, isNew = false, onSave, onCancel }) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const [editedChild, setEditedChild] = useState(child || {
        name: '',
        icon: '👶',
        photo: null,
        allergens: []
    });
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(child?.photo || null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
                setEditedChild({ ...editedChild, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!editedChild.name.trim()) return;

        if (isNew) {
            onSave(editedChild);
        } else {
            onUpdate(editedChild);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        if (isNew) {
            onCancel();
        } else {
            setEditedChild(child);
            setPhotoPreview(child?.photo || null);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="child-card editing">
                {/* Name Input Section - Top Priority */}
                <div className="child-name-section">
                    <label className="input-label">お子様の名前</label>
                    <input
                        type="text"
                        value={editedChild.name}
                        onChange={(e) => setEditedChild({ ...editedChild, name: e.target.value })}
                        placeholder="例: たろう"
                        className="child-name-input"
                        autoFocus
                    />
                </div>

                {/* Photo/Icon Selection */}
                <div className="child-avatar-section">
                    <label className="input-label">アイコン・写真</label>
                    <div className="avatar-preview-container">
                        <div className="avatar-preview">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="avatar-photo" />
                            ) : (
                                <span className="avatar-icon">{editedChild.icon}</span>
                            )}
                        </div>
                        <div className="avatar-actions">
                            <label className="btn-upload">
                                <Camera size={18} />
                                <span>写真を選択</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {photoPreview && (
                                <button
                                    type="button"
                                    className="btn-remove-photo"
                                    onClick={() => {
                                        setPhotoPreview(null);
                                        setEditedChild({ ...editedChild, photo: null });
                                    }}
                                >
                                    写真を削除
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Icon Picker - Collapsible */}
                    <button
                        type="button"
                        className="toggle-icon-picker"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                    >
                        {showIconPicker ? (
                            <>
                                <ChevronUp size={16} />
                                <span>アイコンを隠す</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                <span>アイコンから選ぶ</span>
                            </>
                        )}
                    </button>

                    {showIconPicker && (
                        <div className="icon-picker-container">
                            <IconPicker
                                selected={editedChild.icon}
                                onChange={(icon) => {
                                    setEditedChild({ ...editedChild, icon });
                                    setPhotoPreview(null); // Clear photo when icon is selected
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Allergy Selection */}
                <div className="child-allergy-section">
                    <AllergySelector
                        selected={editedChild.allergens}
                        onChange={(allergens) => setEditedChild({ ...editedChild, allergens })}
                    />
                </div>

                {/* Action Buttons */}
                <div className="child-card-actions">
                    <button onClick={handleCancel} className="btn-cancel">
                        <X size={20} /> キャンセル
                    </button>
                    <button onClick={handleSave} className="btn-save" disabled={!editedChild.name.trim()}>
                        <Check size={20} /> 保存
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="child-card">
            <div className="child-card-header">
                <div className="child-icon">
                    {child.photo ? (
                        <img src={child.photo} alt={child.name} className="child-photo" />
                    ) : (
                        child.icon
                    )}
                </div>
                <h3 className="child-name">{child.name}</h3>
                <div className="child-actions">
                    <button onClick={() => setIsEditing(true)} className="btn-icon">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={onDelete} className="btn-icon btn-delete">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="child-allergens">
                {child.allergens && child.allergens.length > 0 ? (
                    <div className="allergen-tags">
                        {child.allergens.map(allergen => (
                            <span key={allergen} className="allergen-tag">{allergen}</span>
                        ))}
                    </div>
                ) : (
                    <p className="no-allergens">アレルギーなし</p>
                )}
            </div>
        </div>
    );
};
