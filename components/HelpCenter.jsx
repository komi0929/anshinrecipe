"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Search,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";

/**
 * ヘルプ・FAQコンポーネント（92件改善 Phase5）
 * 5.93-5.95 ヘルプ・サポート機能
 */

// FAQアコーディオン
export const FAQAccordion = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-bold text-sm text-slate-700 pr-2">
              {faq.question}
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform flex-shrink-0 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 pt-0">
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                {faq.answer}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ヘルプセンターページ
export const HelpCenter = ({ faqs = [], contactInfo = {} }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqs;

  const categories = [
    { id: "account", label: "アカウント", icon: "👤" },
    { id: "allergy", label: "アレルギー対応", icon: "🍽️" },
    { id: "post", label: "投稿について", icon: "✏️" },
    { id: "owner", label: "店舗オーナー", icon: "🏪" },
    { id: "other", label: "その他", icon: "❓" },
  ];

  return (
    <div className="space-y-6">
      {/* 検索 */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="質問を検索..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
        />
      </div>

      {/* カテゴリ */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className="p-3 bg-white border border-slate-200 rounded-xl text-center hover:border-orange-300 transition-colors"
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-xs text-slate-600 font-bold">{cat.label}</div>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <HelpCircle size={18} className="text-orange-500" />
          よくある質問
        </h3>
        <FAQAccordion faqs={filteredFaqs} />
      </div>

      {/* お問い合わせ */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
        <h3 className="font-bold text-slate-800 mb-3">お問い合わせ</h3>
        <div className="space-y-2">
          {contactInfo.email && (
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail size={18} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-slate-700">メール</div>
                <div className="text-xs text-slate-500">
                  {contactInfo.email}
                </div>
              </div>
              <ExternalLink size={16} className="text-slate-400" />
            </a>
          )}
          {contactInfo.line && (
            <a
              href={contactInfo.line}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-green-500" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-slate-700">LINE</div>
                <div className="text-xs text-slate-500">公式アカウント</div>
              </div>
              <ExternalLink size={16} className="text-slate-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ヘルプツールチップ
export const HelpTooltip = ({ content }) => (
  <span className="inline-flex items-center" title={content}>
    <HelpCircle
      size={14}
      className="text-slate-400 hover:text-slate-600 cursor-help"
    />
  </span>
);

export default { FAQAccordion, HelpCenter, HelpTooltip };
