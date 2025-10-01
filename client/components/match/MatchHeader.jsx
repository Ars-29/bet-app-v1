"use client"
import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronDown, Clock } from "lucide-react"
import MatchDropdown from "./MatchDropdown"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Button } from "@/components/ui/button"
import { formatToLocalTime } from '@/lib/utils';

const isMatchLive = (match) => {
    if (!match || !match.start) return false;
    const now = new Date();
    let matchTime;
    if (match.start.includes('T')) {
        matchTime = new Date(match.start.endsWith('Z') ? match.start : match.start + 'Z');
    } else {
        matchTime = new Date(match.start.replace(' ', 'T') + 'Z');
    }
    const matchEnd = new Date(matchTime.getTime() + 120 * 60 * 1000);
    return matchTime <= now && now < matchEnd;
};

// Live Timer Component
const LiveTimer = ({ matchStart, isLive }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentPeriod, setCurrentPeriod] = useState('1st Half');

    useEffect(() => {
        if (!isLive || !matchStart) return;

        const updateTimer = () => {
            const now = new Date();
            let matchTime;
            if (matchStart.includes('T')) {
                matchTime = new Date(matchStart.endsWith('Z') ? matchStart : matchStart + 'Z');
            } else {
                matchTime = new Date(matchStart.replace(' ', 'T') + 'Z');
            }
            
            const elapsed = Math.floor((now.getTime() - matchTime.getTime()) / 1000);
            setElapsedTime(Math.max(0, elapsed));
            
            // Determine period based on elapsed time
            if (elapsed < 45) {
                setCurrentPeriod('1st Half');
            } else if (elapsed < 60) {
                setCurrentPeriod('Half Time');
            } else if (elapsed < 105) {
                setCurrentPeriod('2nd Half');
            } else if (elapsed < 120) {
                setCurrentPeriod('Added Time');
            } else {
                setCurrentPeriod('Full Time');
            }
        };

        // Update immediately
        updateTimer();
        
        // Update every second
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
    }, [isLive, matchStart]);

    if (!isLive) return null;

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600 animate-pulse">
                {displayTime}
            </div>
            <div className="text-xs text-gray-500">
                {currentPeriod}
            </div>
        </div>
    );
};

// Utility function to parse match name and extract home and away teams
const parseTeamsFromName = (matchName) => {
    if (!matchName) {
        return { homeTeam: null, awayTeam: null };
    }

    // Split by "vs" and trim whitespace
    const parts = matchName.split('vs').map(part => part.trim());
    
    if (parts.length === 2) {
        return {
            homeTeam: parts[0],
            awayTeam: parts[1]
        };
    }

    // Fallback if no "vs" found
    return { homeTeam: null, awayTeam: null };
};

const MatchHeader = ({ matchData }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const triggetRef = useRef(null)
    const router = useRouter()

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    if (!matchData) {
        return null;
    }

    // Handle both old and new API data formats
    const isLive = isMatchLive(matchData);
    
    // Get team names - try participants first (new API), then parse from name
    let homeTeam, awayTeam;
    if (matchData.participants && matchData.participants.length >= 2) {
        // New API format with participants
        const homeParticipant = matchData.participants.find(p => p.position === 'home');
        const awayParticipant = matchData.participants.find(p => p.position === 'away');
        homeTeam = homeParticipant?.name || 'Home';
        awayTeam = awayParticipant?.name || 'Away';
    } else {
        // Old API format - parse from name
        const { homeTeam: parsedHome, awayTeam: parsedAway } = parseTeamsFromName(matchData.name);
        homeTeam = parsedHome || 'Home';
        awayTeam = parsedAway || 'Away';
    }

    // Get league name
    const leagueName = matchData.league?.name || matchData.league || 'Unknown League';

    // Get match time/score
    const matchTime = matchData.start ? formatToLocalTime(matchData.start) : 'TBD';
    
    // Get live data if available
    const liveData = matchData.liveData;
    const score = liveData?.score || '0-0';
    const period = liveData?.period || '1st Half';
    const minute = liveData?.minute || '0';

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            {/* Back button */}
            <div className="flex items-center mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </div>

            {/* Match info */}
            <div className="text-center mb-4">
                <div className="text-sm text-gray-600 mb-2">
                    {leagueName}
                </div>
                <div className="flex items-center justify-center text-sm mb-2">
                    {isLive ? (
                        <div className="flex items-center text-red-600 font-bold animate-pulse">
                            <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
                            LIVE
                        </div>
                    ) : (
                        <div className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {matchTime}
                        </div>
                    )}
                </div>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between">
                {/* Home team */}
                <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-gray-800">
                        {homeTeam}
                    </div>
                </div>

                {/* Score/Time */}
                <div className="flex-1 text-center">
                    {isLive ? (
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-gray-800">
                                {score}
                            </div>
                            <LiveTimer matchStart={matchData.start} isLive={isLive} />
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            {matchTime}
                        </div>
                    )}
                </div>

                {/* Away team */}
                <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-gray-800">
                        {awayTeam}
                    </div>
                </div>
            </div>

            {/* Match dropdown - COMMENTED OUT FOR NOW */}
            {/*
            <div className="mt-4 flex justify-center">
                <div className="relative">
                    <Button
                        ref={triggetRef}
                        variant="outline"
                        size="sm"
                        onClick={toggleDropdown}
                        className="flex items-center text-gray-600 hover:text-gray-800"
                    >
                        Match Info
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                    
                    {isDropdownOpen && (
                        <MatchDropdown
                            matchData={matchData}
                            isOpen={isDropdownOpen}
                            onClose={() => setIsDropdownOpen(false)}
                            triggerRef={triggetRef}
                            currentLeagueId={matchData?.groupId || matchData?.group}
                        />
                    )}
                </div>
            </div>
            */}
        </div>
    );
};

export default MatchHeader;