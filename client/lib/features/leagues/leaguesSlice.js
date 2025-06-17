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

const leaguesSlice = createSlice({
  name: "leagues",
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedLeague: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
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
      });
  },
});

export const { clearError, setSelectedLeague, clearSelectedLeague } = leaguesSlice.actions;
export default leaguesSlice.reducer;

// Selectors
export const selectLeagues = (state) => state.leagues.data;
export const selectLeaguesLoading = (state) => state.leagues.loading;
export const selectLeaguesError = (state) => state.leagues.error;
export const selectSelectedLeague = (state) => state.leagues.selectedLeague;
