"use client"
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronDown, Clock } from "lucide-react";
import LeagueDropdown from "./LeagueDropdown";
import leaguesData from "@/data/dummayLeagues";

const LeagueHeader = ({ leagueId }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const triggerRef = useRef(null);
    const currentLeague = leaguesData.find(league => league.id === parseInt(leagueId));
    const league = currentLeague || leaguesData[0];

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    return (
        <div className="mb-4 bg-white p-3 w-screen">
            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-slate-500 mb-3">
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 truncate">Football | {league.name}</span>
            </div>

            {/* League Header */}
            <div className="relative">
                <div className="p-4 pl-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div
                            className="flex items-center cursor-pointer hover:bg-gray-50 py-2 px-3 rounded-2xl transition-colors"
                            onClick={toggleDropdown}
                            ref={triggerRef}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{league.icon}</span>
                                <span className="text-lg font-medium">{league.name}</span>
                            </div>
                            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                    </div>
                </div>

                <LeagueDropdown
                    leagues={leaguesData}
                    isOpen={isDropdownOpen}
                    onClose={closeDropdown}
                    triggerRef={triggerRef}
                    currentLeagueId={leagueId}
                />
            </div>
        </div>
    );
};

export default LeagueHeader;
