import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/config/axios";

// Async thunk for fetching homepage data
export const fetchHomepageData = createAsyncThunk(
  "home/fetchHomepageData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/fixtures/homepage");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to fetch homepage data"
      );
    }
  }
);

const homeSlice = createSlice({
  name: "home",
  initialState: {
    topPicks: [],
    footballDaily: [],
    loading: false,
    error: null,
    lastFetched: null,
    stats: {
      top_picks_count: 0,
      football_daily_leagues: 0,
      total_daily_matches: 0,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearHomeData: (state) => {
      state.topPicks = [];
      state.footballDaily = [];
      state.lastFetched = null;
      state.stats = {
        top_picks_count: 0,
        football_daily_leagues: 0,
        total_daily_matches: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomepageData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomepageData.fulfilled, (state, action) => {
        state.loading = false;
        state.topPicks = action.payload.top_picks || [];
        state.footballDaily = action.payload.football_daily || [];
        state.lastFetched = new Date().toISOString();
        
        // Update stats if available from backend
        state.stats = {
          top_picks_count: action.payload.top_picks?.length || 0,
          football_daily_leagues: action.payload.football_daily?.length || 0,
          total_daily_matches: action.payload.football_daily?.reduce(
            (sum, league) => sum + league.match_count, 0
          ) || 0,
        };
      })
      .addCase(fetchHomepageData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearHomeData } = homeSlice.actions;
export default homeSlice.reducer;

// Selectors
export const selectTopPicks = (state) => state.home.topPicks;
export const selectFootballDaily = (state) => state.home.footballDaily;
export const selectHomeLoading = (state) => state.home.loading;
export const selectHomeError = (state) => state.home.error;
export const selectHomeStats = (state) => state.home.stats;
export const selectLastFetched = (state) => state.home.lastFetched;
