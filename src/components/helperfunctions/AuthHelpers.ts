export const getUserId = (user: any): string | undefined => {
  return user?._id || user?.id;
};