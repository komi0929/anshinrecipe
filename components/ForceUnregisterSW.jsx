'use client';

import { useEffect } from 'react';

export default function ForceUnregisterSW() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered');
                }
            });

            // Clear caches
            if ('caches' in window) {
                caches.keys().then(function (names) {
                    for (let name of names) {
                        caches.delete(name);
                        console.log('Cache deleted:', name);
                    }
                });
            }
        }
    }, []);

    return null;
}
