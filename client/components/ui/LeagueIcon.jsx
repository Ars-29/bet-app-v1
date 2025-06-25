'use client';

import React, { useState } from 'react';

const LeagueIcon = ({ league, size = "sm", className = "" }) => {
    const [imageError, setImageError] = useState(false);

    // Size configurations
    const sizeClasses = {
        xs: "w-4 h-4",
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
        xl: "w-12 h-12"
    };

    const textSizes = {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl"
    };

    // If we have an image URL and no error, show the image
    if (league.imageUrl && !imageError) {
        return (
            <img
                src={league.imageUrl}
                alt={`${league.name} logo`}
                className={`${sizeClasses[size]} object-contain rounded ${className}`}
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
            />
        );
    }

    // Fallback to emoji icon
    return (
        <span className={`${textSizes[size]} ${className}`}>
            {league.icon || "⚽"}
        </span>
    );
};

export default LeagueIcon;
