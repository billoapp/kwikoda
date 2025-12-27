// apps/customer/lib/database.types.ts
export type Database = {
  public: {
    Tables: {
      tab_orders: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          status: 'pending' | 'completed' | 'cancelled';
          total_amount: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          status?: 'pending' | 'completed' | 'cancelled';
          total_amount: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          status?: 'pending' | 'completed' | 'cancelled';
          total_amount?: number;
        };
      };
      // Add other tables as needed
    };
  };
};