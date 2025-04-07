import { Spice } from './spices';

export interface Recipe {
  title: string;
  ingredients: string[];
  steps: string[];
  spice_recommendations: {
    recipe_blend?: Spice;
  };
  alternative_dishes?: string[];
}

export interface RecipeResponse {
  recipes?: Recipe[];
  recipe?: Recipe;
  title?: string;
  ingredients?: string[];
  steps?: string[];
  spice_recommendations?: {
    recipe_blend?: Spice;
  };
} 