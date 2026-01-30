
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side usage (static generation/metadata)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Anon key is fine for public recipes
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({ params }) {
    // Await params if necessary (Next.js 15 requires awaiting params in dynamic routes, but 14 doesn't. 
    // Safety check: assume params is object or promise)
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        const { data: recipe } = await supabase
            .from('recipes')
            .select('title, image_url, description')
            .eq('id', id)
            .single();

        if (!recipe) {
            return {
                title: 'レシピが見つかりません | あんしんレシピ',
            };
        }

        const ogUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'https://anshinrecipe.com'}/api/og`);
        ogUrl.searchParams.set('title', recipe.title);
        if (recipe.image_url) {
            ogUrl.searchParams.set('image', recipe.image_url);
        }

        return {
            title: `${recipe.title} | あんしんレシピ`,
            description: recipe.description || 'アレルギー対応・子供のごはん共有アプリ',
            openGraph: {
                title: recipe.title,
                description: recipe.description || 'アレルギー対応・子供のごはん共有アプリ',
                images: [
                    {
                        url: ogUrl.toString(),
                        width: 1200,
                        height: 630,
                        alt: recipe.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: recipe.title,
                description: recipe.description || 'アレルギー対応・子供のごはん共有アプリ',
                images: [ogUrl.toString()],
            },
        };
    } catch (error) {
        console.error('Metadata generation error:', error);
        return {
            title: 'あんしんレシピ',
        };
    }
}

export default function RecipeLayout({ children }) {
    return children;
}
