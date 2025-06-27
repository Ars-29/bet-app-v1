import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/config/axios";

// Async thunk for fetching leagues
export const fetchLeagues = createAsyncThunk(
  "leagues/fetchLeagues",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/sportsmonk/leagues");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to fetch leagues"
      );
    }
  }
);

// Async thunk for fetching popular leagues for sidebar
export const fetchPopularLeagues = createAsyncThunk(
  "leagues/fetchPopularLeagues",
  async (limit = 15, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/fixtures/leagues/popular", {
        params: { limit: 25 },
      });

      const leagues = response.data.data || [];
      return leagues;
    } catch (error) {
      // Return fallback data if API fails
      const fallbackLeagues = [
        {
          id: "odds-boost",
          name: "Odds Boost",
          icon: "💫",
          count: null,
          image_path: null,
        },
        {
          id: "champions-league",
          name: "Champions League",
          icon: "⚽",
          count: null,
          image_path: null,
        },
        {
          id: "premier-league",
          name: "Premier League",
          icon: "⚽",
          count: null,
          image_path: null,
        },
        { id: "nba", name: "NBA", icon: "🏀", count: null, image_path: null },
        { id: "nhl", name: "NHL", icon: "🏒", count: null, image_path: null },
        {
          id: "la-liga",
          name: "La Liga",
          icon: "⚽",
          count: null,
          image_path: null,
        },
      ];

      console.warn(
        "Failed to fetch popular leagues, using fallback data:",
        error
      );
      return fallbackLeagues;
    }
  }
);

// Async thunk for fetching matches by league
export const fetchMatchesByLeague = createAsyncThunk(
  "leagues/fetchMatchesByLeague",
  async (leagueId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/fixtures/league/${leagueId}/matches`
      );
      return { leagueId, matches: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          "Failed to fetch matches for league"
      );
    }
  }
);

const leaguesSlice = createSlice({
  name: "leagues",
  initialState: {
    data: [],
    popularLeagues: [],
    loading: false,
    popularLoading: false,
    error: null,
    selectedLeague: null,
    matchesByLeague: {},
    matchesLoading: false,
    matchesError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.matchesError = null;
    },
    setSelectedLeague: (state, action) => {
      state.selectedLeague = action.payload;
    },
    clearSelectedLeague: (state) => {
      state.selectedLeague = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeagues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Popular leagues cases
      .addCase(fetchPopularLeagues.pending, (state) => {
        state.popularLoading = true;
        state.error = null;
      })
      .addCase(fetchPopularLeagues.fulfilled, (state, action) => {
        state.popularLoading = false;
        state.popularLeagues = action.payload;
      })
      .addCase(fetchPopularLeagues.rejected, (state, action) => {
        state.popularLoading = false;
        state.error = action.payload;
      })
      // Matches by league cases
      .addCase(fetchMatchesByLeague.pending, (state) => {
        state.matchesLoading = true;
        state.matchesError = null;
      })
      .addCase(fetchMatchesByLeague.fulfilled, (state, action) => {
        state.matchesLoading = false;
        const { leagueId, matches } = action.payload;
        state.matchesByLeague[leagueId] = matches;
      })
      .addCase(fetchMatchesByLeague.rejected, (state, action) => {
        state.matchesLoading = false;
        state.matchesError = action.payload;
      });
  },
});

export const { clearError, setSelectedLeague, clearSelectedLeague } =
  leaguesSlice.actions;
export default leaguesSlice.reducer;

// Selectors
export const selectLeagues = (state) => state.leagues.data;
export const selectLeaguesLoading = (state) => state.leagues.loading;
export const selectLeaguesError = (state) => state.leagues.error;
export const selectSelectedLeague = (state) => state.leagues.selectedLeague;
export const selectPopularLeagues = (state) => state.leagues.popularLeagues;
export const selectPopularLeaguesLoading = (state) =>
  state.leagues.popularLoading;
export const selectMatchesByLeague = (state, leagueId) =>
  state.leagues.matchesByLeague[leagueId] || [];
export const selectMatchesLoading = (state) => state.leagues.matchesLoading;
export const selectMatchesError = (state) => state.leagues.matchesError;
