// Simple utility to work with classified odds from backend
export const useClassifiedOdds = (matchData) => {
  if (!matchData || !matchData.odds_classification) {
    return {
      categories: [{ id: "all", label: "All", odds_count: 0 }],
      getOddsByCategory: () => ({}),
      stats: { total_categories: 0, total_odds: 0 },
    };
  }

  const { odds_classification, odds_by_market } = matchData;

  return {
    categories: odds_classification.categories || [],
    getOddsByCategory: (categoryId) => {
      if (categoryId === "all") {
        return odds_by_market || {};
      }
      return (
        odds_classification.classified_odds[categoryId]?.markets_data || {}
      );
    },
    stats: odds_classification.stats || { total_categories: 0, total_odds: 0 },
  };
};

// Format odds value for display
export const formatOddsValue = (odd, format = "decimal") => {
  if (!odd) return "";

  switch (format) {
    case "fractional":
      return odd.fractional || odd.value.toString();
    case "american":
      return (
        odd.american ||
        (odd.value > 2
          ? `+${Math.round((odd.value - 1) * 100)}`
          : `-${Math.round(100 / (odd.value - 1))}`)
      );
    case "decimal":
    default:
      return odd.value.toFixed(2);
  }
};

// Get category theme colors
export const getCategoryTheme = (categoryId) => {
  const themes = {
    "full-time": "bg-blue-50 text-blue-700 border-blue-200",
    goals: "bg-green-50 text-green-700 border-green-200",
    "both-teams-score": "bg-purple-50 text-purple-700 border-purple-200",
    handicap: "bg-orange-50 text-orange-700 border-orange-200",
    halves: "bg-indigo-50 text-indigo-700 border-indigo-200",
    specials: "bg-pink-50 text-pink-700 border-pink-200",
    "team-totals": "bg-teal-50 text-teal-700 border-teal-200",
  };

  return themes[categoryId] || themes["specials"];
};
