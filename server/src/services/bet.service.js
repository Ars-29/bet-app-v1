import Bet from "../models/Bet.js";
import User from "../models/User.js";
import MatchOdds from "../models/matchOdds.model.js";
import SportsMonksService from "./sportsMonks.service.js";
import FixtureOptimizationService from "./fixture.service.js";
import { CustomError } from "../utils/customErrors.js";
import cron from "node-cron";

class BetService {
  async placeBet(userId, matchId, oddId, stake) {
    let matchData;
    const cacheKey = `match_${matchId}`;
    const cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Step 0: Search all cached matches using the utility method
    const allCachedMatches = FixtureOptimizationService.getAllCachedMatches();
    matchData = allCachedMatches.find(
      (fixture) => fixture.id == matchId || fixture.id === parseInt(matchId)
    );
    if (matchData) {
      console.log(
        `Using match data from all-cached-matches utility for match ${matchId}`
      );
    } else {
      // Step 1: Check in-memory cache first
      matchData = FixtureOptimizationService.fixtureCache.get(cacheKey);
      if (
        matchData &&
        matchData.updatedAt &&
        matchData.updatedAt > new Date(Date.now() - cacheTTL)
      ) {
        console.log(`Using in-memory cached match data for match ${matchId}`);
      } else {
        // Step 2: Check MongoDB cache
        const cachedOdds = await MatchOdds.findOne({ matchId });
        if (
          cachedOdds &&
          cachedOdds.updatedAt > new Date(Date.now() - cacheTTL)
        ) {
          console.log(`Using MongoDB cached odds for match ${matchId}`);
          matchData = {
            id: matchId,
            odds: cachedOdds.odds.map((odd) => ({
              id: odd.oddId,
              marketId: odd.marketId,
              name: odd.name,
              value: odd.value,
            })),
            starting_at: cachedOdds.createdAt,
            participants: cachedOdds.participants || [], // Ensure participants are included if cached
            state: cachedOdds.state || {}, // Include state if available
          };
        } else {
          // Step 3: Fetch from SportsMonks API
          console.log(
            `Fetching match data for match ${matchId} from SportsMonks API`
          );
          const apiParams = {
            filters: `fixtureIds:${matchId}`,
            include: "odds;participants;state",
            per_page: 1,
          };
          const matches = await FixtureOptimizationService.getOptimizedFixtures(
            apiParams
          );
          if (!matches || matches.length === 0) {
            throw new CustomError("Match not found", 404, "MATCH_NOT_FOUND");
          }
          matchData = matches.find(
            (match) => match.id == matchId || match.id === parseInt(matchId)
          );
          if (!matchData) {
            throw new CustomError("Match not found", 404, "MATCH_NOT_FOUND");
          }
          // Update MongoDB cache
          await MatchOdds.findOneAndUpdate(
            { matchId: matchData.id },
            {
              matchId: matchData.id,
              odds: matchData.odds.map((odd) => ({
                oddId: odd.id,
                marketId: odd.market_id,
                name: odd.name,
                value: parseFloat(odd.value),
              })),
              participants: matchData.participants || [], // Store participants
              state: matchData.state || {}, // Store state
              updatedAt: new Date(),
            },
            { upsert: true }
          );
          // Update in-memory cache
          matchData.updatedAt = new Date(); // Add timestamp for cache freshness
          FixtureOptimizationService.fixtureCache.set(
            cacheKey,
            matchData,
            3600
          );
        }
      }
    }

    const odds = matchData.odds?.find((odd) => odd.id === oddId);
    if (!odds) {
      throw new CustomError("Invalid odd ID", 400, "INVALID_ODD_ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }
    if (user.balance < stake) {
      throw new CustomError(
        "Insufficient balance",
        400,
        "INSUFFICIENT_BALANCE"
      );
    }

    user.balance -= stake;
    await user.save();

    let teams =
      matchData.participants && matchData.participants.length >= 2
        ? `${matchData.participants[0].name} vs ${matchData.participants[1].name}`
        : "";
    const selection = `${odds.name} - ${odds.market_description}`;
    const matchDate = new Date(matchData.starting_at);
    const estimatedMatchEnd = new Date(matchDate.getTime() + 2 * 60 * 1000); // Add 2 hours

    const bet = new Bet({
      userId,
      matchId,
      oddId,
      betOption: odds.name,
      odds: parseFloat(odds.value),
      stake,
      payout: 0,
      matchDate,
      estimatedMatchEnd,
      teams,
      selection,
    });
    await bet.save();

    // Schedule outcome check or process immediately if overdue
    const now = new Date();
    if (estimatedMatchEnd <= now) {
      this.checkBetOutcome(bet._id).catch((error) => {
        console.error(
          `Error processing overdue bet ${bet._id} on placement:`,
          error
        );
      });
    } else {
      this.scheduleBetOutcomeCheck(bet._id, estimatedMatchEnd, matchId);
    }

    return {
      betId: bet._id,
      matchId,
      oddId,
      betOption: bet.betOption,
      odds: bet.odds,
      stake: bet.stake,
      status: bet.status,
      createdAt: bet.createdAt,
      estimatedMatchEnd,
    };
  }

  //TODO: Check working on a real match
  scheduleBetOutcomeCheck(betId, estimatedMatchEnd, matchId) {
    const scheduleTime = new Date(estimatedMatchEnd.getTime() + 5 * 60 * 1000); // 5 minutes after
    const cronTime = `${scheduleTime.getMinutes()} ${scheduleTime.getHours()} ${scheduleTime.getDate()} ${
      scheduleTime.getMonth() + 1
    } *`;

    cron.schedule(
      cronTime,
      async () => {
        try {
          // Check cache first
          const cacheKey = `match_${matchId}`;
          let match = FixtureOptimizationService.fixtureCache.get(cacheKey);
          if (match && match.state?.id === 5) {
            console.log(`Using cached match result for match ${matchId}`);
          } else {
            match = await this.fetchMatchResult(matchId);
            if (match.state?.id === 5) {
              FixtureOptimizationService.fixtureCache.set(
                cacheKey,
                match,
                24 * 3600
              ); // Cache for 24 hours
            }
          }
          await this.checkBetOutcome(betId, match);
          console.log(
            `Bet ${betId} outcome checked at ${new Date().toISOString()}`
          );
        } catch (error) {
          console.error(`Error checking bet ${betId} outcome:`, error);
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );
  }

  async fetchMatchResult(matchId) {
    const response = await SportsMonksService.client.get(
      `/football/fixtures/${matchId}`,
      {
        params: { include: "odds;state;scores;participants" },
      }
    );
    const match = response.data.data;
    if (!match) {
      throw new CustomError("Match not found", 404, "MATCH_NOT_FOUND");
    }
    return match;
  }

  async checkBetOutcome(betId, match = null) {
    const bet = await Bet.findById(betId).populate("userId");
    if (!bet) {
      throw new CustomError("Bet not found", 404, "BET_NOT_FOUND");
    }

    let matchData = match;
    if (!matchData) {
      const cacheKey = `match_${bet.matchId}`;
      matchData = FixtureOptimizationService.fixtureCache.get(cacheKey);
      if (!matchData || matchData.state?.id !== 5) {
        matchData = await this.fetchMatchResult(bet.matchId);
        if (matchData.state?.id === 5) {
          FixtureOptimizationService.fixtureCache.set(
            cacheKey,
            matchData,
            24 * 3600
          );
        }
      }
    }

    if (matchData.state.id !== 5) {
      return { betId, status: bet.status, message: "Match not yet finished" };
    }

    const selectedOdd = matchData.odds?.find((odd) => odd.id === bet.oddId);
    if (!selectedOdd) {
      throw new CustomError(
        "Odd ID not found in match data",
        404,
        "ODD_NOT_FOUND"
      );
    }

    if ("winning" in selectedOdd) {
      bet.status = selectedOdd.winning ? "won" : "lost";
      bet.payout = selectedOdd.winning ? bet.stake * bet.odds : 0;
    } else {
      const homeGoals =
        matchData.scores.find(
          (s) => s.participant === "home" && s.description === "CURRENT"
        )?.score.goals || 0;
      const awayGoals =
        matchData.scores.find(
          (s) => s.participant === "away" && s.description === "CURRENT"
        )?.score.goals || 0;
      const homeTeam = matchData.participants.find(
        (p) => p.meta.location === "home"
      )?.name;
      const awayTeam = matchData.participants.find(
        (p) => p.meta.location === "away"
      )?.name;

      if (selectedOdd.market_id === "1") {
        if (homeGoals > awayGoals && bet.betOption === homeTeam) {
          bet.status = "won";
          bet.payout = bet.stake * bet.odds;
        } else if (awayGoals > homeGoals && bet.betOption === awayTeam) {
          bet.status = "won";
          bet.payout = bet.stake * bet.odds;
        } else if (homeGoals === awayGoals && bet.betOption === "Draw") {
          bet.status = "won";
          bet.payout = bet.stake * bet.odds;
        } else {
          bet.status = "lost";
          bet.payout = 0;
        }
      } else if (selectedOdd.market_id === "8") {
        const totalGoals = homeGoals + awayGoals;
        const threshold = parseFloat(bet.betOption.split(" ")[1]);
        if (bet.betOption.includes("Over") && totalGoals > threshold) {
          bet.status = "won";
          bet.payout = bet.stake * bet.odds;
        } else if (bet.betOption.includes("Under") && totalGoals < threshold) {
          bet.status = "won";
          bet.payout = bet.stake * bet.odds;
        } else {
          bet.status = "lost";
          bet.payout = 0;
        }
      } else {
        bet.status = "canceled";
        bet.payout = 0;
      }
    }

    if (bet.status === "won") {
      const user = bet.userId;
      user.balance += bet.payout;
      await user.save();
    } else if (bet.status === "canceled") {
      const user = bet.userId;
      user.balance += bet.stake;
      await user.save();
    }

    await bet.save();
    return {
      betId: bet._id,
      status: bet.status,
      payout: bet.payout,
    };
  }

  async checkPendingBets() {
    const now = new Date();
    const pendingBets = await Bet.find({
      status: "pending",
      estimatedMatchEnd: { $lte: now },
    });

    if (pendingBets.length === 0) return [];

    // Group bets by matchId
    const betsByMatch = {};
    for (const bet of pendingBets) {
      if (!betsByMatch[bet.matchId]) betsByMatch[bet.matchId] = [];
      betsByMatch[bet.matchId].push(bet);
    }

    const matchIds = Object.keys(betsByMatch);
    const results = [];

    // Fetch match results in bulk
    if (matchIds.length > 0) {
      const apiParams = {
        filters: `fixtureIds:${matchIds.join(",")}`,
        include: "odds;state;scores;participants",
        per_page: matchIds.length,
      };
      const response = await FixtureOptimizationService.getOptimizedFixtures(
        apiParams
      );
      const matches = response.data || [];

      // Cache finished matches
      for (const match of matches) {
        if (match.state?.id === 5) {
          const cacheKey = `match_${match.id}`;
          FixtureOptimizationService.fixtureCache.set(
            cacheKey,
            match,
            24 * 3600
          ); // Cache for 24 hours
        }
      }

      // Process bets for each match
      for (const matchId of matchIds) {
        const match = matches.find(
          (m) => m.id == matchId || m.id === parseInt(matchId)
        );
        if (match) {
          for (const bet of betsByMatch[matchId]) {
            const result = await this.checkBetOutcome(bet._id, match);
            results.push(result);
          }
        } else {
          // If match data not found, keep bets pending and log error
          console.error(`Match ${matchId} not found in API response`);
          for (const bet of betsByMatch[matchId]) {
            results.push({
              betId: bet._id,
              status: bet.status,
              message: "Match data not found",
            });
          }
        }
      }
    }

    return results;
  }

  async getUserBets(userId) {
    if (!userId) {
      throw new CustomError("User ID is required", 400, "USER_ID_REQUIRED");
    }
    const bets = await Bet.find({ userId }).sort({ createdAt: -1 });
    return bets;
  }

  async getAllBets() {
    const bets = await Bet.find({}).populate("userId");
    const grouped = {};
    for (const bet of bets) {
      const user = bet.userId;
      let userName = "Unknown User";
      if (user && (user.firstName || user.lastName)) {
        userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      } else if (user && user.email) {
        userName = user.email;
      }
      if (!grouped[userName]) grouped[userName] = [];
      const betObj = bet.toObject();
      delete betObj.userId;
      grouped[userName].push(betObj);
    }
    return grouped;
  }

  // In BetService.js
  async recoverMissedBets() {
    const now = new Date();
    const overdueBets = await Bet.find({
      status: "pending",
      estimatedMatchEnd: { $lte: now },
    });

    if (overdueBets.length === 0) {
      console.log("No overdue bets to process on startup");
      return [];
    }

    console.log(`Processing ${overdueBets.length} overdue bets on startup`);

    // Group bets by matchId to minimize API calls
    const betsByMatch = {};
    for (const bet of overdueBets) {
      if (!betsByMatch[bet.matchId]) betsByMatch[bet.matchId] = [];
      betsByMatch[bet.matchId].push(bet);
    }

    const matchIds = Object.keys(betsByMatch);
    const results = [];

    if (matchIds.length > 0) {
      const apiParams = {
        filters: `fixtureIds:${matchIds.join(",")}`,
        include: "odds;state;scores;participants",
        per_page: matchIds.length,
      };
      let matches = [];
      try {
        const response = await FixtureOptimizationService.getOptimizedFixtures(
          apiParams
        );
        matches = response.data || [];
      } catch (error) {
        console.error("Error fetching match data for overdue bets:", error);
      }

      for (const match of matches) {
        if (match.state?.id === 5) {
          FixtureOptimizationService.fixtureCache.set(
            `match_${match.id}`,
            match,
            24 * 3600
          );
        }
        for (const bet of betsByMatch[match.id]) {
          try {
            const result = await this.checkBetOutcome(bet._id, match);
            results.push(result);
          } catch (error) {
            console.error(`Error processing overdue bet ${bet._id}:`, error);
            results.push({
              betId: bet._id,
              status: bet.status,
              message: "Error processing bet",
            });
          }
        }
      }

      // Handle matches not found in API response
      for (const matchId of matchIds) {
        if (
          !matches.find((m) => m.id == matchId || m.id === parseInt(matchId))
        ) {
          for (const bet of betsByMatch[matchId]) {
            // Reschedule for 10 minutes later
            const newScheduleTime = new Date(now.getTime() + 10 * 60 * 1000);
            const cronTime = `${newScheduleTime.getMinutes()} ${newScheduleTime.getHours()} ${newScheduleTime.getDate()} ${
              newScheduleTime.getMonth() + 1
            } *`;
            cron.schedule(
              cronTime,
              async () => {
                try {
                  await this.checkBetOutcome(bet._id);
                  console.log(
                    `Rescheduled overdue bet ${
                      bet._id
                    } checked at ${new Date().toISOString()}`
                  );
                } catch (error) {
                  console.error(
                    `Error rescheduling overdue bet ${bet._id}:`,
                    error
                  );
                }
              },
              { scheduled: true, timezone: "UTC" }
            );
            results.push({
              betId: bet._id,
              status: bet.status,
              message: "Match data not found, rescheduled",
            });
          }
        }
      }
    }

    return results;
  }
}

export default new BetService();
