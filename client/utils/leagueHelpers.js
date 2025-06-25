// Utility to map league names to appropriate icons and enhance league data
export const enhanceLeaguesWithIcons = (leagues) => {
  const leagueIconMap = {
    // Football/Soccer leagues
    "premier league": "🏆",
    "champions league": "⚽",
    "uefa champions league": "⚽",
    "europa league": "🏅",
    "uefa europa league": "🏅",
    "la liga": "🇪🇸",
    bundesliga: "🇩🇪",
    "serie a": "🇮🇹",
    "ligue 1": "🇫🇷",
    eredivisie: "🇳🇱",
    "primeira liga": "🇵🇹",

    // Basketball
    nba: "🏀",
    euroleague: "🏀",

    // American Football
    nfl: "🏈",

    // Hockey
    nhl: "🏒",

    // Tennis
    atp: "🎾",
    wta: "🎾",

    // Other sports
    mlb: "⚾",
    "formula 1": "🏎️",
    "moto gp": "🏍️",
  };

  return leagues.map((league) => {
    const leagueName = league.name?.toLowerCase() || "";

    // Use the actual image_path from API if available, otherwise find matching emoji icon
    let icon = "⚽"; // default icon
    let imageUrl = null;

    // Check if we have an image_path from the API
    if (league.image_path && league.image_path.startsWith("http")) {
      imageUrl = league.image_path;
      // Still set an emoji as fallback in case image fails to load
      for (const [key, value] of Object.entries(leagueIconMap)) {
        if (leagueName.includes(key)) {
          icon = value;
          break;
        }
      }
    } else {
      // Find matching emoji icon
      for (const [key, value] of Object.entries(leagueIconMap)) {
        if (leagueName.includes(key)) {
          icon = value;
          break;
        }
      }
    }

    // Add some sample match counts for popular leagues
    const matchCounts = {
      "premier league": 12,
      "champions league": 8,
      "uefa champions league": 8,
      "la liga": 10,
      bundesliga: 9,
      "serie a": 11,
      "ligue 1": 8,
      nba: 6,
      nhl: 4,
    };

    const count = matchCounts[leagueName] || null;

    return {
      ...league,
      icon,
      imageUrl, // Add the image URL
      count,
      // Ensure we have a proper URL slug for routing
      slug:
        league.name
          ?.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") || `league-${league.id}`,
    };
  });
};

// Add special entries like "Odds Boost" to the beginning of the list
export const addSpecialEntries = (leagues) => {
  const specialEntries = [
    {
      id: "odds-boost",
      name: "Odds Boost",
      icon: "💫",
      count: null,
      slug: "odds-boost",
    },
  ];

  return [...specialEntries, ...leagues];
};

const leagueHelpers = { enhanceLeaguesWithIcons, addSpecialEntries };
export default leagueHelpers;
