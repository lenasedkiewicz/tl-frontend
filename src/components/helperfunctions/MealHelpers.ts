import { MealData } from "../../interfaces/MealInterfaces";

export const sortMealsByTime = (meals: MealData[]): MealData[] => {
  return [...meals].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );
};
