import React from 'react';
import { CHILD_ICONS } from '../src/data/icons';
import './IconPicker.css';

const IconPicker = ({ selected, onChange }) => {
    return (
        <div className="icon-picker">
            <p className="icon-picker-label">アイコンを選択</p>
            <div className="icon-grid">
                {CHILD_ICONS.map((icon, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`icon-button ${selected === icon ? 'selected' : ''}`}
                        onClick={() => onChange(icon)}
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default IconPicker;
