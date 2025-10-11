import React from 'react';
import { MenuItem as MenuItemType } from '../types';
import { escapeHtml } from '../utils';
import './MenuItem.css';

interface MenuItemProps {
    item: MenuItemType;
    index: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, index }) => {
    const renderImage = () => {
        if (item.imageUrl) {
            return (
                <>
                    <img
                        src={item.imageUrl}
                        className="menu-item-image"
                        alt={escapeHtml(item.name)}
                        style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'flex';
                            }
                        }}
                    />
                    <div className="menu-item-image fallback-image" style={{ display: 'none' }}>
                        🍽️ {escapeHtml(item.name)}
                    </div>
                </>
            );
        } else {
            const errorMsg = item.imageError ? ` (${item.imageError})` : '';
            return (
                <div className="menu-item-image fallback-image">
                    🍽️ {escapeHtml(item.name)}{errorMsg}
                </div>
            );
        }
    };

    return (
        <div
            className="menu-item"
            style={{
                animationDelay: `${index * 150}ms`,
            }}
        >
            {renderImage()}
            <div className="menu-item-content">
                <div className="menu-item-name">{escapeHtml(item.name)}</div>
                <div className="menu-item-description">{escapeHtml(item.description)}</div>
                <div className="menu-item-price">💰 {escapeHtml(item.price)}</div>
                {item.nutrition && (
                    <div className="menu-item-nutrition">📊 {escapeHtml(item.nutrition)}</div>
                )}
            </div>
        </div>
    );
};

export default MenuItem;