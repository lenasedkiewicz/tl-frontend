import { User } from "../../interfaces/AuthInterfaces";

export const getUserId = (user: User): string => {
  console.info(user._id)
  return user?._id || user?.id;
};