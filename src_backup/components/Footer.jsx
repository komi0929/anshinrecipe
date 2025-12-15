import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-links">
                <Link to="/terms" className="footer-link">利用規約</Link>
                <span className="separator">|</span>
                <Link to="/privacy" className="footer-link">プライバシーポリシー</Link>
                <span className="separator">|</span>
                <a href="mailto:support@example.com" className="footer-link">お問い合わせ</a>
            </div>

            <p className="footer-disclaimer">
                ※本アプリのレシピ情報は安全を完全に保証するものではありません。
            </p>

            <p className="copyright">&copy; 2025 Anshin Recipe</p>
        </footer>
    );
};

export default Footer;
