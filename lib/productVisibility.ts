import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';

export async function updateProductVisibility(productId: string) {
  try {
    await dbConnect();

    const product = (await Product.findOne({ id: productId }).select('quantity is_in_stock').lean()) as any;

    if (!product) return;

    const shouldBeInStock = product.quantity > 0;

    await Product.updateOne(
      { id: productId },
      { is_in_stock: shouldBeInStock }
    );
  } catch (error) {
    console.error('Error updating product visibility:', error);
  }
}

export async function updateOrderProductsVisibility(orderId: string) {
  try {
    await dbConnect();

    const OrderItem = (await import('@/lib/models/OrderItem')).default;
    const orderItems = (await OrderItem.find({ order_id: orderId }).select('product_id').lean()) as any[];

    for (const item of orderItems) {
      if (item.product_id) {
        await updateProductVisibility(item.product_id);
      }
    }
  } catch (error) {
    console.error('Error updating order products visibility:', error);
  }
}

export async function batchUpdateProductVisibility() {
  try {
    await dbConnect();

    const products = (await Product.find({}).select('id quantity is_in_stock').lean()) as any[];

    let updated = 0;

    for (const product of products) {
      const shouldBeInStock = product.quantity > 0;
      if (shouldBeInStock !== product.is_in_stock) {
        await Product.updateOne(
          { id: product.id },
          { is_in_stock: shouldBeInStock }
        );
        updated++;
      }
    }

    return { updated };
  } catch (error) {
    console.error('Error in batch update:', error);
    return { updated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
