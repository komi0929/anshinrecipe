/**
 * ユーティリティ関数（92件改善 Phase5）
 * 5.83-5.90 共通ユーティリティ
 */

// 日付フォーマット
export const formatDate = (date, format = 'short') => {
    if (!date) return '';
    const d = new Date(date);
    
    const formats = {
        short: new Intl.DateTimeFormat('ja-JP', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        }),
        long: new Intl.DateTimeFormat('ja-JP', { 
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        }),
        time: new Intl.DateTimeFormat('ja-JP', { 
            hour: '2-digit', minute: '2-digit'
        }),
        relative: null // 特殊処理
    };

    if (format === 'relative') {
        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'たった今';
        if (minutes < 60) return `${minutes}分前`;
        if (hours < 24) return `${hours}時間前`;
        if (days < 7) return `${days}日前`;
        return formats.short.format(d);
    }

    return formats[format].format(d);
};

// 数値フォーマット
export const formatNumber = (num, options = {}) => {
    if (num === null || num === undefined) return '';
    
    const { compact = false, currency = false, decimals = 0 } = options;

    if (compact) {
        if (num >= 10000) return Math.floor(num / 10000) + '万';
        if (num >= 1000) return Math.floor(num / 1000) + 'k';
        return num.toString();
    }

    if (currency) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(num);
    }

    return new Intl.NumberFormat('ja-JP', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};

// 電話番号フォーマット
export const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
};

// テキスト切り詰め
export const truncate = (text, maxLength, suffix = '...') => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
};

// URLパラメータ解析
export const parseQueryString = (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
};

// クエリ文字列生成
export const buildQueryString = (params) => {
    const filtered = Object.entries(params).filter(([_, v]) => v != null && v !== '');
    return new URLSearchParams(filtered).toString();
};

// ランダムID生成
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// ディープクローン
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const copy = {};
        Object.keys(obj).forEach(key => {
            copy[key] = deepClone(obj[key]);
        });
        return copy;
    }
    return obj;
};

// オブジェクト比較
export const isEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || a === null || b === null) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => isEqual(a[key], b[key]));
};

// 配列からユニーク値を抽出
export const unique = (arr, key) => {
    if (!key) return [...new Set(arr)];
    const seen = new Set();
    return arr.filter(item => {
        const val = item[key];
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
    });
};

// 配列をグループ化
export const groupBy = (arr, key) => {
    return arr.reduce((acc, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});
};

// スリープ
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// クラス名結合
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

export default {
    formatDate,
    formatNumber,
    formatPhone,
    truncate,
    parseQueryString,
    buildQueryString,
    generateId,
    deepClone,
    isEqual,
    unique,
    groupBy,
    sleep,
    cn
};
