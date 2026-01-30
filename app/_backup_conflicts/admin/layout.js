// Admin-specific layout - NO app container, NO bottom nav
export default function AdminLayout({ children }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            zIndex: 9999
        }}>
            {children}
        </div>
    );
}
