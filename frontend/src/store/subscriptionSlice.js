import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiBase } from "../services/apiBase.js";

// Async thunks for subscription management
export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiBase.get("/subscription/status");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch subscription status");
    }
  }
);

export const fetchFeatureUsage = createAsyncThunk(
  "subscription/fetchUsage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiBase.get("/subscription/usage");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch feature usage");
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  "subscription/upgrade",
  async ({ plan, billingCycle }, { rejectWithValue }) => {
    try {
      const response = await apiBase.post("/subscription/upgrade", {
        plan,
        billingCycle,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upgrade subscription");
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiBase.post("/subscription/cancel");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to cancel subscription");
    }
  }
);

export const reactivateSubscription = createAsyncThunk(
  "subscription/reactivate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiBase.post("/subscription/reactivate");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to reactivate subscription");
    }
  }
);

const initialState = {
  subscription: null,
  usage: {},
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscription: (state) => {
      state.subscription = null;
      state.usage = {};
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUsage: (state, action) => {
      state.usage = { ...state.usage, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription status
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch feature usage
      .addCase(fetchFeatureUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeatureUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usage = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFeatureUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upgrade subscription
      .addCase(upgradeSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.subscription) {
          state.subscription.cancelAtPeriodEnd = action.payload.cancelAtPeriodEnd;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reactivate subscription
      .addCase(reactivateSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reactivateSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.subscription) {
          state.subscription.cancelAtPeriodEnd = action.payload.cancelAtPeriodEnd;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(reactivateSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectSubscription = (state) => state.subscription.subscription;
export const selectUsage = (state) => state.subscription.usage;
export const selectIsLoading = (state) => state.subscription.isLoading;
export const selectError = (state) => state.subscription.error;
export const selectLastUpdated = (state) => state.subscription.lastUpdated;

// Helper selectors for feature access
export const selectCanUseFeature = (state, featureName) => {
  const usage = state.subscription.usage[featureName];
  return usage ? usage.canUse : false;
};

export const selectFeatureRemaining = (state, featureName) => {
  const usage = state.subscription.usage[featureName];
  return usage ? usage.remaining : 0;
};

export const selectNeedsUpgrade = (state, featureName) => {
  const usage = state.subscription.usage[featureName];
  return usage ? usage.needsUpgrade : false;
};

export const selectCurrentPlan = (state) => {
  return state.subscription.subscription?.plan || "free";
};

export const selectIsActiveSubscription = (state) => {
  return state.subscription.subscription?.isActive || false;
};

export const {
  clearSubscription,
  setError,
  clearError,
  updateUsage,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer; 