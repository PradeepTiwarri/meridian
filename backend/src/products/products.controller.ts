import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ProductsService } from './products.service';

// =============================================================================
// Meridian Backend — Products Controller
// =============================================================================

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * Returns all products from the catalog.
   */
  @Get()
  async findAll() {
    this.logger.log('GET /products');
    const products = await this.productsService.findAll();
    return {
      status: 'success',
      count: products.length,
      data: products,
    };
  }

  /**
   * GET /products/:id
   * Returns a single product by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /products/${id}`);
    const product = await this.productsService.findOne(id);

    if (!product) {
      return {
        status: 'error',
        message: `Product ${id} not found`,
      };
    }

    return {
      status: 'success',
      data: product,
    };
  }
}
