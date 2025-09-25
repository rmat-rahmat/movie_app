"use client";

import { useEffect, useState } from "react";
import BaseLayout from '../layout/BaseLayout';
import { useAuthStore } from "@/store/authStore";
import { getImageById } from "@/lib/uploadAPI";

export default function ProtectedLayoutSimplified({ children }: { children: React.ReactNode }) {
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const { user } = useAuthStore();

    // Derive display name and avatar
    const displayName = (user && (user.nickname || user.name || (user.email && user.email.split('@')[0]))) || 'User';
    const initials = displayName
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    // when user changes, update avatar URL
    useEffect(() => {
        const fetchAvatar = async () => {
            if (user) {
                let avatar = user.avatar || '';
                if (user.avatar && !user.avatar.startsWith('http')) {
                    // fetch full URL from upload API
                    const imageUrl = await getImageById(user.avatar, '360')
                    avatar = imageUrl.url || '';
                }
                setAvatarUrl(avatar);
            } else {
                setAvatarUrl('');
            }
        };
        fetchAvatar();
    }, [user]);

    return (
        <BaseLayout 
            type="protected" 
            user={user} 
            avatarUrl={avatarUrl} 
            displayName={displayName} 
            initials={initials}
        >
            {children}
        </BaseLayout>
    );
}