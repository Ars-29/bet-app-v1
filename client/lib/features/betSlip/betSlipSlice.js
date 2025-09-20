import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/config/axios";
import { setUser } from "@/lib/features/auth/authSlice";

const betSlipSlice = createSlice({
  name: "betSlip",
  initialState: {
    bets: [],
    isOpen: false,
    isExpanded: false, // New state for expanded/collapsed
    activeTab: "singles",
    stake: {
      singles: {},
      combination: 0,
      system: 0,
    },
    totalStake: 0,
    potentialReturn: 0,
    lastError: null, // For storing error messages like "same market bet exists"
  },
  reducers: {
    addBet: (state, action) => {
      const {
        match,
        selection,
        odds,
        type = "1x2",
        oddId = null,
        marketDescription,
        handicapValue,
        halfIndicator,
        total,
        name,
        marketId, // Add marketId to destructuring
        ...rest
      } = action.payload;

      console.log("Adding bet with payload:", action.payload);
      console.log("MarketId type and value:", typeof marketId, marketId);

      // Check if bet already exists (same oddId) or same market bet exists (same match + marketId)
      // For combination bets, we allow multiple selections from the same market (1X2)
      const existingBetIndex = state.bets.findIndex(
        (bet) => bet.oddId === oddId || (bet.match.id === match.id && bet.marketId === marketId && !(typeof marketId === 'string' && marketId.includes('_')))
      );

      // If same market bet exists, don't add it (only for non-combination markets)
      if (existingBetIndex >= 0) {
        const existingBet = state.bets[existingBetIndex];
        if (existingBet.oddId === oddId) {
          // Same exact bet, update it
          console.log("Updating existing bet with same oddId");
        } else if (!(typeof marketId === 'string' && marketId.includes('_'))) {
          // Same market bet exists for non-combination markets, don't add
          console.log("Same market bet already exists for this match, not adding");
          state.lastError = "You already have a bet on this market for this match";
          return; // Exit early, don't add the bet
        }
      }

      // Determine if match is live/inplay
      const isMatchLive = (match) => {
        if (!match || !match.starting_at) return match?.isLive || false;
        const now = new Date();
        let matchTime;
        if (match.starting_at.includes('T')) {
          matchTime = new Date(match.starting_at.endsWith('Z') ? match.starting_at : match.starting_at + 'Z');
        } else {
          matchTime = new Date(match.starting_at.replace(' ', 'T') + 'Z');
        }
        const matchEnd = new Date(matchTime.getTime() + 120 * 60 * 1000);
        return matchTime <= now && now < matchEnd;
      };

      const inplay = isMatchLive(match);

      const newBet = {
        id: `${match.id}-${oddId}-${Date.now()}`,
        match: {
          id: match.id,
          team1: match.team1 || (match.participants && match.participants[0] ? match.participants[0].name : 'Team 1'),
          team2: match.team2 || (match.participants && match.participants[1] ? match.participants[1].name : 'Team 2'),
          competition: match.competition || match.league?.name || "Football",
          time: match.time || match.startTime || (match.starting_at ? match.starting_at.split(' ')[1].slice(0, 5) : ''),
          isLive: match.isLive || false,
          name: match.name || `${match.team1 || ''} vs ${match.team2 || ''}`,
          starting_at: match.starting_at, // Keep for inplay calculation
        },
        selection,
        odds: parseFloat(odds),
        type,
        stake: 0,
        oddId,
        marketDescription,
        handicapValue,
        halfIndicator,
        total,
        name,
        label: action.payload.label || selection, // Use provided label if available
        marketId, // Store marketId in bet object
        marketName: marketDescription, // Store for combination bet payload
        inplay, // ✅ Add inplay flag for combination bets
        ...rest
      };

      if (existingBetIndex >= 0 && state.bets[existingBetIndex].oddId === oddId) {
        // Update existing bet with same oddId
        state.bets[existingBetIndex] = newBet;
      } else if (existingBetIndex === -1) {
        // Add new bet (no existing bet found)
        state.bets.push(newBet);
      }
      // If existingBetIndex >= 0 but oddId doesn't match, we already returned early above
      
      // Auto-open bet slip when bet is added
      state.isOpen = true;
      state.isExpanded = false; // Start collapsed when new bet is added

      // Update active tab based on number of bets
      if (state.bets.length === 1) {
        state.activeTab = "singles";
      } else if (state.bets.length >= 2) {
        // Keep current tab or switch to combination if on singles
        if (state.activeTab === "singles") {
          state.activeTab = "combination";
        }
      }
    },
    removeBet: (state, action) => {
      state.bets = state.bets.filter((bet) => bet.id !== action.payload);

      // Update state based on remaining bets
      if (state.bets.length === 0) {
        state.isOpen = false;
        state.isExpanded = false;
      } else if (state.bets.length === 1) {
        state.activeTab = "singles";
      }
    },
    clearAllBets: (state) => {
      state.bets = [];
      state.isOpen = false;
      state.isExpanded = false;
      state.activeTab = "singles";
      state.stake = {
        singles: {},
        combination: 0,
        system: 0,
      };
      state.totalStake = 0;
      state.potentialReturn = 0;
      state.lastError = null;
    },

    toggleBetSlip: (state) => {
      if (state.bets.length > 0) {
        state.isExpanded = !state.isExpanded;
      } else {
        state.isOpen = false;
        state.isExpanded = false;
      }
    },

    expandBetSlip: (state) => {
      if (state.bets.length > 0) {
        state.isExpanded = true;
      }
    },

    collapseBetSlip: (state) => {
      state.isExpanded = false;
    },

    closeBetSlip: (state) => {
      state.isOpen = false;
      state.isExpanded = false;
    },

    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    updateSingleStake: (state, action) => {
      const { betId, stake } = action.payload;
      state.stake.singles[betId] = parseFloat(stake) || 0;

      // Update the bet's stake
      const bet = state.bets.find((b) => b.id === betId);
      if (bet) {
        bet.stake = parseFloat(stake) || 0;
      }
    },

    updateCombinationStake: (state, action) => {
      state.stake.combination = parseFloat(action.payload) || 0;
    },

    updateSystemStake: (state, action) => {
      state.stake.system = parseFloat(action.payload) || 0;
    },

    setError: (state, action) => {
      state.lastError = action.payload;
    },

    clearError: (state) => {
      state.lastError = null;
    },



    calculateTotals: (state) => {
      let totalStake = 0;
      let potentialReturn = 0;

      if (state.activeTab === "singles") {
        // Calculate singles totals
        state.bets.forEach((bet) => {
          const stake = state.stake.singles[bet.id] || 0;
          totalStake += stake;
          potentialReturn += stake * bet.odds;
        });
      } else if (state.activeTab === "combination") {
        // Calculate combination totals
        totalStake = state.stake.combination;
        if (state.bets.length > 0) {
          const combinedOdds = state.bets.reduce(
            (acc, bet) => acc * bet.odds,
            1
          );
          potentialReturn = totalStake * combinedOdds;
        }
      } else if (state.activeTab === "system") {
        // Calculate system totals (simplified)
        totalStake = state.stake.system;
        if (state.bets.length >= 2) {
          // Simplified system calculation - in reality this would be more complex
          const avgOdds =
            state.bets.reduce((acc, bet) => acc + bet.odds, 0) /
            state.bets.length;
          potentialReturn = totalStake * avgOdds * 0.8; // System has lower potential than full combination
        }
      }

      state.totalStake = Math.round(totalStake * 100) / 100;
      state.potentialReturn = Math.round(potentialReturn * 100) / 100;
    },
  },
});

export const {
  addBet,
  removeBet,
  clearAllBets,
  toggleBetSlip,
  expandBetSlip,
  collapseBetSlip,
  closeBetSlip,
  setActiveTab,
  updateSingleStake,
  updateCombinationStake,
  updateSystemStake,
  setError,
  clearError,
  calculateTotals,
} = betSlipSlice.actions;

// Selectors
export const selectBetSlip = (state) => state.betSlip;
export const selectBets = (state) => state.betSlip.bets;
export const selectBetSlipOpen = (state) => state.betSlip.isOpen;
export const selectBetSlipExpanded = (state) => state.betSlip.isExpanded;
export const selectActiveTab = (state) => state.betSlip.activeTab;
export const selectTotalStake = (state) => state.betSlip.totalStake;
export const selectPotentialReturn = (state) => state.betSlip.potentialReturn;
export const selectLastError = (state) => state.betSlip.lastError;

// Helper function to extract Unibet metadata from match data
const extractUnibetMetadata = (bet, matchData) => {
  console.log('🔍 Debug matchData structure:', {
    hasData: !!matchData?.data,
    dataKeys: matchData?.data ? Object.keys(matchData.data) : 'no data',
    hasGroupId: !!matchData?.data?.groupId,
    hasGroup: !!matchData?.data?.group,
    groupId: matchData?.data?.groupId,
    group: matchData?.data?.group,
    // Check if it's test data structure
    isTestData: matchData?.data?.betOffers && Array.isArray(matchData.data.betOffers),
    // Check root level for test data
    rootGroupId: matchData?.data?.groupId,
    rootGroup: matchData?.data?.group,
    // Check events array
    hasEvents: !!matchData?.data?.events,
    eventsLength: matchData?.data?.events?.length || 0,
    eventsGroupId: matchData?.data?.events?.[0]?.groupId,
    eventsGroup: matchData?.data?.events?.[0]?.group
  });
  
  if (!matchData?.data?.betOffers || !Array.isArray(matchData.data.betOffers)) {
    console.warn('No betOffers data available for metadata extraction');
    return {};
  }

  // Find the bet offer that matches this bet
  const betOffer = matchData.data.betOffers.find(offer => 
    offer.outcomes?.some(outcome => outcome.id === bet.oddId)
  );

  if (!betOffer) {
    console.warn(`No bet offer found for oddId: ${bet.oddId}`);
    return {};
  }

  // Find the specific outcome
  const outcome = betOffer.outcomes?.find(outcome => outcome.id === bet.oddId);
  
  if (!outcome) {
    console.warn(`No outcome found for oddId: ${bet.oddId}`);
    return {};
  }

  console.log('Extracted metadata:', {
    betOffer: betOffer.criterion?.label,
    outcome: outcome.label,
    leagueId: matchData.data.groupId,
    leagueName: matchData.data.group,
    fullMatchData: matchData
  });

  // Extract metadata
  return {
    eventName: `${bet.match.team1} vs ${bet.match.team2}`,
    marketName: betOffer.criterion?.label || betOffer.betOfferType?.name || bet.marketDescription,
    criterionLabel: betOffer.criterion?.label || null,
    criterionEnglishLabel: betOffer.criterion?.englishLabel || null,
    outcomeEnglishLabel: outcome.englishLabel || outcome.label,
    participant: outcome.participant || null,
    participantId: outcome.participantId || null,
    eventParticipantId: outcome.eventParticipantId || null,
    betOfferTypeId: betOffer.betOfferType?.id || null,
    handicapRaw: outcome.line ? Math.round(outcome.line * 1000) : null,
    handicapLine: outcome.line || null,
    leagueId: matchData.data.groupId || matchData.data.event?.groupId || matchData.data.events?.[0]?.groupId || null,
    leagueName: matchData.data.group || matchData.data.event?.group || matchData.data.events?.[0]?.group || null,
    homeName: bet.match.team1,
    awayName: bet.match.team2,
    start: bet.match.starting_at
  };
};

// Thunk to place bets (supports both singles and combination bets)
export const placeBetThunk = createAsyncThunk(
  "betSlip/placeBet",
  async (_, { getState, rejectWithValue, dispatch }) => {
    const state = getState().betSlip;
    const bets = state.bets;
    const activeTab = state.activeTab;
    const stakes = state.stake.singles;
    const combinationStake = state.stake.combination;
    
    // Get match data from Redux state for Unibet metadata extraction
    const matchesState = getState().matches;
    
    try {
      const results = [];
      console.log("Placing bets:", { activeTab, betsCount: bets.length, bets });

      if (activeTab === "singles") {
        // Handle single bets (clean, label-based)
        for (const bet of bets) {
          const stake = stakes[bet.id] || 0;
          if (!bet.match.id || !bet.oddId || !stake) {
            continue; // skip invalid
          }
          
          // Extract Unibet metadata from match data
          const matchData = matchesState.matchDetailsV2?.[bet.match.id]?.matchData;
          const unibetMetadata = extractUnibetMetadata(bet, matchData);
          
          console.log('Unibet metadata extracted:', unibetMetadata);
          
          // Use label for betOption and selection
          const label = bet.label || bet.selection;
          const payload = {
            matchId: bet.match.id,
            oddId: bet.oddId,
            stake,
            odds: bet.odds,
            betOption: label,
            selection: label,
            teams: `${bet.match.team1} vs ${bet.match.team2}`,
            marketId: (typeof bet.marketId === 'string' && bet.marketId.includes('_')) ? bet.marketId.split('_')[0] : bet.marketId,
            betDetails: {
              market_id: (typeof bet.marketId === 'string' && bet.marketId.includes('_')) ? bet.marketId.split('_')[0] : bet.marketId,
              market_name: bet.marketName || "Unknown Market",
              label,
              value: bet.odds,
              total: bet.total || null,
              market_description: bet.marketDescription || null,
              handicap: bet.handicapValue || null,
              name: bet.name || label
            },
            ...(bet.match.starting_at && { matchDate: bet.match.starting_at }),
            ...(bet.match.estimatedMatchEnd && { estimatedMatchEnd: bet.match.estimatedMatchEnd }),
            ...(bet.match.betOutcomeCheckTime && { betOutcomeCheckTime: bet.match.betOutcomeCheckTime }),
            inplay: bet.inplay || false,
            // Add these fields for live matches
            ...(bet.inplay && { 
              isLive: true,
              matchStartTime: bet.match.starting_at,
              matchEndTime: bet.match.estimatedMatchEnd || (bet.match.starting_at ? new Date(new Date(bet.match.starting_at).getTime() + 120 * 60 * 1000).toISOString() : null)
            }),
            // Add Unibet metadata for enrichment
            ...unibetMetadata
          };
                      console.log("Single bet payload:", payload);
            console.log("Single bet - matchId type:", typeof payload.matchId, "value:", payload.matchId);
            console.log("Single bet - inplay:", payload.inplay, "isLive:", payload.isLive);

          const response = await apiClient.post("/bet/place-bet", payload);
          results.push(response.data);
          // Update user balance
          if (response.data.user) {
            dispatch(setUser(response.data.user));
          }
        }
      } else if (activeTab === "combination" && bets.length >= 2) {
        // Handle combination bet (NEW)
        if (!combinationStake || combinationStake <= 0) {
          throw new Error("Please enter a valid stake for combination bet");
        }

        // Prepare combination data for backend
        const combinationData = bets.map(bet => {
          const label = bet.label || bet.selection;
          
          // Extract Unibet metadata from match data for each leg
          const matchData = matchesState.matchDetailsV2?.[bet.match.id]?.matchData;
          const unibetMetadata = extractUnibetMetadata(bet, matchData);
          
          return {
            matchId: bet.match.id,
            oddId: bet.oddId,
            betOption: label, // Always use label for betOption
            odds: bet.odds,
            stake: combinationStake, // Same stake for all legs
            inplay: bet.inplay || false,
            selection: label, // Always use label for selection
            teams: `${bet.match.team1} vs ${bet.match.team2}`,
            marketId: (typeof bet.marketId === 'string' && bet.marketId.includes('_')) ? bet.marketId.split('_')[0] : bet.marketId,
            betDetails: {
              market_id: (typeof bet.marketId === 'string' && bet.marketId.includes('_')) ? bet.marketId.split('_')[0] : bet.marketId,
              market_name: bet.marketName || "Unknown Market",
              label,
              value: bet.odds,
              total: bet.total || null,
              market_description: bet.marketDescription || null,
              handicap: bet.handicapValue || null,
              name: bet.name || label
            },
            ...(bet.match.starting_at && { matchDate: bet.match.starting_at }),
            ...(bet.match.estimatedMatchEnd && { estimatedMatchEnd: bet.match.estimatedMatchEnd }),
            ...(bet.match.betOutcomeCheckTime && { betOutcomeCheckTime: bet.match.betOutcomeCheckTime }),
            // Add these fields for live matches
            ...(bet.inplay && { 
              isLive: true,
              matchStartTime: bet.match.starting_at,
              matchEndTime: bet.match.estimatedMatchEnd || (bet.match.starting_at ? new Date(new Date(bet.match.starting_at).getTime() + 120 * 60 * 1000).toISOString() : null)
            }),
            // Add Unibet metadata for enrichment
            ...unibetMetadata
          };
        });

        // Generate combination bet identifiers
        const combinationOddId = `combo_${Date.now()}`;
        const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
        
        // For combination bets, use proper combination identifiers
        const payload = {
          matchId: "combination", // ✅ Use "combination" as matchId 
          oddId: combinationOddId, // ✅ Generate unique combination oddId
          stake: combinationStake,
          betOption: `Combination Bet (${bets.length} legs)`, // ✅ Proper combination description
          marketId: "combination", // ✅ Use "combination" as marketId
          combinationData // ✅ This contains all the bet details
        };

        console.log("Combination bet payload:", {
          ...payload,
          combinationDataSample: combinationData.slice(0, 2) // Log first 2 legs for debugging
        });

        const response = await apiClient.post("/bet/place-bet", payload);
        results.push(response.data);
        
        // Update user balance
        if (response.data.user) {
          dispatch(setUser(response.data.user));
        }
      } else {
        throw new Error(`Invalid bet configuration: ${activeTab} with ${bets.length} bets`);
      }

      console.log("Bet placement results:", results);
      dispatch(clearAllBets());
      return results;
    } catch (error) {
      // Check if this is a client error (4xx status) before logging as error
      if (error.response?.status >= 400 && error.response?.status < 500) {
        // Log client errors as info, not error
        console.log("Client error (like conflicting bet):", error.response?.data);
      } else {
        // Log server errors as errors
        console.error("Error placing bet:", error);
      }
      
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to place bet",
          error: error.message,
        }
      );
    }
  }
);

export default betSlipSlice.reducer;
