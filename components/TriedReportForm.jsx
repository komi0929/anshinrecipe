'use client'

import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { createTriedReport } from '../lib/actions/socialActions';
import { uploadImage } from '../lib/imageUpload';
import { useToast } from './Toast';
import './TriedReportForm.css';

const TriedReportForm = ({ recipeId, userId, onSuccess, onCancel }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [comment, setComment] = useState('');
    const [reaction, setReaction] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const { addToast } = useToast();

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            addToast('画像ファイルを選択してください', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            addToast('画像サイズは5MB以下にしてください', 'error');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim() && !imageFile) {
            addToast('コメントまたは画像を入力してください', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = null;

            // Upload image if selected
            if (imageFile) {
                setIsUploading(true);
                try {
                    uploadedImageUrl = await uploadImage(imageFile);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    addToast('画像のアップロードに失敗しました', 'error');
                    setIsUploading(false);
                    setIsSubmitting(false);
                    return;
                }
                setIsUploading(false);
            }

            // Create report
            const report = await createTriedReport(recipeId, {
                imageUrl: uploadedImageUrl,
                comment: comment.trim() || null,
                reaction
            }, userId);

            addToast('レポートを投稿しました！', 'success');
            setImageFile(null);
            setImagePreview('');
            setComment('');
            setReaction(null);
            if (onSuccess) onSuccess(report);
        } catch (error) {
            console.error('Failed to create report:', error);
            addToast('投稿に失敗しました', 'error');
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    return (
        <div className="tried-report-form">
            <div className="form-header">
                <h3>つくってみたレポート</h3>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="close-btn">
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>画像 (任意)</label>

                    {!imagePreview ? (
                        <div
                            className="image-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={32} className="upload-icon" />
                            <p>クリックして画像を選択</p>
                            <p className="upload-hint">JPG, PNG (最大5MB)</p>
                        </div>
                    ) : (
                        <div className="image-preview-container">
                            <img src={imagePreview} alt="Preview" className="image-preview" />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="remove-image-btn"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="form-group">
                    <label>お子さまの反応</label>
                    <div className="reaction-selector">
                        {[
                            { id: 'ate_all', emoji: '😋', label: '完食！' },
                            { id: 'ate_some', emoji: '👍', label: 'パクパク' },
                            { id: 'challenge', emoji: '😯', label: '挑戦！' },
                            { id: 'struggled', emoji: '😓', label: '苦戦...' },
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                className={`reaction-btn ${reaction === r.id ? 'selected' : ''}`}
                                onClick={() => setReaction(reaction === r.id ? null : r.id)}
                            >
                                <span className="reaction-emoji">{r.emoji}</span>
                                <span className="reaction-label">{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>コメント (任意)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="作ってみた感想や工夫した点など..."
                        className="form-textarea"
                        rows={4}
                    />
                </div>

                <div className="form-actions">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="btn-secondary">
                            キャンセル
                        </button>
                    )}
                    <button type="submit" className="btn-primary" disabled={isSubmitting || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>アップロード中...</span>
                            </>
                        ) : isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>投稿中...</span>
                            </>
                        ) : (
                            <span>投稿する</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TriedReportForm;
