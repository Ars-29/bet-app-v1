'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { getLiveLeagues } from '@/data/dummayLeagues';
import MatchListPage from '@/components/shared/MatchListPage'; // Updated import path

const InPlayPage = () => {
    const formatLiveTime = (liveTime) => {
        // Simplified: if liveTime is provided, use it, otherwise default to '45:00'
        // The MatchListPage will handle the case where liveTime might be from match.liveTime
        return liveTime || '45:00';
    };

    const inPlayConfig = {
        pageTitle: 'Live Matches',
        breadcrumbText: 'Football | In-Play Matches',
        fetchDataFunction: getLiveLeagues,
        matchTimeFormatter: formatLiveTime, // This will be called with match.liveTime by MatchListPage
        PageIcon: Clock,
        noMatchesConfig: {
            title: 'No Live Matches',
            message: 'There are no live matches available at the moment.',
            buttonText: 'View All Matches',
            buttonLink: '/',
            Icon: Clock
        }
    };

    return <MatchListPage config={inPlayConfig} />;
};

export default InPlayPage;
