'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBetting } from '@/hooks/useBetting';

const LiveMatchCard = ({ match }) => {
    const { createBetHandler } = useBetting();

    return (
        <Link href={`/matches/${match.id}`}>
            <div className="bg-white border border-gray-200 cursor-pointer rounded-none shadow-none relative">
                {/* Live indicator */}
                {match.isLive && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE
                    </div>
                )}
                
                <div className="p-4">
                    <div className='flex align-center gap-2 justify-start mb-2'>
                        <img src={`${match.league.imageUrl}`} className='w-4 h-4' alt="" />
                        <div className="text-xs text-gray-500">{match.league.name}</div>
                    </div>

                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{match.team1}</div>
                            <div className="font-medium text-sm">{match.team2}</div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                {match.clock && <span>⏰</span>}
                                <span>{match.date}</span>
                            </div>
                            <div className="text-red-600 font-medium">{match.time}</div>
                        </div>
                    </div>

                    {/* Live score display */}
                    {match.liveData?.score && (
                        <div className="text-center mb-3">
                            <div className="text-lg font-bold text-gray-800">{match.liveData.score}</div>
                        </div>
                    )}

                    <div className="flex gap-1">
                        {match.odds['1'] && (
                            <Button
                                size={"sm"}
                                className="flex-1 flex justify-between py-2 gap-0 betting-button"
                                onClick={createBetHandler(match, "Home", match.odds['1'].value, '1x2', match.odds['1'].oddId, { 
                                    marketId: "1", 
                                    label: "Home", 
                                    name: `Win - ${match.team1}`, 
                                    marketDescription: "Full Time Result" 
                                })}
                            >
                                <div className="text-[11px]">1</div>
                                <div className='text-[13px] font-bold'>{match.odds['1'].value}</div>
                            </Button>
                        )}
                        {match.odds['X'] && (
                            <Button
                                className="flex-1 flex justify-between py-2 gap-0 betting-button"
                                size={"sm"}
                                onClick={createBetHandler(match, "Draw", match.odds['X'].value, '1x2', match.odds['X'].oddId, { marketId: "1", label: "Draw", name: `Draw - ${match.team1} vs ${match.team2}`, marketDescription: "Full Time Result" })}
                            >
                                <div className="text-[11px]">X</div>
                                <div className='text-[13px] font-bold'>{match.odds['X'].value}</div>
                            </Button>
                        )}
                        {match.odds['2'] && (
                            <Button
                                size={"sm"}
                                className="flex-1 flex justify-between py-2 gap-0 betting-button"
                                onClick={createBetHandler(match, "Away", match.odds['2'].value, '1x2', match.odds['2'].oddId, { marketId: "1", label: "Away", name: `Win - ${match.team2}`, marketDescription: "Full Time Result" })}
                            >
                                <div className="text-[11px]">2</div>
                                <div className='text-[13px] font-bold'>{match.odds['2'].value}</div>
                            </Button>
                        )}
                        
                        {/* Show message when no odds are available */}
                        {(!match.odds || Object.keys(match.odds).length === 0) && (
                            <div className="flex-1 text-center py-2 text-xs text-gray-500 bg-gray-50 rounded">
                                Odds not available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default LiveMatchCard;
