import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: false,
  userData: null,
  token: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload.userData;
      if (action.payload.token) {
        state.token = action.payload.token;
      }
      state.isLoading = false;
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
      state.token = null;
      state.isLoading = false;
    },
    updateUser: (state, action) => {
      state.userData = action.payload.userData;
    },
    updateToken: (state, action) => {
      state.token = action.payload.token;
    },
    setLoadingFalse: (state) => {
      state.isLoading = false;
    },
  },
});

export const { login, logout, updateUser, updateToken, setLoadingFalse } = authSlice.actions;
export default authSlice.reducer;

