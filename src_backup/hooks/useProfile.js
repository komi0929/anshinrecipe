import { useState, useEffect } from 'react';

const STORAGE_KEY = 'anshin_recipe_profile';

export const useProfile = () => {
    const [profile, setProfile] = useState({
        userName: '',
        children: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setProfile(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse profile', e);
            }
        }
        setLoading(false);
    }, []);

    const saveProfile = (newProfile) => {
        setProfile(newProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    };

    const updateUserName = (name) => {
        saveProfile({ ...profile, userName: name });
    };

    const addChild = (child) => {
        const newChildren = [...profile.children, { ...child, id: Date.now().toString() }];
        saveProfile({ ...profile, children: newChildren });
    };

    const updateChild = (id, updatedChild) => {
        const newChildren = profile.children.map(c => c.id === id ? { ...updatedChild, id } : c);
        saveProfile({ ...profile, children: newChildren });
    };

    const deleteChild = (id) => {
        const newChildren = profile.children.filter(c => c.id !== id);
        saveProfile({ ...profile, children: newChildren });
    };

    return {
        profile,
        loading,
        updateUserName,
        addChild,
        updateChild,
        deleteChild
    };
};
