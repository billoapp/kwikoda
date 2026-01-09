// apps/staff/app/tabs/[id]/quick-order/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ShoppingCart, History, Clock, Search, Filter, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const tempFormatCurrency = (amount: number | string): string => {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(number)) return 'KSh 0';
  return `KSh ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)}`;
};

// Title case helper
const toTitleCase = (str: string): string => {
  return str.toLowerCase().split(' ').map(word => {
    if (!word.trim()) return word;
    if (/^[^a-zA-Z]+$/.test(word)) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  type: 'catalog' | 'custom';
  product_id?: string;
}

interface QuickProduct {
  name: string;
  price: number;
  lastUsed: number;
}

interface BarProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  is_custom: boolean;
}

export default function QuickOrderPage() {
  const router = useRouter();
  const params = useParams();
  const tabId = params.id as string;
  
  const [tab, setTab] = useState<any>(null);
  const [currentName, setCurrentName] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [currentPrice, setCurrentPrice] = useState('');
  const [recentProducts, setRecentProducts] = useState<QuickProduct[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [barProducts, setBarProducts] = useState<BarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadAllData();
  }, [tabId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading data for quick order...');
      
      // Load tab data to get bar_id
      const { data: tabData, error: tabError } = await supabase
        .from('tabs')
        .select('*, bar:bars(name)')
        .eq('id', tabId)
        .single();

      if (tabError) {
        console.error('❌ Error loading tab:', tabError);
        alert('Failed to load tab');
        router.push('/');
        return;
      }

      setTab(tabData);
      console.log('✅ Tab loaded:', tabData);

      // Load bar products for this tab's bar
      if (tabData.bar_id) {
        await loadBarProducts(tabData.bar_id);
      }

      // Load recent products from localStorage
      loadRecentProducts();
      
    } catch (error) {
      console.error('❌ Error in loadAllData:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBarProducts = async (barId: string) => {
    try {
      console.log('🔍 Loading bar products for bar_id:', barId);
      
      const { data: products, error } = await supabase
        .from('bar_products')
        .select('id, name, category, sale_price, description, custom_product_id')
        .eq('bar_id', barId)
        .eq('active', true)
        .order('category, name');

      if (error) {
        console.error('❌ Error loading bar products:', error);
        return;
      }

      console.log(`✅ Loaded ${products?.length || 0} bar products`);

      const formattedProducts: BarProduct[] = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.sale_price,
        description: p.description,
        is_custom: !!p.custom_product_id
      }));

      setBarProducts(formattedProducts);
      
    } catch (error) {
      console.error('❌ Error in loadBarProducts:', error);
    }
  };

  const loadRecentProducts = () => {
    const stored = localStorage.getItem('tabeza_recent_products');
    if (stored) {
      try {
        const products = JSON.parse(stored);
        const sorted = products.sort((a: QuickProduct, b: QuickProduct) => b.lastUsed - a.lastUsed);
        setRecentProducts(sorted.slice(0, 10));
      } catch (e) {
        console.error('Error loading recent products:', e);
      }
    }
  };

  const saveRecentProduct = (name: string, price: number) => {
    const stored = localStorage.getItem('tabeza_recent_products');
    let products: QuickProduct[] = stored ? JSON.parse(stored) : [];
    
    products = products.filter(p => p.name.toLowerCase() !== name.toLowerCase());
    products.unshift({
      name,
      price,
      lastUsed: Date.now()
    });
    
    products = products.slice(0, 20);
    localStorage.setItem('tabeza_recent_products', JSON.stringify(products));
    loadRecentProducts();
  };

  const addItem = () => {
    if (!currentName.trim() || !currentPrice || parseFloat(currentPrice) <= 0) {
      alert('Please enter product name and valid price');
      return;
    }

    const quantity = parseInt(currentQuantity) || 1;
    const price = parseFloat(currentPrice);
    const name = toTitleCase(currentName.trim());

    const newItem: OrderItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      quantity,
      price,
      type: 'custom'
    };

    console.log('➕ Quick order adding item:', newItem);

    // Add to cart in parent window using postMessage
    window.postMessage({
      type: 'ADD_TO_CART',
      item: newItem
    }, '*');
    
    // Save to recent products
    saveRecentProduct(name, price);
    
    // Clear form
    setCurrentName('');
    setCurrentPrice('');
    setCurrentQuantity('1');
    
    // Focus back on name input
    document.getElementById('productName')?.focus();
    
    alert('✅ Item added to cart!');
  };

  const addBarProduct = (product: BarProduct) => {
    const newItem: OrderItem = {
      id: `${Date.now()}_${product.id}`,
      name: product.name,
      quantity: 1,
      price: product.price,
      type: product.is_custom ? 'custom' : 'catalog'
    };

    console.log('➕ Adding bar product to cart:', newItem);

    // Add to cart in parent window using postMessage
    window.postMessage({
      type: 'ADD_TO_CART',
      item: newItem
    }, '*');
    
    // Save to recent products
    saveRecentProduct(product.name, product.price);
    
    alert('✅ Item added to cart!');
  };

  const useRecentProduct = (product: QuickProduct) => {
    const formattedName = toTitleCase(product.name);
    setCurrentName(formattedName);
    setCurrentPrice(product.price.toString());
    setCurrentQuantity('1');
    setShowRecent(false);
    document.getElementById('productName')?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name') {
        document.getElementById('productPrice')?.focus();
      } else if (field === 'price') {
        document.getElementById('productQuantity')?.focus();
      } else if (field === 'quantity') {
        addItem();
      }
    }
  };

  // Filter bar products
  const categories = ['All', ...new Set(barProducts.map(item => item.category))];
  
  let filteredBarProducts = selectedCategory === 'All' 
    ? barProducts 
    : barProducts.filter(item => item.category === selectedCategory);
  
  if (searchQuery.trim()) {
    filteredBarProducts = filteredBarProducts.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-3 text-orange-500 animate-pulse" />
          <p className="text-gray-500">Loading quick order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full lg:max-w-[80%] max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push(`/tabs/${tabId}`)}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold">Quick Order - Browse Menu</h1>
              <p className="text-sm text-blue-100">
                {tab?.bar?.name || 'Bar Menu'} • Tab #{tab?.tab_number}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <p className="text-sm text-white">
              🛒 Browse bar menu items and add them to cart instantly
            </p>
          </div>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          {/* Bar Products Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Bar Menu Items ({filteredBarProducts.length})
              </h2>
              <div className="text-sm text-gray-500">
                {barProducts.length} total products available
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-4">
              <div className="relative mb-3">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bar menu..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredBarProducts.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-2">No menu items found</p>
                <p className="text-sm text-gray-400 mb-4">
                  {barProducts.length === 0 
                    ? 'Visit "Create Order" page to add products to your bar menu first.'
                    : 'Try a different search or category.'
                  }
                </p>
                {barProducts.length === 0 && (
                  <button
                    onClick={() => router.push(`/tabs/${tabId}/add-order`)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Go to Create Order
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBarProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      {product.is_custom && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                    <p className="text-blue-600 font-bold mb-3">{tempFormatCurrency(product.price)}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                    )}
                    <button
                      onClick={() => addBarProduct(product)}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={14} />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Entry Form */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus size={16} />
              Quick Add Custom Item
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Product Name *
                </label>
                <input
                  id="productName"
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'name')}
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="e.g., Special Item"
                  autoComplete="off"
                />
                
                {/* Recent Products Dropdown */}
                {showRecent && recentProducts.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                      <History size={14} className="text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600">Recent Items</span>
                    </div>
                    {recentProducts.map((product, index) => (
                      <button
                        key={index}
                        onClick={() => useRecentProduct(product)}
                        className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">{product.name}</span>
                        <span className="text-xs text-gray-500">{tempFormatCurrency(product.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Price (KSh) *
                  </label>
                  <input
                    id="productPrice"
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'price')}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    id="productQuantity"
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'quantity')}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <button
                onClick={addItem}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push(`/tabs/${tabId}/add-order`)}
              className="bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add New Products
            </button>
            <button
              onClick={() => router.push(`/tabs/${tabId}`)}
              className="bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Return to Tab
            </button>
          </div>
        </div>

        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </div>
  );
}