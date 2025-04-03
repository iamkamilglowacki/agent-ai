'use client';

interface RecipeCardProps {
    recipe: string;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    return (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
            <div className="prose prose-purple max-w-none">
                {recipe.split('\n').map((line, index) => (
                    <p key={index} className="my-2">
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
} 