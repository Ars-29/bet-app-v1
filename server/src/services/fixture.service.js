import NodeCache from "node-cache";
import sportsMonksService from "./sportsMonks.service.js";
import { CustomError } from "../utils/customErrors.js";

class FixtureOptimizationService {
  constructor() {
    // INFO: Cache for 10 minutes for live odds, 1 hour for fixtures
    this.liveCache = new NodeCache({ stdTTL: 600 });
    this.fixtureCache = new NodeCache({ stdTTL: 3600 });
    this.leagueCache = new NodeCache({ stdTTL: 86400 }); // 24 hours for leagues

    // INFO: Track API calls for rate limiting
    this.apiCallCount = 0;
    this.lastResetTime = Date.now();
    this.maxCallsPerHour = 1000; // Adjust based on your plan
  }

  async getOptimizedFixtures(options = {}) {
    const {
      page = 1,
      limit = 50,
      leagues = [],
      dateFrom,

      dateTo,
      states = [1], // 1 = not started, 2 = live, 3 = finished
      includeOdds = true,
    } = options;

    const cacheKey = `fixtures_${JSON.stringify({
      page,
      limit,
      leagues,
      dateFrom,
      dateTo,
      states,
      includeOdds,
    })}`;

    // Check cache first
    const cached = this.fixtureCache.get(cacheKey);
    if (cached) {
      console.log("📦 Returning cached fixtures data");
      return cached;
    }

    this.checkRateLimit();

    try {
      // Build optimized API request
      const apiParams = this.buildOptimizedApiParams({
        page,
        limit,
        leagues,
        dateFrom,
        dateTo,
        states,
        includeOdds,
      });

      console.log("🔍 Optimized API params:", apiParams);

      const response = await sportsMonksService.getOptimizedFixtures(apiParams);

      this.apiCallCount++;
      console.log(`📊 API Calls made: ${this.apiCallCount}`);

      if (!response.data) {
        throw new CustomError("No fixtures found", 404, "NO_FIXTURES");
      }

      //TODO: Transform and optimize the data
      // const optimizedData = this.transformFixturesData(response.data, options);
      const optimizedData = response.data;
      // Cache the result
      this.fixtureCache.set(cacheKey, optimizedData);
      return optimizedData;
    } catch (error) {
      console.error("Error in getOptimizedFixtures:", error);
      throw error;
    }
  }

  buildOptimizedApiParams({
    page,
    limit,
    leagues,
    dateFrom,
    dateTo,
    states,
    includeOdds,
    priority,
  }) {
    const params = {
      page,
      per_page: Math.min(limit, 100), // SportMonks max per page
    };

    // Build filters array for v3 API format - keep it simple like the working Postman example
    const filters = [];

    // State filtering (match the working Postman example: fixtureStates:1)
    if (states && states.length > 0) {
      filters.push(`fixtureStates:${states.join(",")}`);
    }

    // Only add other filters if specifically requested
    if (leagues && leagues.length > 0) {
      filters.push(`fixtureLeagues:${leagues.join(",")}`);
    }

    // Date filtering - only if explicitly provided
    if (dateFrom) {
      filters.push(`fixtureStartingAtFrom:${dateFrom}`);
    }
    if (dateTo) {
      filters.push(`fixtureStartingAtTo:${dateTo}`);
    }

    // Always add bookmakers filter to ensure odds come from bookmaker 1
    filters.push("bookmakers:1");

    // Add markets filter when odds are requested

    // Add filters parameter
    if (filters.length > 0) {
      params.filters = filters.join(";");
    }

    // Set includes
    const includes = ["participants", "league"];
    if (includeOdds) {
      includes.push("odds");
    }
    params.include = includes.join(";");
    return params;
  }

  transformFixturesData(fixtures, options) {
    return fixtures.map((fixture) => {
      // Extract only essential data
      const transformed = {
        id: fixture.id,
        name: fixture.name,
        starting_at: fixture.starting_at,
        state_id: fixture.state_id,
        league_id: fixture.league_id,
        participants:
          fixture.participants?.map((p) => ({
            id: p.id,
            name: p.name,
            image_path: p.image_path,
          })) || [],
        odds: fixture.odds.map((odd) => {
          return {
            id: odd.id,
            fixture_id: odd.fixture_id,
            label: odd.label,
            value: parseFloat(odd.value),
            name: odd.name,
            market_description: odd.market_description,
            winning: odd.winning,
            probablity: odd.probability,
          };
        }),
      };

      // Add simplified odds if requested
      if (options.includeOdds && fixture.odds) {
        transformed.odds = this.extractMainOdds(fixture.odds);
      }

      return transformed;
    });
  }

  extractMainOdds(odds) {
    if (!odds || odds.length === 0) return null;

    const oddsMap = {
      home: null,
      draw: null,
      away: null,
      over25: null,
      under25: null,
      btts_yes: null,
      btts_no: null,
    };

    // Extract main market odds efficiently
    odds.forEach((odd) => {
      const marketId = odd.market_id;
      const label = odd.label?.toLowerCase();
      const value = parseFloat(odd.value);

      switch (marketId) {
        case 1: // 1X2
          if (label === "home" || label === "1") oddsMap.home = value;
          if (label === "draw" || label === "x") oddsMap.draw = value;
          if (label === "away" || label === "2") oddsMap.away = value;
          break;
        case 2: // Over/Under 2.5
          if (label?.includes("over")) oddsMap.over25 = value;
          if (label?.includes("under")) oddsMap.under25 = value;
          break;
        case 3: // Both Teams to Score
          if (label?.includes("yes")) oddsMap.btts_yes = value;
          if (label?.includes("no")) oddsMap.btts_no = value;
          break;
      }
    });

    return oddsMap;
  }

  async getPopularLeagues(limit = 10) {
    const cacheKey = `popular_leagues_${limit}`;
    const cached = this.leagueCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Make API call to get actual leagues
      console.log("🔍 Fetching leagues from SportsMonks API...");

      const response = await sportsMonksService.getLeagues();
      this.apiCallCount++;
      console.log(`📊 API Calls made: ${this.apiCallCount}`);

      if (response && response.length > 0) {
        // Define popular league names for prioritization
        const popularLeagueNames = [
          "Premier League",
          "Champions League",
          "La Liga",
          "Serie A",
          "Bundesliga",
          "Ligue 1",
          "Europa League",
          "World Cup",
          "European Championship",
          "Copa America",
          "NBA",
          "NHL",
        ];

        // Sort leagues by popularity (known popular leagues first)
        const sortedLeagues = response.sort((a, b) => {
          const aPopular = popularLeagueNames.some((name) =>
            a.name.toLowerCase().includes(name.toLowerCase())
          );
          const bPopular = popularLeagueNames.some((name) =>
            b.name.toLowerCase().includes(name.toLowerCase())
          );

          if (aPopular && !bPopular) return -1;
          if (!aPopular && bPopular) return 1;
          return 0;
        });

        // Take the specified limit (default 10)
        const popularLeagues = sortedLeagues.slice(0, limit);
        this.leagueCache.set(cacheKey, popularLeagues);
        console.log(
          `✅ Fetched ${popularLeagues.length} leagues from API (requested: ${limit}, total available: ${response.length})`
        );
        return popularLeagues;
      } else {
        throw new Error("No leagues found from API");
      }
    } catch (error) {
      console.error("❌ Error fetching leagues from API:", error);

      // Fallback to hardcoded popular leagues if API fails
      console.log("🔄 Falling back to hardcoded leagues...");

      this.leagueCache.set(cacheKey, fallbackLeagues);
      return fallbackLeagues;
    }
  }

  async getTodaysFixtures(leagues = []) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return this.getOptimizedFixtures({
      dateFrom: todayStr,
      dateTo: tomorrowStr,
      leagues: leagues.length > 0 ? leagues : undefined,
      states: [1, 2], // Not started and live
      limit: 100,
      priority: "main",
    });
  }

  async getLiveFixtures() {
    const cacheKey = "live_fixtures";
    const cached = this.liveCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const liveFixtures = await this.getOptimizedFixtures({
      states: [2], // Live only
      limit: 50,
      includeOdds: true,
    });

    this.liveCache.set(cacheKey, liveFixtures);
    return liveFixtures;
  }

  async getUpcomingFixtures(daysAhead = 7) {
    const today = new Date();
    const futureDate = new Date(
      today.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );

    return this.getOptimizedFixtures({
      dateFrom: today.toISOString().split("T")[0],
      dateTo: futureDate.toISOString().split("T")[0],
      states: [1], // Not started
      limit: 200,
      priority: "main",
    });
  }

  // Get optimized homepage data
  async getHomepageData() {
    const cacheKey = "homepage_data";
    const cached = this.fixtureCache.get(cacheKey);

    if (cached) {
      console.log("📦 Returning cached homepage data");
      return cached;
    }

    try {
      console.log("🏠 Fetching fresh homepage data...");

      // Get date ranges
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const footballDailyEndDate = new Date(
        today.getTime() + 20 * 24 * 60 * 60 * 1000
      );
      const footballDailyEndStr = footballDailyEndDate
        .toISOString()
        .split("T")[0];

      // Get leagues for better league name resolution
      const allLeagues = await this.getPopularLeagues(30);

      // Check if we have cached fixture data that covers our date range
      let allFixtures = [];
      let usedCache = false;

      // Generate cache key for the fixture data we need (20 days, all leagues)
      const fixturesCacheKey = `fixtures_${JSON.stringify({
        page: 1,
        limit: 300,
        leagues: [],
        dateFrom: todayStr,
        dateTo: footballDailyEndStr,
        states: [1],
        includeOdds: true,
      })}`;

      // Check if we have cached fixture data
      const cachedFixtures = this.fixtureCache.get(fixturesCacheKey);

      if (cachedFixtures && cachedFixtures.length > 0) {
        console.log("📦 Using cached fixture data for homepage filtering");
        allFixtures = cachedFixtures;
        usedCache = true;
      } else {
        console.log("🔍 No suitable cached fixtures found, making API call...");

        // Make a single API call for all fixtures we need (20 days, all leagues)
        allFixtures = await this.getOptimizedFixtures({
          dateFrom: todayStr,
          dateTo: footballDailyEndStr,
          states: [1], // Not started only
          limit: 300, // Get more fixtures to have good selection
          includeOdds: true,
        }).catch(() => []);
      }

      // Now filter the fixtures for homepage needs
      const today10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
      const topPicksEndStr = today10Days.toISOString().split("T")[0];

      // Filter fixtures for top picks (first 10 days)
      const topPicksFixtures = allFixtures.filter((fixture) => {
        const fixtureDate = new Date(fixture.starting_at);
        return fixtureDate <= today10Days;
      });

      // All fixtures are already suitable for football daily (20 days)
      const footballDailyFixtures = allFixtures;

      // 1. Generate Top Picks (8-10 best matches) - transform odds and filter out matches without odds
      const topPicks = this.selectTopPicks(topPicksFixtures, 10)
        .map((match) => this.transformMatchOdds(match))
        .filter((match) => match.odds && Object.keys(match.odds).length > 0);

      // 2. Generate Football Daily (matches from all leagues for 20 days) - transform odds and filter out matches without odds
      const footballDaily = this.generateFootballDaily(
        footballDailyFixtures,
        allLeagues, // Pass all leagues for better name resolution
        true // includeAllLeagues flag
      )
        .map((league) => ({
          ...league,
          matches: league.matches
            .map((match) => this.transformMatchOdds(match))
            .filter(
              (match) => match.odds && Object.keys(match.odds).length > 0
            ),
        }))
        .filter((league) => league.matches.length > 0); // Filter out leagues with no matches

      const homepageData = {
        top_picks: topPicks,
        football_daily: footballDaily,
        // in_play: [], // Skip for now as requested
      };

      // Cache for 10 minutes
      this.fixtureCache.set(cacheKey, homepageData, 600);
      return homepageData;
    } catch (error) {
      console.error("❌ Error fetching homepage data:", error);
      // Return empty data structure on error
      return {
        top_picks: [],
        football_daily: [],
        // in_play: [], // Skip for now
      };
    }
  }

  // Helper method to select top picks based on various criteria
  selectTopPicks(fixtures, limit = 10) {
    if (!fixtures || fixtures.length === 0) return [];

    // Score fixtures based on multiple criteria
    const scoredFixtures = fixtures.map((fixture) => {
      let score = 0;

      // Prefer matches with better odds variety (closer odds = more competitive)
      if (fixture.odds && fixture.odds.length > 0) {
        const homeOdds =
          fixture.odds.find(
            (o) =>
              o.name &&
              (o.name.toLowerCase().includes("home") || o.name === "1")
          )?.value || 0;
        const drawOdds =
          fixture.odds.find(
            (o) =>
              o.name &&
              (o.name.toLowerCase().includes("draw") || o.name === "X")
          )?.value || 0;
        const awayOdds =
          fixture.odds.find(
            (o) =>
              o.name &&
              (o.name.toLowerCase().includes("away") || o.name === "2")
          )?.value || 0;

        if (homeOdds && drawOdds && awayOdds) {
          // Convert to numbers for calculation
          const homeNum = parseFloat(homeOdds) || 0;
          const awayNum = parseFloat(awayOdds) || 0;

          // Prefer matches where odds are between 1.5 and 3.5 (competitive)
          const avgOdds = (homeNum + awayNum) / 2;
          if (avgOdds >= 1.5 && avgOdds <= 3.5) score += 30;
          else if (avgOdds >= 1.2 && avgOdds <= 5.0) score += 15;
        }
      }

      // Prefer popular leagues
      const popularLeagueNames = [
        "Premier League",
        "Champions League",
        "La Liga",
        "Serie A",
        "Bundesliga",
        "Ligue 1",
        "Europa League",
        "World Cup",
        "European Championship",
        "Copa America",
      ];
      if (
        fixture.league &&
        popularLeagueNames.some((name) =>
          fixture.league.name.toLowerCase().includes(name.toLowerCase())
        )
      ) {
        score += 25;
      }

      // Prefer matches happening soon (today gets highest priority)
      const now = new Date();
      const matchTime = new Date(fixture.starting_at);
      const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);

      if (hoursUntilMatch >= 0 && hoursUntilMatch <= 24) score += 20; // Today
      else if (hoursUntilMatch > 24 && hoursUntilMatch <= 48)
        score += 15; // Tomorrow
      else if (hoursUntilMatch > 48 && hoursUntilMatch <= 72) score += 10; // Day after

      // Prefer matches with recognizable teams (heuristic: longer team names often = bigger clubs)
      const homeTeamLength =
        fixture.localteam?.name?.length ||
        fixture.participants?.find((p) => p.meta?.location === "home")?.name
          ?.length ||
        0;
      const awayTeamLength =
        fixture.visitorteam?.name?.length ||
        fixture.participants?.find((p) => p.meta?.location === "away")?.name
          ?.length ||
        0;
      if (homeTeamLength > 8 || awayTeamLength > 8) score += 10;

      return { ...fixture, topPickScore: score };
    });

    // Sort by score and return top picks
    return scoredFixtures
      .sort((a, b) => b.topPickScore - a.topPickScore)
      .slice(0, limit)
      .map(({ topPickScore, ...fixture }) => fixture); // Remove score from final result
  }

  // Helper method to generate football daily data grouped by leagues
  generateFootballDaily(fixtures, topLeagues, includeAllLeagues = false) {
    if (!fixtures || fixtures.length === 0) {
      return [];
    }

    const footballDaily = [];

    if (includeAllLeagues) {
      // Group fixtures by all leagues present in the data
      const leagueMap = new Map();

      // First, collect all unique leagues from fixtures
      fixtures.forEach((fixture) => {
        const leagueId = fixture.league_id || fixture.league?.id;

        if (leagueId && !leagueMap.has(leagueId)) {
          // Try to find league info from topLeagues first, then from fixture.league
          const topLeagueInfo = topLeagues.find((tl) => tl.id === leagueId);
          const leagueName =
            topLeagueInfo?.name || fixture.league?.name || `League ${leagueId}`;
          const leagueLogo =
            topLeagueInfo?.logo_path || fixture.league?.logo_path || null;
          const leagueCountry =
            topLeagueInfo?.country?.name ||
            fixture.league?.country?.name ||
            null;

          leagueMap.set(leagueId, {
            id: leagueId,
            name: leagueName,
            logo: leagueLogo,
            country: leagueCountry,
            matches: [],
          });
        }
      });

      // Group fixtures by league
      fixtures.forEach((fixture) => {
        const leagueId = fixture.league_id || fixture.league?.id;
        if (leagueId && leagueMap.has(leagueId)) {
          leagueMap.get(leagueId).matches.push(fixture);
        }
      });

      // Convert map to array and process each league
      leagueMap.forEach((leagueData) => {
        if (leagueData.matches.length > 0) {
          // Sort matches by date/time and limit per league
          const sortedMatches = leagueData.matches
            .sort((a, b) => new Date(a.starting_at) - new Date(b.starting_at))
            .slice(0, 12); // Increased to 12 matches per league for 20-day range

          footballDaily.push({
            league: {
              id: leagueData.id,
              name: leagueData.name,
              logo: leagueData.logo,
              country: leagueData.country,
            },
            matches: sortedMatches,
            match_count: sortedMatches.length,
          });
        }
      });

      // Sort leagues by number of matches, then by priority (top leagues first)
      return footballDaily
        .sort((a, b) => {
          // First priority: if it's a top league
          const aIsTop = topLeagues.some((tl) => tl.id === a.league.id);
          const bIsTop = topLeagues.some((tl) => tl.id === b.league.id);

          if (aIsTop && !bIsTop) return -1;
          if (!aIsTop && bIsTop) return 1;

          // Second priority: number of matches
          return b.match_count - a.match_count;
        })
        .slice(0, 20); // Limit to top 20 leagues
    } else {
      // Original logic for top leagues only
      topLeagues.forEach((league) => {
        const leagueFixtures = fixtures.filter((fixture) => {
          const matchesById = fixture.league_id === league.id;
          const matchesByObject =
            fixture.league && fixture.league.id === league.id;
          return matchesById || matchesByObject;
        });

        if (leagueFixtures.length > 0) {
          const sortedMatches = leagueFixtures
            .sort((a, b) => new Date(a.starting_at) - new Date(b.starting_at))
            .slice(0, 8);

          footballDaily.push({
            league: {
              id: league.id,
              name: league.name,
              logo: league.logo_path || null,
              country: league.country?.name || null,
            },
            matches: sortedMatches,
            match_count: sortedMatches.length,
          });
        }
      });

      return footballDaily.sort((a, b) => b.match_count - a.match_count);
    }
  }

  // Transform match odds to return only home/draw/away odds
  transformMatchOdds(match) {
    if (!match) return match;

    const transformedMatch = { ...match };

    // Extract and standardize odds to only include home/draw/away
    if (match.odds && Array.isArray(match.odds)) {
      const homeOdd = match.odds.find(
        (o) =>
          o.name && (o.name.toLowerCase().includes("home") || o.name === "1")
      );
      const drawOdd = match.odds.find(
        (o) =>
          o.name && (o.name.toLowerCase().includes("draw") || o.name === "X")
      );
      const awayOdd = match.odds.find(
        (o) =>
          o.name && (o.name.toLowerCase().includes("away") || o.name === "2")
      );

      const oddsObj = {};
      if (homeOdd?.value && !isNaN(parseFloat(homeOdd.value))) {
        oddsObj.home = parseFloat(homeOdd.value);
      }
      if (drawOdd?.value && !isNaN(parseFloat(drawOdd.value))) {
        oddsObj.draw = parseFloat(drawOdd.value);
      }
      if (awayOdd?.value && !isNaN(parseFloat(awayOdd.value))) {
        oddsObj.away = parseFloat(awayOdd.value);
      }

      transformedMatch.odds = oddsObj;
    } else if (match.odds && typeof match.odds === "object") {
      // If odds is already an object, standardize the structure
      const oddsObj = {};
      if (match.odds.home && !isNaN(parseFloat(match.odds.home))) {
        oddsObj.home = parseFloat(match.odds.home);
      }
      if (match.odds.draw && !isNaN(parseFloat(match.odds.draw))) {
        oddsObj.draw = parseFloat(match.odds.draw);
      }
      if (match.odds.away && !isNaN(parseFloat(match.odds.away))) {
        oddsObj.away = parseFloat(match.odds.away);
      }
      if (match.odds["1"] && !isNaN(parseFloat(match.odds["1"]))) {
        oddsObj.home = parseFloat(match.odds["1"]);
      }
      if (match.odds["X"] && !isNaN(parseFloat(match.odds["X"]))) {
        oddsObj.draw = parseFloat(match.odds["X"]);
      }
      if (match.odds["2"] && !isNaN(parseFloat(match.odds["2"]))) {
        oddsObj.away = parseFloat(match.odds["2"]);
      }

      transformedMatch.odds = oddsObj;
    } else {
      // No valid odds found
      transformedMatch.odds = {};
    }

    return transformedMatch;
  }

  checkRateLimit() {
    const now = Date.now();
    const hoursPassed = (now - this.lastResetTime) / (1000 * 60 * 60);

    if (hoursPassed >= 1) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }

    if (this.apiCallCount >= this.maxCallsPerHour) {
      throw new CustomError(
        "API rate limit exceeded. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }
  }

  // Method to preload popular data during off-peak hours
  async preloadPopularData() {
    console.log("🔄 Preloading popular fixture data...");

    try {
      const popularLeagues = await this.getPopularLeagues();
      const leagueIds = popularLeagues.map((l) => l.id);

      // Preload today's fixtures for popular leagues
      await this.getTodaysFixtures(leagueIds);

      // Preload live fixtures
      await this.getLiveFixtures();

      console.log("✅ Popular data preloaded successfully");
    } catch (error) {
      console.error("❌ Error preloading data:", error);
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      fixture_cache: {
        keys: this.fixtureCache.keys().length,
        stats: this.fixtureCache.getStats(),
      },
      live_cache: {
        keys: this.liveCache.keys().length,
        stats: this.liveCache.getStats(),
      },
      league_cache: {
        keys: this.leagueCache.keys().length,
        stats: this.leagueCache.getStats(),
      },
      api_calls_today: this.apiCallCount,
    };
  }

  // Clear specific caches
  clearCache(type = "all") {
    switch (type) {
      case "fixtures":
        this.fixtureCache.flushAll();
        break;
      case "live":
        this.liveCache.flushAll();
        break;
      case "leagues":
        this.leagueCache.flushAll();
        break;
      case "all":
      default:
        this.fixtureCache.flushAll();
        this.liveCache.flushAll();
        this.leagueCache.flushAll();
        break;
    }
  }
}

export default new FixtureOptimizationService();
