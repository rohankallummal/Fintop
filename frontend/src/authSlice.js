import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.userData = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.userData = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
