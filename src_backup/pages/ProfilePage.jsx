import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Edit2, User, ChevronDown, ChevronUp, X } from 'lucide-react';
import './ProfilePage.css';

const ALLERGENS_MAIN = ['卵', '乳', '小麦', 'そば', '落花生', 'えび', 'かに', 'くるみ'];
const ALLERGENS_OTHER = [
    'アーモンド', 'あわび', 'いか', 'いくら', 'オレンジ', 'カシューナッツ',
    'キウイフルーツ', '牛肉', 'ごま', 'さけ', 'さば', '大豆', '鶏肉',
    'バナナ', '豚肉', 'まつたけ', 'もも', 'やまいも', 'りんご', 'ゼラチン'
];

const ProfilePage = () => {
    const { profile, updateUserName, addChild, updateChild, deleteChild } = useProfile();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState(null);

    // Form state
    const [childName, setChildName] = useState('');
    const [childPhoto, setChildPhoto] = useState('');
    const [childAllergies, setChildAllergies] = useState([]);
    const [otherAllergyText, setOtherAllergyText] = useState('');
    const [showOtherAllergens, setShowOtherAllergens] = useState(false);

    const openAddModal = () => {
        setEditingChild(null);
        setChildName('');
        setChildPhoto('');
        setChildAllergies([]);
        setOtherAllergyText('');
        setShowOtherAllergens(false);
        setIsModalOpen(true);
    };

    const openEditModal = (child) => {
        setEditingChild(child);
        setChildName(child.name);
        setChildPhoto(child.photo || '');
        setChildAllergies(child.allergies || []);
        // Extract free text allergies if any (simplified logic)
        setOtherAllergyText('');
        setShowOtherAllergens(false);
        setIsModalOpen(true);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('ファイルサイズは2MB以下にしてください');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setChildPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleAllergy = (allergen) => {
        setChildAllergies(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    const handleSaveChild = (e) => {
        e.preventDefault();
        if (!childName.trim()) return;

        // Combine selected allergies and free text
        let finalAllergies = [...childAllergies];
        if (otherAllergyText.trim()) {
            const customAllergies = otherAllergyText.split(/,|、/).map(s => s.trim()).filter(s => s);
            finalAllergies = [...finalAllergies, ...customAllergies];
        }
        // Remove duplicates
        finalAllergies = [...new Set(finalAllergies)];

        const childData = {
            name: childName,
            photo: childPhoto,
            allergies: finalAllergies
        };

        if (editingChild) {
            updateChild(editingChild.id, childData);
            addToast('お子様の情報を更新しました');
        } else {
            addChild(childData);
            addToast('お子様を追加しました');
        }
        setIsModalOpen(false);
    };

    const handleDeleteChild = (childId) => {
        if (window.confirm('本当に削除しますか？')) {
            deleteChild(childId);
            addToast('お子様を削除しました', 'info');
        }
    };

    const defaultIcons = ['👶', '👧', '👦', '🧒', '😊', '🥰'];
    const getDefaultIcon = (index) => defaultIcons[index % defaultIcons.length];

    return (
        <div className="container profile-page">
            <h1 className="page-title">プロフィール設定</h1>

            {/* Parent Profile */}
            <section className="mb-8">
                <h2 className="section-title">保護者の方</h2>
                <div className="card">
                    <div className="form-group">
                        <label className="form-label">お名前(ニックネーム)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={profile.userName}
                            onChange={(e) => updateUserName(e.target.value)}
                            placeholder="例: ママ、パパ"
                        />
                    </div>
                </div>
            </section>

            {/* Children Profiles */}
            <section>
                <h2 className="section-title">お子様</h2>
                {profile.children.map((child, index) => (
                    <div key={child.id} className="child-card">
                        <div className="child-header">
                            <div className="child-avatar">
                                {child.photo ? (
                                    <img src={child.photo} alt={child.name} className="child-photo" />
                                ) : (
                                    <span className="child-icon-emoji">{getDefaultIcon(index)}</span>
                                )}
                            </div>
                            <div className="child-info flex-1">
                                <h4>{child.name}</h4>
                                <div className="child-allergies">
                                    {child.allergies && child.allergies.length > 0 ? (
                                        child.allergies.map(a => (
                                            <span key={a} className="allergy-tag">{a}</span>
                                        ))
                                    ) : (
                                        <span className="text-sub text-sm">アレルギーなし</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEditModal(child)} className="icon-btn">
                                    <Edit2 size={20} />
                                </button>
                                <button onClick={() => handleDeleteChild(child.id)} className="icon-btn text-alert">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button onClick={openAddModal} className="btn-add-child">
                    <Plus size={24} />
                    お子様を追加する
                </button>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingChild ? 'お子様を編集' : 'お子様を追加'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveChild} className="child-form">
                            {/* Photo Upload - Centered Circular */}
                            <div className="photo-upload-section">
                                <div className="photo-preview-circle">
                                    {childPhoto ? (
                                        <img src={childPhoto} alt="プレビュー" className="preview-image" />
                                    ) : (
                                        <div className="preview-placeholder">
                                            <User size={40} color="#CBD5E1" />
                                        </div>
                                    )}
                                    <label className="photo-upload-overlay">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                                <label className="photo-change-text">
                                    写真を変更する
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label-sm">お名前</label>
                                <input
                                    type="text"
                                    className="form-input-lg"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="お名前を入力"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label-sm">アレルギー（避ける食材）</label>

                                <div className="allergen-grid">
                                    <div className="allergen-label-mini">特定原材料8品目</div>
                                    <div className="allergen-chips">
                                        {ALLERGENS_MAIN.map(allergen => (
                                            <button
                                                key={allergen}
                                                type="button"
                                                className={`allergen-chip ${childAllergies.includes(allergen) ? 'active' : ''}`}
                                                onClick={() => toggleAllergy(allergen)}
                                            >
                                                {allergen}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="allergen-accordion">
                                    <button
                                        type="button"
                                        className="accordion-toggle"
                                        onClick={() => setShowOtherAllergens(!showOtherAllergens)}
                                    >
                                        <span className="flex items-center gap-2">
                                            {showOtherAllergens ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            その他の品目を表示（20品目）
                                        </span>
                                    </button>

                                    {showOtherAllergens && (
                                        <div className="allergen-chips mt-2 fade-in">
                                            {ALLERGENS_OTHER.map(allergen => (
                                                <button
                                                    key={allergen}
                                                    type="button"
                                                    className={`allergen-chip ${childAllergies.includes(allergen) ? 'active' : ''}`}
                                                    onClick={() => toggleAllergy(allergen)}
                                                >
                                                    {allergen}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <label className="form-label-mini">その他（自由入力）</label>
                                    <textarea
                                        className="form-textarea"
                                        value={otherAllergyText}
                                        onChange={(e) => setOtherAllergyText(e.target.value)}
                                        placeholder="例: マンゴー, メロン (カンマ区切りで入力)"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary btn-block btn-lg">
                                    <span className="icon-save">💾</span> 保存する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
