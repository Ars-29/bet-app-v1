'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLiveMatches, silentUpdateLiveMatches, selectLiveMatchesGrouped, selectLiveMatchesLoading, selectLiveMatchesError } from '@/lib/features/matches/liveMatchesSlice';
import MatchListPage from '@/components/shared/MatchListPage';
import LiveTimer from '@/components/home/LiveTimer';

const InPlayPage = () => {
    const liveMatchesRaw = useSelector(selectLiveMatchesGrouped);
    const loading = useSelector(selectLiveMatchesLoading);
    const error = useSelector(selectLiveMatchesError);
    const dispatch = useDispatch();
    const pollingIntervalRef = useRef(null);
    
    // Initial data fetch
    useEffect(() => {
        dispatch(fetchLiveMatches());
    }, [dispatch]);

    // Set up polling for live matches data (5 seconds)
    useEffect(() => {
        // Start polling every 5 seconds for live matches
        const startPolling = () => {
            pollingIntervalRef.current = setInterval(() => {
                console.log('🔄 In-Play page polling live matches data...');
                dispatch(silentUpdateLiveMatches());
            }, 5000); // Poll every 5 seconds
        };

        // Start polling after initial load
        const timeoutId = setTimeout(() => {
            startPolling();
        }, 2000); // Wait 2 seconds after initial load

        // Cleanup function
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            clearTimeout(timeoutId);
        };
    }, [dispatch]);

    // Pause polling when tab is not visible (performance optimization)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Pause polling when tab is hidden
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    console.log('⏸️ In-Play page polling paused - tab not visible');
                }
            } else {
                // Resume polling when tab becomes visible
                if (!pollingIntervalRef.current) {
                    pollingIntervalRef.current = setInterval(() => {
                        console.log('🔄 In-Play page resuming live matches polling...');
                        dispatch(silentUpdateLiveMatches());
                    }, 5000);
                    console.log('▶️ In-Play page polling resumed - tab visible');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [dispatch]);

    // Transform Unibet API data to match MatchListPage expected format
    const displayMatches = useMemo(() => {
        if (!Array.isArray(liveMatchesRaw)) {
            return [];
        }
        
        return liveMatchesRaw.map(leagueData => ({
            id: leagueData.league || Math.random().toString(36).substr(2, 9),
            name: leagueData.league || 'Unknown League',
            league: {
                id: leagueData.league,
                name: leagueData.league,
                imageUrl: null, // Unibet API doesn't provide league images
            },
            icon: "⚽",
            matches: (leagueData.matches || []).map(match => {
                // Extract team names from Unibet API format
                const team1 = match.homeName || match.team1 || 'Home Team';
                const team2 = match.awayName || match.team2 || 'Away Team';
                
                // Extract odds from Unibet API format
                let odds = {};
                if (match.mainBetOffer && match.mainBetOffer.outcomes) {
                    match.mainBetOffer.outcomes.forEach(outcome => {
                        // Convert Unibet API odds format (divide by 1000)
                        const convertedOdds = outcome.oddsDecimal || (parseFloat(outcome.odds) / 1000).toFixed(2);
                        
                        if (outcome.label === '1' || outcome.label === 'Home') {
                            odds.home = {
                                value: convertedOdds,
                                oddId: outcome.id || outcome.outcomeId,
                                suspended: false
                            };
                        } else if (outcome.label === 'X' || outcome.label === 'Draw') {
                            odds.draw = {
                                value: convertedOdds,
                                oddId: outcome.id || outcome.outcomeId,
                                suspended: false
                            };
                        } else if (outcome.label === '2' || outcome.label === 'Away') {
                            odds.away = {
                                value: convertedOdds,
                                oddId: outcome.id || outcome.outcomeId,
                                suspended: false
                            };
                        }
                    });
                }
                
                // Format start time - ensure it's in the expected format
                let startTime = match.start || match.starting_at;
                
                // If startTime is an ISO string, convert it to the expected format
                if (startTime && typeof startTime === 'string') {
                    try {
                        const date = new Date(startTime);
                        if (!isNaN(date.getTime())) {
                            // Format as "YYYY-MM-DD HH:MM:SS" for MatchListPage compatibility
                            startTime = date.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
                        }
                    } catch (e) {
                        console.warn('Invalid start time format:', startTime);
                        startTime = null;
                    }
                }
                
                return {
                    id: match.id || match.eventId,
                    team1: team1,
                    team2: team2,
                    starting_at: startTime,
                    odds: odds,
                    isLive: true, // Live matches are live
                    league: {
                        name: leagueData.league
                    }
                };
            }),
            matchCount: leagueData.matches?.length || 0,
        }));
    }, [liveMatchesRaw]);

    const inPlayConfig = {
        pageTitle: 'Live Matches',
        breadcrumbText: 'Football | In-Play Matches',
        leagues: displayMatches,
        loading,
        error,
        retryFunction: () => dispatch(fetchLiveMatches()),
        matchTimeComponent: LiveTimer, // Use LiveTimer component for real-time updates
        PageIcon: Clock,
        hideOdds: true, // Hide odds buttons on In-Play page
        noMatchesConfig: {
            title: 'No Live Matches',
            message: 'There are no live matches available at the moment. Check back later for live games.',
            buttonText: 'View All Matches',
            buttonLink: '/',
            Icon: Clock
        }
    };

    return <MatchListPage config={inPlayConfig} />;
};

export default InPlayPage;
