import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BettingHistoryPage from './BettingHistoryPage';

const TabbedBettingHistory = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Betting History</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
            All Bets
          </Badge>
          <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
            Combination Bets
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Bets</TabsTrigger>
          <TabsTrigger value="singles">Single Bets</TabsTrigger>
          <TabsTrigger value="combinations">Combination Bets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <BettingHistoryPage userId={userId} />
        </TabsContent>
        
        <TabsContent value="singles" className="mt-6">
          <BettingHistoryPage userId={userId} betType="singles" />
        </TabsContent>
        
        <TabsContent value="combinations" className="mt-6">
          <BettingHistoryPage userId={userId} betType="combinations" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabbedBettingHistory; 