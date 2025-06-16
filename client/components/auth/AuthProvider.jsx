'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, setInitialized, selectIsInitialized, selectIsLoading } from '@/lib/features/auth/authSlice';

export default function AuthProvider({ children }) {
    const dispatch = useDispatch();
    const isInitialized = useSelector(selectIsInitialized);


    useEffect(() => {
        if (!isInitialized) {
            // Try to get user info from server on app startup
            dispatch(getMe());
        }
    }, [dispatch, isInitialized]);


    // Show loading on initial load until authentication check is complete
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return <>{children}</>;
}
