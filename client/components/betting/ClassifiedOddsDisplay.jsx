import React, { useState } from 'react';
import { useClassifiedOdds, formatOddsValue, getCategoryTheme } from '../../utils/oddsHelpers';

const ClassifiedOddsDisplay = ({ matchData }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [oddsFormat, setOddsFormat] = useState('decimal');

  const { categories, getOddsByCategory, stats } = useClassifiedOdds(matchData);
  const displayOdds = getOddsByCategory(selectedCategory);

  if (!matchData) {
    return <div>Loading match data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{matchData.name}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{matchData.league?.name}</span>
          <span>•</span>
          <span>{new Date(matchData.starting_at).toLocaleString()}</span>
          <span>•</span>
          <span className="font-medium">{stats.total_odds} total odds</span>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${selectedCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {category.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {category.odds_count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Odds Format Selector */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Odds Format:</span>
            <select
              value={oddsFormat}
              onChange={(e) => setOddsFormat(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="decimal">Decimal</option>
              <option value="fractional">Fractional</option>
              <option value="american">American</option>
            </select>
          </div>
        </div>

        {/* Odds Display */}
        <div className="p-6">
          {Object.entries(displayOdds).map(([marketId, marketData]) => (
            <div key={marketId} className="mb-6 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {marketData.market_description}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {marketData.odds.map((odd) => (
                  <div
                    key={odd.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{odd.label}</div>
                        <div className="text-sm text-gray-500">{odd.probability}</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatOddsValue(odd, oddsFormat)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(displayOdds).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No odds available for this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassifiedOddsDisplay;
