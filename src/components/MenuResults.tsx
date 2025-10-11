import React from 'react';
import { MenuItem as MenuItemType } from '../types';
import MenuItem from './MenuItem';
import './MenuResults.css';

interface MenuResultsProps {
    menuItems: MenuItemType[];
    isVisible: boolean;
}

const MenuResults: React.FC<MenuResultsProps> = ({ menuItems, isVisible }) => {
    if (!isVisible || menuItems.length === 0) return null;

    return (
        <div className="menu-results">
            <div className="results-header">
                <h2>🎨 Generated Menu Items</h2>
                <p className="results-subtitle">AI-powered food visuals ready for your menu</p>
            </div>
            <div className="menu-grid">
                {menuItems.map((item, index) => (
                    <MenuItem
                        key={`${item.name}-${index}`}
                        item={item}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
};

export default MenuResults;