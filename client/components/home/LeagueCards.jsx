'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import leaguesData from '@/data/dummayLeagues';
// League Card Component
const LeagueCard = ({ league }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-none shadow-none mb-4 h-[495px] flex flex-col">
            {/* League Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{league.icon}</span>
                        <div>
                            <h3 className="font-medium text-sm text-gray-800">{league.name}</h3>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {league.day}
                    </div>
                </div>
            </div>

            {/* Odds Header */}
            <div className="flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
                <div className="flex-1 text-xs">Today</div>
                <div className="flex gap-1">
                    <div className="w-14 text-center text-xs text-gray-600 font-medium">1</div>
                    <div className="w-14 text-center text-xs text-gray-600 font-medium">X</div>
                    <div className="w-14 text-center text-xs text-gray-600 font-medium">2</div>
                </div>
            </div>

            {/* Matches */}
            <div className="p-4 py-0 flex-1 overflow-y-auto">
                {league.matches.slice(0, 4).map((match, index) => (

                    <div key={match.id}>
                        <div className='flex justify-between mt-2  '>
                            <div className=" text-xs text-gray-600">21:00</div>
                            <div className=" text-xs text-gray-500">+358</div>
                        </div>
                        <Link href={`/matches/${match.id}`}>
                            <div className="cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-1 rounded">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="text-[12px] mb-1" title={match.team1}>
                                            {match.team1.length > 6 ? `${match.team1.slice(0, 18)}...` : match.team1}
                                        </div>
                                        <div className="text-[12px]" title={match.team2}>
                                            {match.team2.length > 6 ? `${match.team2.slice(0, 18)}...` : match.team2}
                                        </div>
                                    </div>

                                    <div className="flex items-center  flex-shrink-0">
                                        {/* <div className="text-right text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                {match.clock && <span>⏰</span>}
                                                <span>{match.time}</span>
                                            </div>
                                            {match.isLive && (
                                                <div className="text-red-500 font-medium">LIVE</div>
                                            )}
                                        </div> */}
                                        <div className="flex gap-1">
                                            {match.odds['1'] && (
                                                <Button
                                                    size={"sm"}
                                                    className="w-14 h-8 p-0 text-xs font-bold"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Selected odds: 1 -', match.odds['1']);
                                                    }}
                                                >
                                                    {match.odds['1']}
                                                </Button>
                                            )}
                                            {match.odds['X'] && (
                                                <Button
                                                    className="w-14 h-8 p-0 text-xs font-bold"
                                                    size={"sm"}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Selected odds: X -', match.odds['X']);
                                                    }}
                                                >
                                                    {match.odds['X']}
                                                </Button>
                                            )}
                                            {match.odds['2'] && (
                                                <Button
                                                    size={"sm"}
                                                    className="w-14 h-8 p-0 text-xs font-bold"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Selected odds: 2 -', match.odds['2']);
                                                    }}
                                                >
                                                    {match.odds['2']}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>                        </Link>
                        {index < Math.min(league.matches.length, 4) - 1 && (
                            <div className="border-b border-gray-300 mx-0 my-2"></div>
                        )}
                    </div>
                ))}
            </div>
            {/* More Button */}

            <div className="p-4 py-3 flex items-center justify-center font-medium border-t border-gray-200  flex-shrink-0">
                <Link href={`/leagues/${league.id}`}
                    variant="outline"
                    size="sm"
                    className="w-full text-base text-xs text-center "
                >
                    More {league.name}
                </Link>
            </div>
        </div>
    );
};

const LeagueCards = () => {
    const scrollRef = useRef(null);



    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Football Daily</h2>

            {/* Day Tabs */}
            <div className="flex gap-2 mb-6">
                <Button
                    size="sm"
                    variant="default"
                    className="bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 rounded-full px-4"
                >
                    Today
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-600 text-xs hover:bg-gray-50 rounded-full px-4"
                >
                    Tomorrow
                </Button>
            </div>            {/* Carousel Navigation */}
            <div className="relative group">
                <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={scrollLeft}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={scrollRight}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* League Cards in horizontal scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
                >
                    {leaguesData.map((league) => (
                        <div key={league.id} className="flex-shrink-0 w-96">
                            <LeagueCard league={league} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LeagueCards;
