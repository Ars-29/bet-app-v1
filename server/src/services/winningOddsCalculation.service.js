import { match } from "assert";
import {CustomError } from "../utils/customErrors.js";
import BaseBetOutcomeCalculationService from "./baseBetOutcomeCalculation.service.js";

/**
 * Service for calculating bet outcomes for markets that have winning calculations but these dont work in inplayOdds
 */
export default class WinningOddsCalculationService extends BaseBetOutcomeCalculationService {
  constructor() {
    super();
    
    

    // Market type mappings for winning calculation markets
    this.winningMarketTypes = {
      FULLTIME_RESULT: [1],           // Fulltime Result
      DRAW_NO_BET: [10],              // Draw No Bet
      BOTH_TEAMS_TO_SCORE: [14],      // Both Teams To Score
      HOME_TEAM_EXACT_GOALS: [18],    // Home Team Exact Goals
      AWAY_TEAM_EXACT_GOALS: [19],    // Away Team Exact Goals
      FIRST_HALF_EXACT_GOALS: [33],   // First Half Exact Goals
      SECOND_HALF_EXACT_GOALS: [38],  // Second Half Exact Goals
      AWAY_TEAM_WIN_BOTH_HALVES: [39], // Away Team Win Both Halves
      HOME_TEAM_WIN_BOTH_HALVES: [41], // Home Team Win Both Halves
      ODD_EVEN: [44],                 // Odd/Even
      CLEAN_SHEET_HOME: [50],         // Clean Sheet - Home
      CLEAN_SHEET_AWAY: [51]          // Clean Sheet - Away
    };
  }

  /**
   * Main method to calculate bet outcome using winning field
   * @param {Object} bet - Bet object from database
   * @param {Object} matchData - Match data with scores, state, and odds
   * @returns {Object} - Bet outcome result
   */
  async calculateBetOutcome(bet, matchData) {
    try {
      // Validate inputs
      if (!bet || !matchData) {
        throw new CustomError("Invalid bet or match data", 400, "INVALID_DATA");
      }

     
     

      // Get market information
      const marketId = bet.betDetails?.market_id

      if (!marketId) {
        return {
          status: "canceled",
          reason: "Market ID not found",
          payout: bet.stake, // Refund stake
        };
      }

      return this.calculateOutcomeByMarketType(bet, matchData, marketId);

      // return super.calculateOutcomeFromWinningField(bet, matchData);
    
    } catch (error) {
      console.error(
        `[WinningOddsCalculation] Error calculating outcome for bet ${bet._id}:`,
        error
      );
      return {
        status: "error",
        reason: error.message,
        payout: 0,
      };
    }
  }

  /**
   * Calculate outcome based on market type using winning calculations
   */
  async calculateOutcomeByMarketType(bet, matchData, marketId) {
    const marketType = super.getMarketType(marketId);

    switch (marketType) {
      case "FULLTIME_RESULT":
        return this.calculateFulltimeResult(bet, matchData);

      case "DRAW_NO_BET":
        return this.calculateDrawNoBet(bet, matchData);

      case "BOTH_TEAMS_TO_SCORE":
        return this.calculateBothTeamsToScore(bet, matchData);

      case "HOME_TEAM_EXACT_GOALS":
      case "AWAY_TEAM_EXACT_GOALS":
        return this.calculateTeamExactGoals(bet, matchData);

      case "FIRST_HALF_EXACT_GOALS":
      case "SECOND_HALF_EXACT_GOALS":
        return this.calculateHalfExactGoals(bet, matchData);

      case "HOME_TEAM_WIN_BOTH_HALVES":
      case "AWAY_TEAM_WIN_BOTH_HALVES":
        return this.calculateWinBothHalves(bet, matchData);

      case "ODD_EVEN":
        return this.calculateOddEven(bet, matchData);

      case "CLEAN_SHEET_HOME":
      case "CLEAN_SHEET_AWAY":
        return this.calculateCleanSheet(bet, matchData);

      default:
        return this.calculateFromWinningField(bet, matchData);
    }
  }




  /**
   * Calculate Fulltime Result outcome using winning field
   */
  calculateFulltimeResult(bet, matchData) {
    try {
      // Extract match scores using parent class method
      const scores = this.extractMatchScores(matchData);
      const { homeScore, awayScore } = scores;

      // Determine actual match result
      let actualResult;
      if (homeScore > awayScore) {
        actualResult = "HOME_WIN";
      } else if (homeScore < awayScore) {
        actualResult = "AWAY_WIN";
      } else {
        actualResult = "DRAW";
      }

      // Get bet selection from betDetails first, then fallback to other sources
      const originalBetSelection = bet.betDetails?.label  
       

      if (!originalBetSelection) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Invalid bet selection",
        };
      }

      // Normalize bet selection for comparison
      const betSelection = this.normalizeBetSelection(originalBetSelection);
      
      // Check if bet wins
      const isWinning = this.isResultMatch(betSelection, actualResult);

      return {
        status: isWinning ? "won" : "lost",
        reason: `Fulltime result: ${homeScore}-${awayScore} (${actualResult})`,
      };

    } catch (error) {
      console.error(`[calculateFulltimeResult] Error:`, error);
      return {
        status: "canceled",
        payout: bet.stake, // Refund stake on error
        reason: `Error calculating fulltime result: ${error.message}`,
      };
    }
  }

  /**
   * Calculate Draw No Bet outcome using winning field
   */
  calculateDrawNoBet(bet, matchData) {
    try {
      // Extract match scores using parent class method
      const scores = this.extractMatchScores(matchData);
      const { homeScore, awayScore } = scores;

      // Determine actual match result
      let actualResult;
      if (homeScore > awayScore) {
        actualResult = "HOME_WIN";
      } else if (homeScore < awayScore) {
        actualResult = "AWAY_WIN";
      } else {
        actualResult = "DRAW";
      }

      // Get bet selection from betDetails
      const originalBetSelection = bet.betDetails?.label || bet.betDetails?.name;

      if (!originalBetSelection) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Invalid bet selection",
        };
      }

      // In Draw No Bet, if result is DRAW, refund the stake
      if (actualResult === "DRAW") {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          actualResult: actualResult,
          betSelection: originalBetSelection,
          actualScore: `${homeScore}-${awayScore}`,
          reason: `Draw No Bet: Match ended in draw ${homeScore}-${awayScore} - Stake refunded`,
        };
      }

      // Normalize bet selection for comparison (1 = HOME, 2 = AWAY)
      const betSelection = this.normalizeBetSelection(originalBetSelection);
      
      // Check if bet wins (only HOME_WIN or AWAY_WIN possible since draw is refunded)
      const isWinning = this.isResultMatch(betSelection, actualResult);

      return {
        status: isWinning ? "won" : "lost",
        reason: `Draw No Bet: ${homeScore}-${awayScore} (${actualResult})`,
      };

    } catch (error) {
      console.error(`[calculateDrawNoBet] Error:`, error);
      return {
        status: "canceled",
        payout: bet.stake, // Refund stake on error
        reason: `Error calculating draw no bet: ${error.message}`,
      };
    }
  }

  /**
   * Calculate Both Teams To Score outcome using winning field
   */
  calculateBothTeamsToScore(bet, matchData) {
    try {
      // Extract match scores using parent class method
      const scores = this.extractMatchScores(matchData);
      const { homeScore, awayScore } = scores;

      // Check if both teams scored at least one goal
      const bothTeamsScored = homeScore > 0 && awayScore > 0;

      // Get bet selection from betDetails
      const originalBetSelection = bet.betDetails?.label || bet.betDetails?.name;

      if (!originalBetSelection) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Invalid bet selection",
        };
      }

      // Normalize bet selection (Yes/No)
      const betSelection = this.normalizeBetSelection(originalBetSelection);
      const isYesBet = this.resultMappings.YES.includes(betSelection);

      // Check if bet wins
      const isWinning = isYesBet ? bothTeamsScored : !bothTeamsScored;

      return {
        status: isWinning ? "won" : "lost",
      
        reason: `Both Teams To Score: ${bothTeamsScored ? "Yes" : "No"} (${homeScore}-${awayScore})`,
      };

    } catch (error) {
      console.error(`[calculateBothTeamsToScore] Error:`, error);
      return {
        status: "canceled",
        payout: bet.stake, // Refund stake on error
        reason: `Error calculating both teams to score: ${error.message}`,
      };
    }
  }

  /**
   * Calculate Team Exact Goals outcome using winning field
   * Handles both HOME_TEAM_EXACT_GOALS (market 18) and AWAY_TEAM_EXACT_GOALS (market 19)
   */
  calculateTeamExactGoals(bet, matchData) {
    try {
      // Extract match scores using parent class method
      const scores = this.extractMatchScores(matchData);
      const { homeScore, awayScore } = scores;

      // Get market ID to determine if it's home or away team
      const marketId = parseInt(bet.betDetails?.market_id);
      const isHomeTeam = marketId === 18; // 18 = Home Team Exact Goals, 19 = Away Team Exact Goals
      const actualGoals = isHomeTeam ? homeScore : awayScore;

      // Get bet selection from betDetails
      const originalBetSelection = bet.betDetails?.label || bet.betDetails?.name;

      if (!originalBetSelection) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Invalid bet selection",
        };
      }

      // Extract the number of goals from the bet selection
      // Format examples: "Defensa y Justicia - 1 Goal", "Aldosivi - 2 Goals", etc.
      const goalMatch = originalBetSelection.match(/(\d+)\s*Goal/i);
      
      if (!goalMatch) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Could not extract goal count from bet selection",
        };
      }

      const betGoals = parseInt(goalMatch[1]);

      // Check if the actual goals match the bet
      const isWinning = actualGoals === betGoals;

      return {
        status: isWinning ? "won" : "lost",
       
        reason: `${isHomeTeam ? "Home" : "Away"} Team Exact Goals: ${actualGoals} (bet: ${betGoals})`,
      };

    } catch (error) {
      console.error(`[calculateTeamExactGoals] Error:`, error);
      return {
        status: "canceled",
        payout: bet.stake, // Refund stake on error
        reason: `Error calculating team exact goals: ${error.message}`,
      };
    }
  }

  /**
   * Calculate Half Exact Goals outcome using winning field
   */
  calculateHalfExactGoals(bet, matchData) {
    return null;
  }

  /**
   * Calculate Win Both Halves outcome using winning field
   */
  calculateWinBothHalves(bet, matchData) {
    return null;
  }

  /**
   * Calculate Odd/Even outcome using winning field
   */
  calculateOddEven(bet, matchData) {
    try {
      // Extract match scores using parent class method
      const scores = this.extractMatchScores(matchData);
      const { homeScore, awayScore } = scores;

      // Calculate total goals in the match
      const totalGoals = homeScore + awayScore;

      // Determine if total goals is odd or even
      const isEven = totalGoals % 2 === 0;
      const actualResult = isEven ? "Even" : "Odd";

      // Get bet selection from betDetails
      const originalBetSelection = bet.betDetails?.label || bet.betDetails?.name;

      if (!originalBetSelection) {
        return {
          status: "canceled",
          payout: bet.stake, // Refund stake
          reason: "Invalid bet selection",
        };
      }

      // Normalize bet selection and check if it matches actual result
      const betSelection = originalBetSelection.trim();
      const isWinning = betSelection.toLowerCase() === actualResult.toLowerCase();

      return {
        status: isWinning ? "won" : "lost",
        
        reason: `Odd/Even Goals: ${totalGoals} goals (${actualResult}) - Score: ${homeScore}-${awayScore}`,
      };

    } catch (error) {
      console.error(`[calculateOddEven] Error:`, error);
      return {
        status: "canceled",
        payout: bet.stake, // Refund stake on error
        reason: `Error calculating odd/even: ${error.message}`,
      };
    }
  }

  /**
   * Calculate Clean Sheet outcome using winning field
   */
  calculateCleanSheet(bet, matchData) {
    return null;
  }






  /**
   * Check if market has winning calculations available
   */
  checkMarketHasWinningCalculations(marketId) {
    return super.marketsWithWinningCalculations.includes(parseInt(marketId));
  }

 

}


