import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

// =============================================================================
// Meridian Backend — Products Service
// =============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  base_price: number;  // stored in cents
  category: string;
  tier: string;
  created_at: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Fetch all products from the Supabase `products` table.
   * Returns products ordered by created_at ascending.
   */
  async findAll(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    this.logger.log(`📦 Fetched ${data?.length ?? 0} products`);
    return (data as Product[]) ?? [];
  }

  /**
   * Fetch a single product by its ID.
   */
  async findOne(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error(`Failed to fetch product ${id}: ${error.message}`);
      return null;
    }

    return data as Product;
  }
}
