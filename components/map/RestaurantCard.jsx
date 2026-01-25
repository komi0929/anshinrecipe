"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  ShieldCheck,
  ChevronRight,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { VisitedBadge } from "./VisitedMarker";
import { AllergenBadges } from "./AllergenBadges";

/**
 * 店舗リストカード統一コンポーネント（92件改善 Phase2）
 * 2.12 ListCardとの表示統一
 */

export const RestaurantCard = ({
  restaurant,
  variant = "default", // 'default' | 'compact' | 'featured'
  showAllergens = true,
  showDistance = false,
  distance,
}) => {
  const {
    id,
    name,
    address,
    images,
    rating,
    review_count,
    is_owner_verified,
    features,
    allergen_status,
  } = restaurant;

  const mainImage = images?.[0];

  if (variant === "compact") {
    return (
      <Link
        href={`/map/${id}`}
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🍽️
            </div>
          )}
          <VisitedBadge restaurantId={id} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-slate-800 truncate">{name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {rating && (
              <span className="flex items-center gap-0.5">
                <Star size={10} fill="#FBBF24" className="text-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
            {showDistance && distance && <span>{distance}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/map/${id}`}
        className="block bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-slate-100"
      >
        <div className="relative h-40">
          {mainImage ? (
            <img
              src={mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
          <VisitedBadge restaurantId={id} />
          {is_owner_verified && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-[10px] font-bold">
              <BadgeCheck size={12} /> 公認
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-slate-800 mb-1">{name}</h3>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <MapPin size={12} /> {address}
          </p>
          {showAllergens && allergen_status && (
            <AllergenBadges allergenStatus={allergen_status} compact />
          )}
        </div>
      </Link>
    );
  }

  // default variant
  return (
    <Link
      href={`/map/${id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100"
    >
      <div className="flex">
        {/* Image */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl">
              🍽️
            </div>
          )}
          <VisitedBadge restaurantId={id} />
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-bold text-sm text-slate-800">{name}</h3>
                {is_owner_verified && (
                  <BadgeCheck size={14} className="text-blue-500" />
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{address}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            {rating && (
              <div className="flex items-center gap-1 text-xs">
                <Star size={12} fill="#FBBF24" className="text-amber-400" />
                <span className="font-bold text-slate-700">
                  {rating.toFixed(1)}
                </span>
                {review_count && (
                  <span className="text-slate-400">({review_count})</span>
                )}
              </div>
            )}
            {showDistance && distance && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={10} /> {distance}
              </span>
            )}
          </div>

          {/* Quick Allergen Status */}
          {showAllergens && allergen_status && (
            <div className="mt-2">
              <AllergenBadges allergenStatus={allergen_status} compact />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
