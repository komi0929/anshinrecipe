"use client";

import React, { useState } from "react";
import { Bell, Clock, Calendar, X, Check } from "lucide-react";

/**
 * 通知リマインダー設定コンポーネント（92件改善 Phase4）
 * 4.13-4.15 通知リマインダー
 */

export const NotificationSettings = ({ settings = {}, onChange }) => {
  const [localSettings, setLocalSettings] = useState({
    newReview: settings.newReview ?? true,
    reviewReply: settings.reviewReply ?? true,
    ownerResponse: settings.ownerResponse ?? true,
    weeklyDigest: settings.weeklyDigest ?? false,
    newBadge: settings.newBadge ?? true,
    pushEnabled: settings.pushEnabled ?? false,
    emailEnabled: settings.emailEnabled ?? false,
    ...settings,
  });

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onChange?.(newSettings);
  };

  const NotificationToggle = ({
    label,
    description,
    settingKey,
    icon: Icon,
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-slate-500" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm text-slate-700">{label}</div>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => handleChange(settingKey, !localSettings[settingKey])}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
          localSettings[settingKey] ? "bg-orange-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            localSettings[settingKey] ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 通知タイプ */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Bell size={18} className="text-orange-500" />
          通知設定
        </h3>
        <NotificationToggle
          label="新しい口コミ"
          description="あなたの投稿に口コミがついた時"
          settingKey="newReview"
          icon={Bell}
        />
        <NotificationToggle
          label="口コミへの返信"
          description="あなたの口コミに返信があった時"
          settingKey="reviewReply"
          icon={Bell}
        />
        <NotificationToggle
          label="オーナーからの返信"
          description="店舗オーナーから返信があった時"
          settingKey="ownerResponse"
          icon={Bell}
        />
        <NotificationToggle
          label="新しいバッジ"
          description="新しいバッジを獲得した時"
          settingKey="newBadge"
          icon={Bell}
        />
      </div>

      {/* 配信方法 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" />
          配信方法
        </h3>
        <NotificationToggle
          label="プッシュ通知"
          description="ブラウザにプッシュ通知を送信"
          settingKey="pushEnabled"
          icon={Bell}
        />
        <NotificationToggle
          label="週刊ダイジェスト"
          description="毎週月曜日にメールで活動サマリーを送信"
          settingKey="weeklyDigest"
          icon={Calendar}
        />
      </div>
    </div>
  );
};

// 投稿リマインダー
export const PostReminder = ({ lastPostDate, onDismiss, onPost }) => {
  const daysSinceLastPost = lastPostDate
    ? Math.floor((Date.now() - new Date(lastPostDate)) / (1000 * 60 * 60 * 24))
    : null;

  if (!daysSinceLastPost || daysSinceLastPost < 14) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
      <div className="flex items-start gap-3">
        <div className="text-3xl">📝</div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800">
            前回の投稿から{daysSinceLastPost}日経ちました
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            アレルギーっ子ママパパのために、あなたの経験をシェアしませんか？
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onPost}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
            >
              投稿する
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200"
            >
              あとで
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// シェアボーナス通知
export const ShareBonusNotification = ({
  shareCount = 0,
  nextBonusAt = 5,
  onDismiss,
}) => {
  const remaining = nextBonusAt - shareCount;
  if (remaining <= 0 || remaining > 3) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎁</div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm">
            あと{remaining}回シェアでボーナス！
          </h4>
          <p className="text-xs text-slate-500">特別バッジがもらえます</p>
        </div>
        <button onClick={onDismiss} className="text-slate-400">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default { NotificationSettings, PostReminder, ShareBonusNotification };
