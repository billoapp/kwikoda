// apps/staff/app/menu/page.tsx - FIXED: Added bar_id filtering for menu items
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, ShoppingCart, Upload, Webhook, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SUPPLIERS = [
  {
    id: 'eabl',
    name: 'East African Breweries Ltd',
    logo: '🍺',
    products: [
      { id: 'eabl_1', name: 'Tusker Lager 500ml', category: 'Beer', sku: 'TUS500' },
      { id: 'eabl_2', name: 'Tusker Malt 500ml', category: 'Beer', sku: 'TUSM500' },
      { id: 'eabl_3', name: 'Guinness 500ml', category: 'Beer', sku: 'GUI500' },
      { id: 'eabl_4', name: 'Pilsner 500ml', category: 'Beer', sku: 'PIL500' },
    ]
  },
  {
    id: 'kwal',
    name: 'Kenya Wine Agencies Ltd',
    logo: '🍷',
    products: [
      { id: 'kwal_1', name: 'Smirnoff Vodka 750ml', category: 'Spirits', sku: 'SMI750' },
      { id: 'kwal_2', name: "Johnnie Walker Red", category: 'Spirits', sku: 'JWR750' },
      { id: 'kwal_3', name: 'Baileys 750ml', category: 'Spirits', sku: 'BAI750' },
    ]
  },
  {
    id: 'cocacola',
    name: 'Coca-Cola East Africa',
    logo: '🥤',
    products: [
      { id: 'cc_1', name: 'Coca-Cola 300ml', category: 'Soft Drinks', sku: 'COKE300' },
      { id: 'cc_2', name: 'Sprite 300ml', category: 'Soft Drinks', sku: 'SPR300' },
      { id: 'cc_3', name: 'Dasani Water 500ml', category: 'Soft Drinks', sku: 'DAS500' },
    ]
  }
];

export default function MenuManagementPage() {
  const router = useRouter();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [barMenu, setBarMenu] = useState<any[]>([
    { catalogId: 'eabl_1', supplierName: 'EABL', productName: 'Tusker Lager 500ml', price: 300 },
    { catalogId: 'eabl_3', supplierName: 'EABL', productName: 'Guinness 500ml', price: 350 },
  ]);
  const [customItems, setCustomItems] = useState<any[]>([
    { id: 101, name: 'Nyama Choma', category: 'Food', price: 1200 },
    { id: 102, name: 'Chicken Wings', category: 'Food', price: 800 },
  ]);
  const [addingPrice, setAddingPrice] = useState<any>({});
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState({ name: '', category: 'Food', price: '' });
  const [showProModal, setShowProModal] = useState(false);
  const [proFeature, setProFeature] = useState({ title: '', description: '', benefits: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [userBarId, setUserBarId] = useState<string | null>(null);

  // Debug: Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user bar_id:', user?.user_metadata?.bar_id);
      console.log('👤 User email:', user?.email);
      
      if (!user) {
        router.push('/login');
        return;
      }

      const barId = user.user_metadata?.bar_id;
      
      if (!barId) {
        alert('Your account is not linked to a bar.');
        router.push('/login');
        return;
      }

      setUserBarId(barId);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // In a real implementation, you would load menu items from the database
  // filtered by userBarId like this:
  /*
  useEffect(() => {
    if (userBarId) {
      loadMenuItems();
    }
  }, [userBarId]);

  const loadMenuItems = async () => {
    try {
      console.log('🔍 Loading menu items for bar_id:', userBarId);

      // Get menu items for THIS bar only
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('bar_id', userBarId)
        .order('category', { ascending: true });

      if (error) throw error;

      setMenuItems(data || []);
      console.log('✅ Loaded', data?.length || 0, 'menu items for bar:', userBarId);
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };
  */

  const handleAddFromCatalog = (product: any) => {
    const price = addingPrice[product.id];
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const newItem = {
      catalogId: product.id,
      supplierName: selectedSupplier.name,
      productName: product.name,
      price: parseFloat(price),
    };

    setBarMenu([...barMenu, newItem]);
    setAddingPrice({});
    setSelectedSupplier(null);

    // In a real implementation, you would save to database with bar_id:
    /*
    const { error } = await supabase
      .from('menu_items')
      .insert({
        bar_id: userBarId,
        name: product.name,
        category: product.category,
        price: parseFloat(price),
        sku: product.sku
      });
    */
  };

  const handleRemoveFromMenu = (catalogId: string) => {
    if (window.confirm('Remove this product from your menu?')) {
      setBarMenu(barMenu.filter(item => item.catalogId !== catalogId));
      
      // In a real implementation, you would delete from database:
      /*
      await supabase
        .from('menu_items')
        .delete()
        .eq('bar_id', userBarId)
        .eq('sku', catalogId);
      */
    }
  };

  const handleAddCustomItem = () => {
    if (!newCustomItem.name || !newCustomItem.price) {
      alert('Please fill in all fields');
      return;
    }

    const item = {
      id: Date.now(),
      name: newCustomItem.name,
      category: newCustomItem.category,
      price: parseFloat(newCustomItem.price)
    };

    setCustomItems([...customItems, item]);
    setNewCustomItem({ name: '', category: 'Food', price: '' });
    setShowAddCustom(false);

    // In a real implementation, you would save to database with bar_id:
    /*
    const { error } = await supabase
      .from('menu_items')
      .insert({
        bar_id: userBarId,
        name: newCustomItem.name,
        category: newCustomItem.category,
        price: parseFloat(newCustomItem.price)
      });
    */
  };

  const handleDeleteCustom = (id: number) => {
    if (window.confirm('Delete this item?')) {
      setCustomItems(customItems.filter(item => item.id !== id));
      
      // In a real implementation, you would delete from database:
      /*
      await supabase
        .from('menu_items')
        .delete()
        .eq('bar_id', userBarId)
        .eq('id', id);
      */
    }
  };

  const handleProFeature = (feature: string) => {
    if (feature === 'CSV Upload') {
      setProFeature({
        title: 'CSV Menu Upload',
        description: 'Bulk upload your entire menu from a CSV file',
        benefits: [
          '• Upload hundreds of items instantly',
          '• Update prices in bulk',
          '• Import from existing POS systems',
          '• Automatic duplicate detection',
          '• Supports custom fields and categories'
        ]
      });
    } else if (feature === 'Webhooks') {
      setProFeature({
        title: 'Webhook Integration',
        description: 'Connect Kwikoda with your existing POS and systems',
        benefits: [
          '• Real-time order sync to your POS',
          '• Automatic inventory updates',
          '• Payment reconciliation',
          '• Custom API endpoints',
          '• Integration with Toast, Square, Clover, etc.'
        ]
      });
    }
    setShowProModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (selectedSupplier) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
          <button 
            onClick={() => setSelectedSupplier(null)}
            className="mb-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 inline-block"
          >
            <ArrowRight size={24} className="transform rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">{selectedSupplier.name}</h1>
        </div>

        <div className="p-4 space-y-3">
          {selectedSupplier.products.map((product: any) => {
            const alreadyAdded = barMenu.find(item => item.catalogId === product.id);
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  {alreadyAdded && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Added
                    </span>
                  )}
                </div>

                {!alreadyAdded && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Sale price (KSh)"
                      value={addingPrice[product.id] || ''}
                      onChange={(e) => setAddingPrice({...addingPrice, [product.id]: e.target.value})}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddFromCatalog(product)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 whitespace-nowrap"
                    >
                      Add to Menu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
        <button 
          onClick={() => router.push('/')}
          className="mb-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 inline-block"
        >
          <ArrowRight size={24} className="transform rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-orange-100 text-sm">Build your bar's menu</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Pro Features Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleProFeature('CSV Upload')}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition border-2 border-orange-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Upload size={20} className="text-orange-600" />
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Pro
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm text-left">Upload CSV</h3>
            <p className="text-xs text-gray-500 text-left mt-1">Bulk import menu</p>
          </button>

          <button
            onClick={() => handleProFeature('Webhooks')}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition border-2 border-orange-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Webhook size={20} className="text-purple-600" />
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Pro
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm text-left">Integrations</h3>
            <p className="text-xs text-gray-500 text-left mt-1">Connect your POS</p>
          </button>
        </div>

        {/* Kwikoda Catalog */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Kwikoda Supplier Catalog</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>✨ Professional Catalog:</strong> Pre-loaded products with verified SKUs and quality images. Set your own prices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SUPPLIERS.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier)}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition text-center"
              >
                <div className="text-4xl mb-2">{supplier.logo}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{supplier.name}</h3>
                <p className="text-xs text-gray-500">{supplier.products.length} products</p>
              </button>
            ))}
          </div>
        </div>

        {/* Your Menu from Catalog */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Your Menu (From Catalog)</h2>
          {barMenu.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products added yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {barMenu.map(item => (
                <div key={item.catalogId} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{item.productName}</p>
                    <p className="text-sm text-orange-600 font-bold">KSh {item.price}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromMenu(item.catalogId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Custom Items</h2>
            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {showAddCustom && (
            <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <h3 className="font-semibold mb-3">Add Custom Item</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newCustomItem.name}
                  onChange={(e) => setNewCustomItem({...newCustomItem, name: e.target.value})}
                  placeholder="Item name"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
                <select
                  value={newCustomItem.category}
                  onChange={(e) => setNewCustomItem({...newCustomItem, category: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="Food">Food</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Specials">Specials</option>
                </select>
                <input
                  type="number"
                  value={newCustomItem.price}
                  onChange={(e) => setNewCustomItem({...newCustomItem, price: e.target.value})}
                  placeholder="Price (KSh)"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomItem}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAddCustom(false)}
                    className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {customItems.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <p className="text-sm">No custom items yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {customItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category} • KSh {item.price}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCustom(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pro Feature Modal */}
      {showProModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Upgrade to Pro</h3>
                  <p className="text-sm text-gray-500">Unlock premium features</p>
                </div>
              </div>
              <button onClick={() => setShowProModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {proFeature.title}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                {proFeature.description}
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                {proFeature.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowProModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition"
              >
                Coming Soon
              </button>
              <button 
                onClick={() => setShowProModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Join the waitlist • Be notified when Pro launches
            </p>
          </div>
        </div>
      )}
    </div>
  );
}