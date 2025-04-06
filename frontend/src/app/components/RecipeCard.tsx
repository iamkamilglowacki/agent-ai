'use client';

interface Recipe {
    title: string;
    ingredients: string[];
    steps: string[];
}

interface RecipeCardProps {
    recipe: string;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    // Funkcja do generowania trzech różnych przepisów na podstawie składników
    const generateRecipes = (baseRecipe: string): Recipe[] => {
        const recipes: Recipe[] = [
            {
                title: "Sałatka owocowa z czekoladą",
                ingredients: [
                    "2 jabłka",
                    "1 pomarańcza",
                    "1 banan",
                    "Kilkanaście kostek czekolady"
                ],
                steps: [
                    "Obierz jabłka i usuń gniazda nasienne, następnie pokrój je w małe kawałki.",
                    "Banan obierz i pokrój w plasterki.",
                    "Pomarańczę obierz, podziel na cząstki, a następnie pokrój je na mniejsze kawałki.",
                    "Wszystkie owoce umieść w misce.",
                    "Czekoladę rozpuść w kąpieli wodnej lub w mikrofalówce.",
                    "Gdy czekolada będzie płynna, polej nią owoce.",
                    "Delikatnie wymieszaj, aby wszystkie kawałki były pokryte czekoladą."
                ]
            },
            {
                title: "Fondue owocowe",
                ingredients: [
                    "2 jabłka",
                    "1 pomarańcza",
                    "1 banan",
                    "200g czekolady deserowej"
                ],
                steps: [
                    "Owoce umyj i pokrój w większe kawałki.",
                    "Czekoladę rozpuść w naczyniu do fondue.",
                    "Utrzymuj czekoladę w stanie płynnym.",
                    "Nabijaj kawałki owoców na szpilki i maczaj w czekoladzie.",
                    "Odłóż na talerz do zastygnięcia.",
                    "Podawaj od razu jako deser."
                ]
            },
            {
                title: "Mus czekoladowo-owocowy",
                ingredients: [
                    "2 jabłka",
                    "1 pomarańcza",
                    "1 banan",
                    "150g czekolady mlecznej"
                ],
                steps: [
                    "Owoce obierz i pokrój w drobne kawałki.",
                    "Czekoladę rozpuść w kąpieli wodnej.",
                    "Zmiksuj owoce na gładką masę.",
                    "Delikatnie połącz masę owocową z płynną czekoladą.",
                    "Przełóż do pucharków.",
                    "Schłodź w lodówce przez 2 godziny.",
                    "Udekoruj świeżymi owocami przed podaniem."
                ]
            }
        ];

        return recipes;
    };

    const renderRecipe = (recipe: Recipe) => {
        return (
            <div className="bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-200">
                <h2 className="text-3xl font-medium text-green-700 mb-8">
                    {recipe.title}
                </h2>
                
                <div className="mb-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Składniki:</h3>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ingredient: string, idx: number) => (
                            <li key={idx} className="flex items-center text-gray-700">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></span>
                                {ingredient}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Przygotowanie:</h3>
                    <div className="space-y-4">
                        {recipe.steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start group">
                                <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:bg-green-600 group-hover:text-white transition-colors duration-200">
                                    {idx + 1}
                                </span>
                                <p className="text-gray-700 flex-grow leading-relaxed">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const recipes = generateRecipes(recipe);

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {recipes.map((recipe, index) => (
                    <div key={index}>
                        {renderRecipe(recipe)}
                    </div>
                ))}
            </div>
        </div>
    );
} 