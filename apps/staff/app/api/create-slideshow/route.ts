import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barId, imageUrls, settings } = req.body;

    if (!barId) {
      return res.status(400).json({ error: 'barId is required' });
    }

    // Update bar settings to use slideshow
    const { error: barError } = await supabase
      .from('bars')
      .update({
        static_menu_type: 'slideshow',
        slideshow_settings: settings || {
          transitionSpeed: 3000,
        }
      })
      .eq('id', barId);

    if (barError) {
      console.error('Bar update error:', barError);
      throw barError;
    }

    // Clean up existing slideshow images for this bar
    const { error: deleteError } = await supabase
      .from('slideshow_images')
      .delete()
      .eq('bar_id', barId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    // Insert new slideshow images
    const slideshowImages = imageUrls.map((url: string, index: number) => ({
      bar_id: barId,
      image_url: url,
      order: index,
      active: true,
    }));

    const { error: insertError } = await supabase
      .from('slideshow_images')
      .insert(slideshowImages);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    res.status(200).json({ 
      success: true,
      message: 'Slideshow created successfully'
    });

  } catch (error: any) {
    console.error('Slideshow creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create slideshow' 
    });
  }
}
