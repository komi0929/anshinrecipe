# Database Schema (Current)
* **users:** id, email, created_at, avatar_url, allergy_profile (jsonb)
* **pins (recipes):** id, user_id, title, image_url, original_url, description, ingredients_tags (array)
* **tried_reports:** id, user_id, pin_id, comment, image_url
* **reactions:** id, user_id, pin_id, type (yummy/helpful/ate_it)
