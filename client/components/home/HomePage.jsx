'use client';

import React from 'react';
import TopPicks from './TopPicks';
import LeagueCards from './LeagueCards';
import LoginDialog from '@/components/auth/LoginDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


const HomePage = () => {
    return (
        <div className="flex-1 bg-gray-100">            <div className="p-3 lg:p-6 overflow-hidden">
            {/* Auth Demo Section */}


            <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">{/* Main content area */}
                <div className="flex-1 min-w-0">
                    <TopPicks />
                    {/* <BetBuilderHighlights /> */}

                    {/* Regular League Cards */}
                    <LeagueCards />
                    {/* In-Play Section */}
                    <LeagueCards
                        title="In-Play"
                        isInPlay={true}
                        showDayTabs={false}
                        viewAllText="View All Live Football"
                    />

                </div>

                {/* Right sidebar */}
                {/* <div className="w-full xl:w-80 xl:flex-shrink-0">
                        <TrendingCombo />
                    </div> */}
            </div>
        </div>
        </div>
    );
};

export default HomePage;
