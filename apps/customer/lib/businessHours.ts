import { supabase } from './supabase';

// Type definitions
interface Bar {
  id: string;
  name: string;
  business_hours: {
    enabled: boolean;
    type: string;
    simple?: {
      open: string;
      close: string;
    };
  };
}

interface Tab {
  id: string;
  status: string;
  bar_id: string;
  bar: Bar;
}

interface Order {
  total: string;
}

interface Payment {
  amount: string;
}

// Business hours check for TypeScript
export const isWithinBusinessHours = (businessHours: any): boolean => {
  try {
    // If business hours not enabled, always open
    if (!businessHours?.enabled) {
      return true;
    }
    
    // Only handle 'simple' type for MVP
    if (businessHours.type !== 'simple' || !businessHours.simple) {
      return true;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    // Parse open time (format: "HH:MM")
    const [openHour, openMinute] = businessHours.simple.open.split(':').map(Number);
    const openTotalMinutes = openHour * 60 + openMinute;
    
    // Parse close time
    const [closeHour, closeMinute] = businessHours.simple.close.split(':').map(Number);
    const closeTotalMinutes = closeHour * 60 + closeMinute;
    
    // Handle overnight hours (e.g., 20:00 to 04:00)
    if (closeTotalMinutes < openTotalMinutes) {
      // Venue is open overnight: current time >= open OR current time <= close
      return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
    } else {
      // Normal hours: current time between open and close
      return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
    }
  } catch (error) {
    console.error('Error checking business hours:', error);
    return true; // Default to open on error
  }
};

// Check if new tab can be created
export const canCreateNewTab = async (barId: string): Promise<{
  canCreate: boolean;
  message: string;
  openTime?: string;
}> => {
  try {
    const { data: bar, error } = await supabase
      .from('bars')
      .select('name, business_hours')
      .eq('id', barId)
      .single() as { data: Bar | null, error: any };
    
    if (error) throw error;
    
    if (!bar) {
      return {
        canCreate: false,
        message: 'Bar not found'
      };
    }
    
    const isOpen = isWithinBusinessHours(bar.business_hours);
    
    if (!isOpen) {
      const openTime = bar.business_hours?.simple?.open || 'tomorrow';
      return {
        canCreate: false,
        message: `${bar.name} is currently closed`,
        openTime
      };
    }
    
    return {
      canCreate: true,
      message: `${bar.name} is open` 
    };
  } catch (error) {
    console.error('Error checking if can create tab:', error);
    return {
      canCreate: true, // Default to allow on error
      message: 'Available'
    };
  }
};

// Check tab overdue status for customer
export const checkTabOverdueStatus = async (tabId: string): Promise<{
  isOverdue: boolean;
  balance: number;
  message: string;
}> => {
  try {
    // Get tab with bar info
    const { data: tab, error } = await supabase
      .from('tabs')
      .select(`
        *,
        bar:bars(*)
      `)
      .eq('id', tabId)
      .single() as { data: Tab | null, error: any };
    
    if (error) throw error;
    
    if (!tab) {
      return {
        isOverdue: false,
        balance: 0,
        message: 'Tab not found'
      };
    }
    
    // Get tab balance
    const { data: orders } = await supabase
      .from('tab_orders')
      .select('total')
      .eq('tab_id', tabId)
      .eq('status', 'confirmed') as { data: Order[] | null, error: any };
    
    const { data: payments } = await supabase
      .from('tab_payments')
      .select('amount')
      .eq('tab_id', tabId)
      .eq('status', 'success') as { data: Payment[] | null, error: any };
    
    const ordersTotal = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const paymentsTotal = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const balance = ordersTotal - paymentsTotal;
    
    // Check business hours
    const isOpen = isWithinBusinessHours(tab.bar.business_hours);
    
    // Determine if overdue
    const isOverdue = balance > 0 && !isOpen && tab.status === 'open';
    
    return {
      isOverdue,
      balance,
      message: isOverdue 
        ? 'Tab is overdue - venue is closed with outstanding balance'
        : balance > 0 
          ? `Balance: KSh ${balance.toLocaleString()}` 
          : 'Tab is settled'
    };
  } catch (error) {
    console.error('Error checking tab overdue status:', error);
    return {
      isOverdue: false,
      balance: 0,
      message: 'Error checking status'
    };
  }
};
