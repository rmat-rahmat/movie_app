"use client";

import BaseLayout from '../layout/BaseLayout';

export default function GuestLayoutSimplified({ children }: { children: React.ReactNode }) {
    return (
        <BaseLayout type="guest">
            {children}
        </BaseLayout>
    );
}