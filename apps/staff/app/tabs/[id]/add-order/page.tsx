// apps/staff/app/tabs/[id]/add-order/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Search, X, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatUtils';

interface UnifiedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  sku?: string;
  is_custom: boolean;
  source: 'bar-inventory' | 'global-catalog';
  bar_product_id?: string;
  product_id?: string;
  custom_product_id?: string;
}

interface CartItem extends UnifiedProduct {
  quantity: number;
}

export default function AddOrderPage() {
  const router = useRouter();
  const params = useParams();
  const tabId = params.id as string;
  
  const [tab, setTab] = useState<any>(null);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [orderCart, setOrderCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customData, setCustomData] = useState({ 
    name: '', 
    category: '', 
    description: '' 
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        console.log('🔍 Starting data load for tab:', tabId);
        
        // Load tab data first to get bar_id
        const { data: tabData, error: tabError } = await supabase
          .from('tabs')
          .select('*')
          .eq('id', tabId)
          .single();

        if (tabError) {
          console.error('❌ Error loading tab:', tabError);
          alert('Failed to load tab. Redirecting...');
          router.push('/');
          return;
        }

        console.log('✅ Tab loaded:', tabData);
        setTab(tabData);

        if (!tabData.bar_id) {
          console.error('❌ Tab has no bar_id!');
          alert('Tab is not associated with a bar. Redirecting...');
          router.push('/');
          return;
        }

        // Now load products for this bar
        await loadProducts(tabData.bar_id);
        
      } catch (error) {
        console.error('❌ Error in loadAllData:', error);
        alert('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [tabId, router]);

  const loadProducts = async (barId: string) => {
    console.log('🔍 Loading products for bar_id:', barId);
    
    try {
      // 1. Load products already in bar inventory (bar_products table)
      const { data: barProducts, error: barError } = await supabase
        .from('bar_products')
        .select('*')
        .eq('bar_id', barId)
        .eq('active', true)
        .order('category, name');

      if (barError) {
        console.error('❌ Error loading bar products:', barError);
        throw barError;
      }

      console.log(`✅ Loaded ${barProducts?.length || 0} bar products`);

      // Transform bar products into UnifiedProduct format
      const barProductsUnified: UnifiedProduct[] = (barProducts || []).map(bp => ({
        id: bp.id, // Use bar_product_id as the main ID for cart
        bar_product_id: bp.id,
        name: bp.name,
        category: bp.category,
        price: bp.sale_price,
        description: bp.description,
        image_url: bp.image_url,
        sku: bp.sku,
        is_custom: !!bp.custom_product_id,
        source: 'bar-inventory' as const,
        product_id: bp.product_id,
        custom_product_id: bp.custom_product_id
      }));

      // 2. Load global products NOT in bar inventory
      const { data: globalProducts, error: globalError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('category, name');

      if (globalError) {
        console.error('❌ Error loading global products:', globalError);
        throw globalError;
      }

      console.log(`✅ Loaded ${globalProducts?.length || 0} global products`);

      const globalProductsUnified: UnifiedProduct[] = (globalProducts || [])
        .filter(gp => !barProductsUnified.some(bp => bp.product_id === gp.id))
        .map(gp => ({
          id: gp.id,
          name: gp.name,
          category: gp.category,
          price: 0, // Not yet priced for this bar
          description: gp.description,
          image_url: gp.image_url,
          sku: gp.sku,
          is_custom: false,
          source: 'global-catalog',
          product_id: gp.id
        }));

      // Combine products - show bar inventory first, then unpriced global products
      const allProducts = [...barProductsUnified, ...globalProductsUnified];
      console.log(`✅ Total products to display: ${allProducts.length}`);
      setProducts(allProducts);

    } catch (error) {
      console.error('❌ Error in loadProducts:', error);
      alert('Failed to load products. Please refresh and try again.');
    }
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `CUSTOM-${timestamp}-${random}`;
  };

  const addProductToBar = async (product: UnifiedProduct) => {
    console.log('🔍 Starting addProductToBar for:', product.name);
    
    if (!tab?.bar_id) {
      console.error('❌ No bar_id found in tab data');
      alert('Cannot add product - bar information missing.');
      return;
    }

    const price = prompt(`Set price for ${product.name}:`, '300');
    if (!price || parseFloat(price) <= 0) {
      console.log('❌ Invalid price or cancelled');
      return;
    }

    console.log('✅ Price entered:', price);

    try {
      // Check if product already exists in bar_products
      const { data: existingProduct, error: checkError } = await supabase
        .from('bar_products')
        .select('id')
        .eq('bar_id', tab.bar_id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing product:', checkError);
        throw checkError;
      }

      if (existingProduct) {
        // Update existing product price
        const { error: updateError } = await supabase
          .from('bar_products')
          .update({ 
            sale_price: parseFloat(price),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id);

        if (updateError) {
          console.error('❌ Error updating product:', updateError);
          throw updateError;
        }
        
        console.log('✅ Updated existing product price');
        
      } else {
        // Insert new product to bar_products
        const { data: newBarProduct, error: insertError } = await supabase
          .from('bar_products')
          .insert({
            bar_id: tab.bar_id,
            product_id: product.id,
            sale_price: parseFloat(price),
            name: product.name,
            category: product.category,
            description: product.description,
            image_url: product.image_url,
            sku: product.sku,
            active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting product:', insertError);
          
          // Check for constraint violation
          if (insertError.code === '23505') {
            alert('This product already exists in the bar menu. Please refresh the page.');
          } else {
            throw insertError;
          }
        } else {
          console.log('✅ Added new product to bar_products:', newBarProduct);
        }
      }

      // Refresh products
      await loadProducts(tab.bar_id);
      alert(`✅ ${product.name} added to menu at ${formatCurrency(parseFloat(price))}!`);

    } catch (error) {
      console.error('❌ Error in addProductToBar:', error);
      alert(`Failed to add ${product.name} to menu. Please try again.`);
    }
  };

  const createCustomProduct = async () => {
    if (!customData.name || !customData.category) return;

    if (!tab?.bar_id) {
      console.error('❌ No bar_id found in tab data');
      alert('Cannot create product - bar information missing.');
      return;
    }

    try {
      // 1. Get price first
      const price = prompt(`Set price for ${customData.name}:`, '500');
      if (!price || parseFloat(price) <= 0) return;

      console.log('🔍 Creating custom product:', customData.name);

      // 2. Create in custom_products table
      const customProductData = {
        bar_id: tab.bar_id,
        name: customData.name,
        category: customData.category,
        description: customData.description,
        sku: generateSKU(),
        active: true
      };

      const { data: newCustomProduct, error: customError } = await supabase
        .from('custom_products')
        .insert(customProductData)
        .select()
        .single();

      if (customError) {
        console.error('❌ Error creating custom product:', customError);
        throw customError;
      }

      console.log('✅ Custom product created:', newCustomProduct);

      // 3. Create in bar_products WITH price
      const barProductData = {
        bar_id: tab.bar_id,
        custom_product_id: newCustomProduct.id,
        sale_price: parseFloat(price),
        name: customData.name,
        category: customData.category,
        description: customData.description,
        sku: newCustomProduct.sku,
        active: true
      };

      const { data: newBarProduct, error: barError } = await supabase
        .from('bar_products')
        .insert(barProductData)
        .select()
        .single();

      if (barError) {
        console.error('❌ Error adding to bar_products:', barError);
        throw barError;
      }

      console.log('✅ Custom product added to bar_products:', newBarProduct);

      // 4. Close modal and refresh
      setShowCustomModal(false);
      setCustomData({ name: '', category: '', description: '' });
      await loadProducts(tab.bar_id);
      
      alert(`✅ ${customData.name} created and added to menu!`);

    } catch (error) {
      console.error('❌ Error creating custom product:', error);
      alert('Failed to create product. Please try again.');
    }
  };

  const addToCart = (product: UnifiedProduct) => {
    if (product.price === 0 && product.source === 'global-catalog') {
      // Global product not yet priced - ask for price and add to bar
      addProductToBar(product);
      return;
    }

    const existing = orderCart.find(c => c.id === product.id);
    if (existing) {
      setOrderCart(orderCart.map(c => 
        c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setOrderCart([...orderCart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderCart(orderCart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? {...item, quantity: newQty} : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = orderCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = orderCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (orderCart.length === 0) return;

    setSubmitting(true);

    try {
      // Create detailed order items with proper references
      const orderItems = orderCart.map(item => {
        const baseItem = {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          category: item.category,
          is_custom: item.is_custom
        };

        // Add proper product references
        if (item.bar_product_id) {
          // Item from bar inventory
          return {
            ...baseItem,
            bar_product_id: item.bar_product_id,
            product_id: item.product_id || null,
            custom_product_id: item.custom_product_id || null
          };
        } else {
          // For newly added items
          return baseItem;
        }
      });

      console.log('🔍 Creating order with items:', orderItems);

      const { error: orderError } = await supabase
        .from('tab_orders')
        .insert({
          tab_id: tabId,
          items: orderItems,
          total: cartTotal,
          status: 'pending',
          initiated_by: 'staff'
        });

      if (orderError) {
        console.error('❌ Error creating order:', orderError);
        throw orderError;
      }

      alert('✅ Order sent to customer for approval!');
      
      // Clear cart and redirect
      setOrderCart([]);
      router.push(`/tabs/${tabId}`);

    } catch (error) {
      console.error('❌ Error in handleConfirmOrder:', error);
      alert('Failed to add order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addItemsToParentCart = () => {
    if (!window.opener) {
      alert('Parent window not found. Please use the main tab page.');
      return;
    }

    orderCart.forEach(item => {
      const cartItem = {
        id: `${Date.now()}_${item.id}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        type: item.is_custom ? 'custom' as const : 'catalog' as const
      };

      window.postMessage({
        type: 'ADD_TO_CART',
        item: cartItem
      }, '*');
    });

    alert(`✅ ${orderCart.length} items added to cart!`);
    router.push(`/tabs/${tabId}`);
  };

  // Filter products
  const categories = ['All', ...new Set(products
    .filter(p => p.price > 0) // Only show priced items in categories
    .map(item => item.category))];
  
  let filteredMenu = selectedCategory === 'All' 
    ? products.filter(p => p.price > 0) // Only show priced items
    : products.filter(item => item.category === selectedCategory && item.price > 0);
  
  if (searchQuery.trim()) {
    filteredMenu = filteredMenu.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto mb-3 text-orange-500 animate-spin" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Tab not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Tabs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full lg:max-w-[80%] max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 sticky top-0 z-20">
          <button 
            onClick={() => router.push(`/tabs/${tabId}`)}
            className="mb-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 inline-block"
          >
            <ArrowRight size={24} className="transform rotate-180" />
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Create Order</h1>
              <p className="text-orange-100">Tab #{tab?.tab_number}</p>
              <p className="text-xs text-orange-200 mt-1">
                🔔 Add products to bar menu or create custom items
              </p>
              {tab?.bar_id && (
                <p className="text-xs text-orange-100 mt-1">
                  Bar ID: {tab.bar_id.substring(0, 8)}...
                </p>
              )}
            </div>
            {cartCount > 0 && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-sm text-orange-100">Cart</p>
                <p className="font-bold">{cartCount} items</p>
              </div>
            )}
          </div>
        </div>

        {/* Search & Categories */}
        <div className="p-4 bg-white border-b sticky top-32 z-10">
          <div className="relative mb-3">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X size={20} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-3">
          {filteredMenu.length === 0 && !searchQuery.trim() ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No menu items found.</p>
              <p className="text-sm text-gray-400 mb-4">
                Add global products by setting a price, or create custom items.
              </p>
              <button
                onClick={() => setShowCustomModal(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600"
              >
                Create Custom Product
              </button>
            </div>
          ) : filteredMenu.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No products found for "{searchQuery}"</p>
              <button
                onClick={() => setShowCustomModal(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600"
              >
                Create Custom Product
              </button>
            </div>
          ) : (
            filteredMenu.map(item => {
              const inCart = orderCart.find(c => c.id === item.id);
              
              return (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{item.category}</p>
                      {item.price > 0 ? (
                        <p className="text-orange-600 font-bold">{formatCurrency(item.price)}</p>
                      ) : (
                        <div className="mt-1">
                          <p className="text-gray-400 text-sm">Price not set</p>
                          <button
                            onClick={() => addProductToBar(item)}
                            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1 hover:bg-blue-200"
                          >
                            Set Price to Add
                          </button>
                        </div>
                      )}
                      {item.is_custom && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full mt-1 inline-block">
                          Custom
                        </span>
                      )}
                    </div>
                    {item.price > 0 ? (
                      !inCart ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 ml-4"
                          disabled={item.price === 0}
                        >
                          <Plus size={20} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="bg-gray-200 p-2 rounded-lg hover:bg-gray-300"
                          >
                            <X size={16} />
                          </button>
                          <span className="font-bold text-lg w-8 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => addProductToBar(item)}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 ml-4 text-sm"
                      >
                        Set Price
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary - Fixed Bottom */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-green-600 to-green-700 border-t-4 border-green-800 shadow-lg p-4 z-20">
            {/* Cart Items Preview */}
            <div className="mb-3 max-h-32 overflow-y-auto">
              {orderCart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-white">{item.quantity}x {item.name}</span>
                  <span className="font-medium text-green-200">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Total & Confirm */}
            <div className="flex items-center justify-between mb-3 pt-3 border-t border-green-400">
              <div>
                <p className="text-sm text-green-200">Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(cartTotal)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addItemsToParentCart}
                  className="bg-green-800 text-white px-4 py-4 rounded-xl font-semibold hover:bg-green-900 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add to Tab
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="bg-orange-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  {submitting ? 'Submitting...' : 'Send Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Product Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Create Custom Product</h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Product Name (e.g., Special Nyama Choma)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  value={customData.name}
                  onChange={(e) => setCustomData({...customData, name: e.target.value})}
                />
                
                <select
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  value={customData.category}
                  onChange={(e) => setCustomData({...customData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="Food">Food</option>
                  <option value="Beer">Beer</option>
                  <option value="Spirits">Spirits</option>
                  <option value="Soft Drinks">Soft Drinks</option>
                  <option value="Cocktails">Cocktails</option>
                  <option value="Wine">Wine</option>
                  <option value="Shisha">Shisha</option>
                  <option value="Other">Other</option>
                </select>
                
                <textarea
                  placeholder="Description (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  rows={3}
                  value={customData.description}
                  onChange={(e) => setCustomData({...customData, description: e.target.value})}
                />
              </div>

              <button
                onClick={createCustomProduct}
                disabled={!customData.name || !customData.category}
                className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create & Set Price
              </button>
              
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomData({ name: '', category: '', description: '' });
                }}
                className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}