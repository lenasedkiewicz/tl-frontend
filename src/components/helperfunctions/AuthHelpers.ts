export const getUserId = (user: { _id?: string, id?: string, username: string }): string | undefined => {
  console.info(user)
  return user?._id || user?.id;
};