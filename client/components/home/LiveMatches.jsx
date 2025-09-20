'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import LiveMatchCard from './LiveMatchCard';
import TopPicksSkeleton from '../Skeletons/TopPicksSkeleton';
import { selectLiveMatchesRaw, selectLiveMatchesLoading, selectLiveMatchesWarning, selectLiveMatchesCacheAge } from '@/lib/features/matches/liveMatchesSlice';

// Helper function to transform Unibet API data to MatchCard format
const transformLiveMatchData = (apiMatch) => {
    // Extract team names from the match data
    const homeTeam = apiMatch.homeName || apiMatch.participants?.find(p => p.position === 'home')?.name || 'Home Team';
    const awayTeam = apiMatch.awayName || apiMatch.participants?.find(p => p.position === 'away')?.name || 'Away Team';
    
    // Extract odds from betOffers if available
    const odds = {};
    
    // Check if match has betOffers with odds
    if (apiMatch.betOffers && Array.isArray(apiMatch.betOffers)) {
        // Look for Full Time Result market (marketId: 1)
        const fullTimeResultMarket = apiMatch.betOffers.find(offer => 
            offer.marketId === 1 || 
            offer.marketName === 'Full Time Result' ||
            offer.marketName === 'Match Result'
        );
        
        if (fullTimeResultMarket && fullTimeResultMarket.outcomes) {
            fullTimeResultMarket.outcomes.forEach(outcome => {
                const label = outcome.label?.toString().toLowerCase();
                const value = parseFloat(outcome.odds);
                
                if (!isNaN(value)) {
                    // Convert Unibet API odds format (divide by 1000)
                    const convertedValue = (value / 1000).toFixed(2);
                    
                    if (label === '1' || label === 'home') {
                        odds['1'] = { value: convertedValue, oddId: outcome.outcomeId };
                    } else if (label === 'x' || label === 'draw') {
                        odds['X'] = { value: convertedValue, oddId: outcome.outcomeId };
                    } else if (label === '2' || label === 'away') {
                        odds['2'] = { value: convertedValue, oddId: outcome.outcomeId };
                    }
                }
            });
        }
    }
    
    // Check mainBetOffer as fallback
    if (apiMatch.mainBetOffer && apiMatch.mainBetOffer.outcomes) {
        apiMatch.mainBetOffer.outcomes.forEach(outcome => {
            const label = outcome.label?.toString().toLowerCase();
            const value = parseFloat(outcome.odds);
            
            if (!isNaN(value)) {
                // Convert Unibet API odds format (divide by 1000)
                const convertedValue = (value / 1000).toFixed(2);
                
                if (label === '1' || label === 'home') {
                    odds['1'] = { value: convertedValue, oddId: outcome.outcomeId };
                } else if (label === 'x' || label === 'draw') {
                    odds['X'] = { value: convertedValue, oddId: outcome.outcomeId };
                } else if (label === '2' || label === 'away') {
                    odds['2'] = { value: convertedValue, oddId: outcome.outcomeId };
                }
            }
        });
    }

    // Format match time
    const matchDate = new Date(apiMatch.start);
    const now = new Date();
    const isToday = matchDate.toDateString() === now.toDateString();
    
    let displayTime = 'Live';
    if (apiMatch.liveData?.matchClock) {
        const clock = apiMatch.liveData.matchClock;
        if (clock.running) {
            displayTime = `${clock.period} - ${clock.minute}'`;
        } else {
            displayTime = 'HT';
        }
    }

    return {
        id: apiMatch.id,
        league: {
            name: apiMatch.leagueName || 'Live Match',
            imageUrl: '/api/placeholder/20/20' // Default placeholder
        },
        team1: homeTeam,
        team2: awayTeam,
        date: isToday ? 'Today' : matchDate.toLocaleDateString(),
        time: displayTime,
        odds: odds,
        clock: true,
        isLive: true,
        liveData: apiMatch.liveData
    };
};

const LiveMatches = () => {
    const liveMatchesData = useSelector(selectLiveMatchesRaw);
    const loading = useSelector(selectLiveMatchesLoading);
    const warning = useSelector(selectLiveMatchesWarning);
    const cacheAge = useSelector(selectLiveMatchesCacheAge);

    // Show skeleton while loading
    if (loading) {
        return <TopPicksSkeleton />;
    }

    // Transform API data to MatchCard format and filter out matches without valid odds
    const transformedMatches = liveMatchesData
        .map(match => transformLiveMatchData(match))
        .filter(match => {
            // Only show matches that have valid odds
            const hasValidOdds = match.odds && Object.keys(match.odds).length > 0;
            return hasValidOdds;
        });

    if (transformedMatches.length === 0) {
        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Live Matches</h2>
                    <Link href="/inplay" className="text-green-600 hover:underline text-sm">View All</Link>
                </div>
                <div className="text-gray-500 text-center py-8">
                    No live matches with odds available at the moment.
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Live Matches</h2>
                <Link href="/inplay" className="text-green-600 hover:underline text-sm">View All</Link>
            </div>
            
            {/* Cache Warning */}
            {warning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                                {warning} {cacheAge && `(${cacheAge})`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {transformedMatches.slice(0, 8).map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
};

export default LiveMatches;
