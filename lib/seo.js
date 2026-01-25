import React from "react";

/**
 * SEO用メタタグコンポーネント（92件改善 Phase5）
 * 5.59-5.60 SEO・メタタグ改善
 */

// 基本メタタグ生成
export const generateMetadata = ({
  title,
  description,
  image,
  url,
  type = "website",
  siteName = "あんしんレシピ",
  twitterCard = "summary_large_image",
}) => {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription =
    "アレルギーっ子のママパパのための食レシピ・レストラン検索サービス";
  const defaultImage = "/images/og-image.jpg";

  return {
    title: fullTitle,
    description: description || defaultDescription,
    openGraph: {
      title: fullTitle,
      description: description || defaultDescription,
      url: url,
      siteName: siteName,
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title || siteName,
        },
      ],
      type: type,
    },
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description: description || defaultDescription,
      images: [image || defaultImage],
    },
  };
};

// レシピ用構造化データ
export const RecipeJsonLd = ({ recipe }) => {
  if (!recipe) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.image_url,
    author: {
      "@type": "Person",
      name: recipe.author?.username || "あんしんレシピユーザー",
    },
    datePublished: recipe.created_at,
    prepTime: recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
    cookTime: recipe.cook_time ? `PT${recipe.cook_time}M` : undefined,
    totalTime: recipe.total_time ? `PT${recipe.total_time}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings}人分` : undefined,
    recipeIngredient: recipe.ingredients?.map((i) => i.name),
    recipeInstructions: recipe.steps?.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step.description,
    })),
    suitableForDiet: recipe.allergen_free?.map(
      (a) => `https://schema.org/${a}FreeDiet`,
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

// レストラン用構造化データ
export const RestaurantJsonLd = ({ restaurant }) => {
  if (!restaurant) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.overview || restaurant.description,
    image: restaurant.images?.[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      addressRegion: restaurant.prefecture,
      addressCountry: "JP",
    },
    geo:
      restaurant.latitude && restaurant.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }
        : undefined,
    telephone: restaurant.phone,
    url: restaurant.website,
    servesCuisine: restaurant.cuisine,
    priceRange: restaurant.price_range,
    openingHoursSpecification: restaurant.business_hours?.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day,
      opens: h.open,
      closes: h.close,
    })),
    aggregateRating: restaurant.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: restaurant.rating,
          reviewCount: restaurant.review_count,
        }
      : undefined,
    amenityFeature: restaurant.features?.map((f) => ({
      "@type": "LocationFeatureSpecification",
      name: f,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

// ブレッドクラム構造化データ
export const BreadcrumbJsonLd = ({ items }) => {
  if (!items?.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@id": item.url,
        name: item.name,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default {
  generateMetadata,
  RecipeJsonLd,
  RestaurantJsonLd,
  BreadcrumbJsonLd,
};
