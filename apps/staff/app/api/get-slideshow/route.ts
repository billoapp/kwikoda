import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barId } = req.query;

    if (!barId) {
      return res.status(400).json({ error: 'barId is required' });
    }

    // Get slideshow images
    const { data: images, error: imagesError } = await supabase
      .from('slideshow_images')
      .select('image_url, order')
      .eq('bar_id', barId)
      .eq('active', true)
      .order('order', { ascending: true });

    if (imagesError) {
      console.error('Images fetch error:', imagesError);
      throw imagesError;
    }

    // Get bar settings
    const { data: barData, error: barError } = await supabase
      .from('bars')
      .select('slideshow_settings')
      .eq('id', barId)
      .single();

    if (barError && barError.code !== 'PGRST116') { // Ignore not found errors
      console.error('Bar settings fetch error:', barError);
      throw barError;
    }

    const imageUrls = images?.map(img => img.image_url) || [];
    const settings = barData?.slideshow_settings || {
      transitionSpeed: 3000,
    };

    res.status(200).json({
      images: imageUrls,
      settings: settings
    });

  } catch (error: any) {
    console.error('Slideshow fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch slideshow' 
    });
  }
}
