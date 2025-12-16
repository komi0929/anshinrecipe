import RecipeDetailPage from './RecipeClient';
import { supabase } from '@/lib/supabaseClient';

export async function generateMetadata({ params }) {
    const { id } = await params;

    const { data: recipe } = await supabase
        .from('recipes')
        .select('title, image_url, memo, description')
        .eq('id', id)
        .single();

    if (!recipe) {
        return {
            title: 'レシピが見つかりません | あんしんレシピ',
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://anshin-recipe.vercel.app';
    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.set('title', recipe.title);
    if (recipe.image_url) {
        ogImageUrl.searchParams.set('image', recipe.image_url);
    }

    const description = recipe.memo || recipe.description || '食物アレルギーを持つお子様のための、安心レシピ共有アプリ';

    return {
        title: `${recipe.title} | あんしんレシピ`,
        description: description,
        openGraph: {
            title: `${recipe.title} | あんしんレシピ`,
            description: description,
            images: [
                {
                    url: ogImageUrl.toString(),
                    width: 1200,
                    height: 630,
                    alt: recipe.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${recipe.title} | あんしんレシピ`,
            description: description,
            images: [ogImageUrl.toString()],
        },
    };
}

export default async function Page({ params }) {
    // Await params for future compatibility
    const resolvedParams = await params;
    return <RecipeDetailPage />;
}
