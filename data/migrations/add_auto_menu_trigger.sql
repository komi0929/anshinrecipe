-- Trigger function to auto-create menu from review
CREATE OR REPLACE FUNCTION public.handle_new_menu_from_review()
RETURNS TRIGGER AS $$
DECLARE
    first_image_url TEXT;
BEGIN
    -- Only proceed if it is a menu post and has a custom menu name
    IF NEW.review_type = 'menu_post' AND NEW.is_own_menu = true AND NEW.custom_menu_name IS NOT NULL AND TRIM(NEW.custom_menu_name) <> '' THEN
        
        -- Check if menu already exists for this restaurant (case insensitive)
        IF NOT EXISTS (
            SELECT 1 FROM public.menus 
            WHERE restaurant_id = NEW.restaurant_id 
            AND LOWER(name) = LOWER(TRIM(NEW.custom_menu_name))
        ) THEN
            -- Get first image if available
            IF array_length(NEW.images, 1) > 0 THEN
                first_image_url := NEW.images[1];
            ELSE
                first_image_url := NULL;
            END IF;

            -- Insert new menu
            INSERT INTO public.menus (
                restaurant_id, 
                name, 
                price, 
                allergens, 
                tags,
                image_url, -- Set initial image from review
                created_at
            ) VALUES (
                NEW.restaurant_id,
                TRIM(NEW.custom_menu_name),
                NEW.price_paid, 
                NEW.allergens_safe, 
                ARRAY['user_submitted'], 
                first_image_url,
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_review_posted_menu_check ON public.reviews;
CREATE TRIGGER on_review_posted_menu_check
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_menu_from_review();
