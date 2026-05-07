import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { fetchProfile } from "../store/authSlice";

export const useProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const isLoading = useSelector(
    (state: RootState) => state.auth.isProfileLoading,
  );

  const refresh = (sub: string) => dispatch(fetchProfile(sub));

  return { profile, isLoading, refresh };
};
