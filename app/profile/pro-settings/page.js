'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Star,
    Save,
    Instagram,
    Youtube,
    ExternalLink,
    User,
    FileText
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import './ProSettings.css';

// X (Twitter) icon component
const XIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

/**
 * プロユーザー向けプロフィール設定ページ
 * 自己紹介、SNSリンクの編集
 */
export default function ProSettingsPage() {
    const router = useRouter();
    const { profile, user, loading, updateProProfile } = useProfile();

    const [bio, setBio] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [blogUrl, setBlogUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setBio(profile.bio || '');
            setInstagramUrl(profile.instagramUrl || '');
            setTwitterUrl(profile.twitterUrl || '');
            setYoutubeUrl(profile.youtubeUrl || '');
            setBlogUrl(profile.blogUrl || '');
        }
    }, [profile]);

    // Track changes
    useEffect(() => {
        if (profile) {
            const changed =
                bio !== (profile.bio || '') ||
                instagramUrl !== (profile.instagramUrl || '') ||
                twitterUrl !== (profile.twitterUrl || '') ||
                youtubeUrl !== (profile.youtubeUrl || '') ||
                blogUrl !== (profile.blogUrl || '');
            setHasChanges(changed);
        }
    }, [bio, instagramUrl, twitterUrl, youtubeUrl, blogUrl, profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProProfile({
                bio,
                instagramUrl,
                twitterUrl,
                youtubeUrl,
                blogUrl
            });
            setHasChanges(false);
        } finally {
            setSaving(false);
        }
    };

    // Redirect if not logged in or not a pro user
    if (loading) {
        return (
            <div className="pro-settings-page">
                <div className="pro-settings-loading">
                    <div className="loading-spinner" />
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="pro-settings-page">
                <div className="pro-settings-error">
                    <p>ログインが必要です</p>
                    <Link href="/pro/login">
                        <Button>プロユーザーログイン</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!profile?.isPro) {
        return (
            <div className="pro-settings-page">
                <div className="pro-settings-error">
                    <div className="pro-error-icon">🔒</div>
                    <h2>プロユーザー限定</h2>
                    <p>この機能はプロユーザーのみご利用いただけます</p>
                    <button onClick={() => router.back()} className="pro-back-button">
                        <ArrowLeft size={18} />
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pro-settings-page">
            {/* Header */}
            <div className="pro-settings-header">
                <button onClick={() => router.back()} className="pro-back-icon">
                    <ArrowLeft size={24} />
                </button>
                <h1>プロフィール設定</h1>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`pro-save-button ${hasChanges ? 'active' : ''}`}
                >
                    <Save size={20} />
                </button>
            </div>

            {/* Form */}
            <div className="pro-settings-content">
                {/* Pro Badge */}
                <div className="pro-settings-badge">
                    <Star size={16} fill="currentColor" />
                    認証済みプロユーザー
                </div>

                {/* Preview Link */}
                <Link href={`/pro/${user.id}`} className="pro-preview-link">
                    <User size={18} />
                    公開プロフィールを見る
                    <ExternalLink size={14} />
                </Link>

                {/* Bio Section */}
                <div className="pro-form-section">
                    <label className="pro-form-label">
                        <FileText size={18} />
                        自己紹介
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="あなたの専門分野や活動内容を紹介してください..."
                        className="pro-textarea"
                        rows={5}
                        maxLength={500}
                    />
                    <span className="pro-char-count">{bio.length}/500文字</span>
                </div>

                {/* SNS Links Section */}
                <div className="pro-form-section">
                    <h3 className="pro-section-title">SNSリンク</h3>

                    <div className="pro-input-group">
                        <div className="pro-input-icon instagram">
                            <Instagram size={18} />
                        </div>
                        <Input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="https://instagram.com/username"
                            className="pro-input"
                        />
                    </div>

                    <div className="pro-input-group">
                        <div className="pro-input-icon twitter">
                            <XIcon size={16} />
                        </div>
                        <Input
                            type="url"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            placeholder="https://x.com/username"
                            className="pro-input"
                        />
                    </div>

                    <div className="pro-input-group">
                        <div className="pro-input-icon youtube">
                            <Youtube size={18} />
                        </div>
                        <Input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/@channel"
                            className="pro-input"
                        />
                    </div>

                    <div className="pro-input-group">
                        <div className="pro-input-icon blog">
                            <ExternalLink size={18} />
                        </div>
                        <Input
                            type="url"
                            value={blogUrl}
                            onChange={(e) => setBlogUrl(e.target.value)}
                            placeholder="https://yourblog.com"
                            className="pro-input"
                        />
                    </div>
                </div>

                {/* Save Button (Mobile) */}
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`pro-save-button-mobile ${hasChanges ? '' : 'disabled'}`}
                >
                    {saving ? '保存中...' : '変更を保存'}
                </Button>
            </div>
        </div>
    );
}
