import { supabase, getPublicUrl } from './supabase';

let cachedMenuProducts: any[] | null = null;
let isPreloading = false;

export function getCachedMenuProducts() {
  return cachedMenuProducts;
}

export function setCachedMenuProducts(products: any[]) {
  cachedMenuProducts = products;
}

export async function preloadTourAssets() {
  if (isPreloading) return;
  isPreloading = true;

  try {
    // 1. Pre-load key image assets into browser cache
    const imageUrlsToPreload = [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80',
    ];

    imageUrlsToPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });

    // 2. Fetch Supabase menu tables in advance to populate cache
    if (supabase) {
      const tables = ['student_menu', 'proff_menu', 'elite_menu'];
      const fetchedProducts: any[] = [];

      for (const tName of tables) {
        const { data } = await supabase.from(tName).select('*').eq('is_available', true);
        if (data && data.length > 0) {
          data.forEach((p: any) => {
            const imgUrl = getPublicUrl(p.image_url);
            if (imgUrl) {
              const img = new Image();
              img.src = imgUrl;
            }
            fetchedProducts.push({
              id: p.id.toString(),
              code: p.code,
              name: p.name,
              protein: Number(p.protein || 0),
              calories: Number(p.calories || 0),
              price: Number(p.price || 0),
              isVeg: p.is_veg,
              image: getPublicUrl(p.image_url),
              tags: p.tags || [],
              carbs: Number(p.carbs || 0),
              fats: Number(p.fat || 0),
            });
          });
        }
      }

      if (fetchedProducts.length > 0) {
        cachedMenuProducts = fetchedProducts;
      }
    }
  } catch (err) {
    console.warn('Preload assets error:', err);
  }
}
