// Simple odds classification helper
const classifyOdds = (oddsData) => {
  // Define category mappings based on your frontend structure
  const categories = {
    "pre-packs": {
      id: "pre-packs",
      label: "Pre-packs",
      keywords: [
        "pre-pack",
        "prepack",
        "pre-packs",
        "prepacks",
        "combo",
        "special pack",
      ],
      markets: [], // Add market IDs if available
    },
    "full-time": {
      id: "full-time",
      label: "Full Time",
      keywords: [
        "full time",
        "match result",
        "1x2",
        "winner",
        "moneyline",
        "result",
        "final result",
      ],
      markets: [1, 52, 13, 14, 80],
    },
    "player-shots-on-target": {
      id: "player-shots-on-target",
      label: "Player Shots on Target",
      keywords: ["shots on target", "player shots on target"],
      markets: [], // Add market IDs if available
    },
    "player-shots": {
      id: "player-shots",
      label: "Player Shots",
      keywords: ["player shots", "shots"],
      markets: [], // Add market IDs if available
    },
    "player-cards": {
      id: "player-cards",
      label: "Player Cards",
      keywords: ["cards", "yellow card", "red card", "booking"],
      markets: [], // Add market IDs if available
    },
    "goal-scorer": {
      id: "goal-scorer",
      label: "Goal Scorer",
      keywords: [
        "goal scorer",
        "first goal",
        "last goal",
        "anytime scorer",
        "scorer",
      ],
      markets: [247, 11],
    },
    "player-goals": {
      id: "player-goals",
      label: "Player Goals",
      keywords: ["player goals", "hat trick", "goals scored"],
      markets: [18, 19],
    },
    "half-time": {
      id: "half-time",
      label: "Half Time",
      keywords: [
        "half",
        "1st half",
        "2nd half",
        "halftime",
        "first half",
        "second half",
      ],
      markets: [31, 97, 49, 28, 15, 16, 45, 124, 26],
    },
    corners: {
      id: "corners",
      label: "Corners",
      keywords: ["corner", "corners"],
      markets: [], // Add market IDs if available
    },
    "three-way-handicap": {
      id: "three-way-handicap",
      label: "3 Way Handicap",
      keywords: ["3 way handicap", "three way handicap"],
      markets: [], // Add market IDs if available
    },
    "asian-lines": {
      id: "asian-lines",
      label: "Asian Lines",
      keywords: ["asian", "asian handicap", "asian lines"],
      markets: [6, 26],
    },
    specials: {
      id: "specials",
      label: "Specials",
      keywords: ["odd", "even", "win to nil", "both halves", "special"],
      markets: [44, 45, 124, 46, 40, 101, 266],
    },
    others: {
      id: "others",
      label: "Others",
      keywords: [],
      markets: [],
    },
  };

  if (!oddsData || !oddsData.odds_by_market) {
    return {
      categories: [{ id: "all", label: "All", odds_count: 0 }],
      classified_odds: {},
      stats: { total_categories: 0, total_odds: 0 },
    };
  }

  const classifiedOdds = {};
  const availableCategories = [];
  let totalOdds = 0;

  // Initialize categories
  Object.values(categories).forEach((category) => {
    classifiedOdds[category.id] = {
      ...category,
      markets_data: {},
      odds_count: 0,
    };
  });

  // Classify each market by both market ID and keywords
  Object.entries(oddsData.odds_by_market).forEach(([marketId, marketData]) => {
    const numericMarketId = parseInt(marketId);
    const marketDescription =
      marketData.market_description?.toLowerCase() || "";
    let classified = false;

    // Find which category this market belongs to
    for (const category of Object.values(categories)) {
      // Skip 'others' for classification
      if (category.id === "others") continue;
      // Check if market ID matches
      const matchesMarketId = category.markets.includes(numericMarketId);
      // Check if market description matches keywords
      const matchesKeywords =
        category.keywords &&
        category.keywords.some((keyword) =>
          marketDescription.includes(keyword.toLowerCase())
        );
      if (matchesMarketId || matchesKeywords) {
        classifiedOdds[category.id].markets_data[marketId] = marketData;
        classifiedOdds[category.id].odds_count += marketData.odds.length;
        totalOdds += marketData.odds.length;
        classified = true;
        break; // Only classify into the first matching category
      }
    }
    // If not classified, add to 'others'
    if (!classified) {
      classifiedOdds["others"].markets_data[marketId] = marketData;
      classifiedOdds["others"].odds_count += marketData.odds.length;
      totalOdds += marketData.odds.length;
    }
  });

  // Filter out empty categories
  Object.keys(classifiedOdds).forEach((categoryId) => {
    if (Object.keys(classifiedOdds[categoryId].markets_data).length > 0) {
      availableCategories.push({
        id: classifiedOdds[categoryId].id,
        label: classifiedOdds[categoryId].label,
        odds_count: classifiedOdds[categoryId].odds_count,
      });
    } else {
      delete classifiedOdds[categoryId];
    }
  });

  return {
    categories: [
      { id: "all", label: "All", odds_count: totalOdds },
      ...availableCategories,
    ],
    classified_odds: classifiedOdds,
    stats: {
      total_categories: availableCategories.length,
      total_odds: totalOdds,
    },
  };
};

// Transform classified odds to betting data format for frontend
const transformToBettingData = (classifiedOdds, matchData = null) => {
  const bettingData = [];

  // Extract team names if available
  const homeTeam = matchData?.participants?.[0]?.name || "Home";
  const awayTeam = matchData?.participants?.[1]?.name || "Away";

  Object.values(classifiedOdds.classified_odds || {}).forEach((category) => {
    Object.values(category.markets_data || {}).forEach((market) => {
      // Transform market to betting data format
      const bettingSection = {
        id: `market-${market.market_id}`,
        title: market.market_description,
        type: category.id, // Use category ID as type
        category: category.id,
        options: market.odds.map((odd) => {
          // Safely handle odds value - it might be a string or number
          let oddsValue = odd.value;
          if (typeof oddsValue === "string") {
            oddsValue = parseFloat(oddsValue);
          }
          // Fallback to a default odds if invalid
          if (
            isNaN(oddsValue) ||
            oddsValue === null ||
            oddsValue === undefined
          ) {
            oddsValue = 1.0;
          }

          // Replace "Home" and "Away" with actual team names in the label
          let label = odd.label || odd.name || "Unknown";
          if (matchData && matchData.participants) {
            label = label
              .replace(/\bHome\b/gi, homeTeam)
              .replace(/\bAway\b/gi, awayTeam);
          }

          return {
            ...odd,
            value: oddsValue,
            label,
          };
        }),
      };
      bettingData.push(bettingSection);
    });
  });

  return bettingData;
};

export { classifyOdds, transformToBettingData };
