import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./authSlice";
import subscriptionReducer from "./subscriptionSlice.js";

const store = configureStore({
    reducer: {
        auth: authSlice,
        subscription: subscriptionReducer,
    }
});

export default store