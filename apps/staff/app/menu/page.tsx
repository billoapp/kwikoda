'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, ShoppingCart } from 'lucide-react';

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
  };

  const handleRemoveFromMenu = (catalogId: string) => {
    if (window.confirm('Remove this product from your menu?')) {
      setBarMenu(barMenu.filter(item => item.catalogId !== catalogId));
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
  };

  const handleDeleteCustom = (id: number) => {
    if (window.confirm('Delete this item?')) {
      setCustomItems(customItems.filter(item => item.id !== id));
    }
  };

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
        {/* Kwik Oda Catalog */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Kwik Oda Supplier Catalog</h2>
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
    </div>
  );
}