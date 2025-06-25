'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MatchCard from './MatchCard';
import { selectFootballDaily } from '@/lib/features/home/homeSlice';

// Helper function to transform API match data to MatchCard format
const transformMatchData = (apiMatch, leagueName) => {
    // Extract team names from the match name (e.g., "Hammarby vs Halmstad")
    const teamNames = apiMatch.name?.split(' vs ') || ['Team A', 'Team B'];

    // Extract main odds (1, X, 2) from the odds array
    const odds = {};
    if (apiMatch.odds && Array.isArray(apiMatch.odds)) {
        apiMatch.odds.forEach(odd => {
            // Handle different label formats from the API
            const label = odd.label?.toString().toLowerCase();
            const name = odd.name?.toString().toLowerCase();

            if (label === '1' || label === 'home' || name === 'home') {
                odds['1'] = odd.value?.toFixed(2);
            }
            if (label === 'x' || label === 'draw' || name === 'draw') {
                odds['X'] = odd.value?.toFixed(2);
            }
            if (label === '2' || label === 'away' || name === 'away') {
                odds['2'] = odd.value?.toFixed(2);
            }
        });
    }

    // If no odds found in array format, check if odds is an object
    if (Object.keys(odds).length === 0 && apiMatch.odds && typeof apiMatch.odds === 'object' && !Array.isArray(apiMatch.odds)) {
        if (apiMatch.odds.home) odds['1'] = apiMatch.odds.home.toFixed(2);
        if (apiMatch.odds.draw) odds['X'] = apiMatch.odds.draw.toFixed(2);
        if (apiMatch.odds.away) odds['2'] = apiMatch.odds.away.toFixed(2);
    }

    // Format date and time
    const startDate = new Date(apiMatch.starting_at);
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    let dateStr = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    let timeStr = startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
        timeStr = `Today ${timeStr}`;
    } else if (isTomorrow) {
        timeStr = `Tomorrow ${timeStr}`;
    }

    return {
        id: apiMatch.id,
        tournament: leagueName,
        team1: teamNames[0],
        team2: teamNames[1],
        date: dateStr,
        time: timeStr,
        odds: odds,
        clock: true
    };
};

const FootballDaily = () => {
    const footballDaily = useSelector(selectFootballDaily);

    if (footballDaily.length === 0) {
        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Football Daily</h2>
                    <Link href="#" className="text-green-600 hover:underline text-sm">View All</Link>
                </div>
                <div className="text-gray-500 text-center py-8">
                    No matches available at the moment.
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Football Daily</h2>
                <Link href="#" className="text-green-600 hover:underline text-sm">View All</Link>
            </div>

            {footballDaily.map((leagueData) => {
                const transformedMatches = leagueData.matches.map(match =>
                    transformMatchData(match, leagueData.league.name)
                );

                return (
                    <div key={leagueData.league.id} className="mb-6">
                        {/* League Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⚽</span>
                                <h3 className="font-medium text-lg text-gray-800">
                                    {leagueData.league.name}
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {leagueData.match_count} matches
                                </span>
                            </div>
                            <Link
                                href={`/leagues/${leagueData.league.id}`}
                                className="text-green-600 hover:underline text-sm"
                            >
                                More {leagueData.league.name}
                            </Link>
                        </div>

                        {/* Matches Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {transformedMatches.slice(0, 4).map((match) => (
                                <MatchCard key={match.id} match={match} />
                            ))}
                        </div>

                        {/* Show more matches if available */}
                        {leagueData.matches.length > 4 && (
                            <div className="text-center">
                                <Link
                                    href={`/leagues/${leagueData.league.id}`}
                                    className="text-green-600 hover:underline text-sm"
                                >
                                    Show {leagueData.matches.length - 4} more matches
                                </Link>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FootballDaily;
