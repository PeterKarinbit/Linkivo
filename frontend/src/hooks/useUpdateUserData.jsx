import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userService } from "../services/userService";
import { login, logout, setLoadingFalse } from "../store/authSlice";

const useUpdateUserData = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);

  const updateUserData = async () => {
    setLoading(true);
    try {
      const userResponse = await userService.getCurrentUser();
      console.log('[useUpdateUserData] getCurrentUser response:', userResponse);
      
      // Extract user data from response
      const userData = userResponse.data || userResponse;
      console.log('[useUpdateUserData] Extracted userData:', userData);
      
      if (userData && userData.role) {
        dispatch(login({ userData }));
      } else {
        dispatch(logout());
      }
      dispatch(setLoadingFalse());
    } catch (error) {
      console.error('[useUpdateUserData] Error:', error);
      dispatch(logout());
      dispatch(setLoadingFalse());
    } finally {
      setLoading(false);
    }
  };

  return updateUserData;
};

export default useUpdateUserData;