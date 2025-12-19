'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, Menu, X, Search, ArrowRight, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

export default function TabsPage() {
  const router = useRouter();
  const { user, bar, loading: authLoading, signOut } = useAuth();
  
  const [tabs, setTabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bar) {
      loadTabs();
      const interval = setInterval(loadTabs, 10000);
      return () => clearInterval(interval);
    }
  }, [bar]);

  const loadTabs = async () => {
    if (!bar) return;
    
    try {
      const { data: tabsData, error } = await supabase
        .from('tabs')
        .select(`
          *,
          bar:bars(name),
          orders:tab_orders(id, total, status, created_at),
          payments:tab_payments(id, amount, status, created_at)
        `)
        .eq('bar_id', bar.id)
        .order('tab_number', { ascending: false });

      if (error) throw error;

      console.log('✅ Tabs loaded:', tabsData);
      setTabs(tabsData || []);
    } catch (error) {
      console.error('Error loading tabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (tab: any) => {
    if (tab.notes) {
      try {
        const notes = JSON.parse(tab.notes);
        return notes.display_name || `Tab ${tab.tab_number || 'Unknown'}`;
      } catch (e) {
        return `Tab ${tab.tab_number || 'Unknown'}`;
      }
    }
    return `Tab ${tab.tab_number || 'Unknown'}`;
  };

  const getTabBalance = (tab: any) => {
    const ordersTotal = tab.orders?.reduce((sum: number, order: any) => 
      sum + parseFloat(order.total), 0) || 0;
    const paymentsTotal = tab.payments?.filter((p: any) => p.status === 'success')
      .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0) || 0;
    return ordersTotal - paymentsTotal;
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredTabs = tabs.filter(tab => {
    const displayName = getDisplayName(tab);
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tab.tab_number?.toString().includes(searchQuery) || 
                         tab.owner_identifier?.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || tab.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalTabs: tabs.filter(t => t.status === 'open').length,
    totalRevenue: tabs.reduce((sum, tab) => 
      sum + (tab.orders?.reduce((s: number, o: any) => s + parseFloat(o.total), 0) || 0), 0),
    pendingOrders: tabs.reduce((sum, tab) => 
      sum + (tab.orders?.filter((o: any) => o.status === 'pending').length || 0), 0),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto mb-3 text-orange-500 animate-spin" />
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto mb-3 text-orange-500 animate-spin" />
          <p className="text-gray-500">Loading tabs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{bar?.name || 'Bar'} Staff</h1>
            <p className="text-orange-100 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={loadTabs}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
            >
              <RefreshCw size={24} />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
            >
              {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-orange-100" />
              <span className="text-sm text-orange-100">Open Tabs</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalTabs}</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-orange-100" />
              <span className="text-sm text-orange-100">Pending Orders</span>
            </div>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
        </div>
      </div>

      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMenu(false)} className="mb-6">
              <X size={24} />
            </button>
            <nav className="space-y-4">
              <button onClick={() => { router.push('/'); setShowMenu(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium">
                <Users size={20} />
                Active Tabs
              </button>
              <button onClick={() => { router.push('/reports'); setShowMenu(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium">
                <DollarSign size={20} />
                Reports & Export
              </button>
              <button onClick={() => { router.push('/menu'); setShowMenu(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium">
                <Menu size={20} />
                Menu Management
              </button>
              <button onClick={() => { router.push('/settings'); setShowMenu(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium">
                <Menu size={20} />
                Settings
              </button>
              <hr className="my-4" />
              <button onClick={signOut} className="flex items-center gap-3 w-full text-left py-2 font-medium text-red-600">
                <LogOut size={20} />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-b sticky top-0 z-10">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tab name or number..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {['all', 'open', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filterStatus === status 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {filteredTabs.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No tabs found</p>
          </div>
        ) : (
          filteredTabs.map(tab => {
            const balance = getTabBalance(tab);
            const hasPendingOrders = tab.orders?.some((o: any) => o.status === 'pending');
            
            return (
              <div 
                key={tab.id} 
                onClick={() => router.push(`/tabs/${tab.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">{getDisplayName(tab)}</h3>
                      {hasPendingOrders && (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                          <AlertCircle size={12} />
                          NEW ORDER!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{tab.owner_identifier || 'Guest'}</p>
                    <p className="text-xs text-gray-400 mt-1">Opened {timeAgo(tab.opened_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      KSh {balance.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">Balance</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{tab.orders?.length || 0} orders</span>
                    <span>•</span>
                    <span className="text-yellow-600 font-medium">
                      {tab.orders?.filter((o: any) => o.status === 'pending').length || 0} pending
                    </span>
                  </div>
                  <ArrowRight size={20} className="text-gray-400" />
                </div>
              </div>
            );
          })
        )}
      </div>

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
  );
}