/**
 * STAPLE LIMITED — Catalogue API Edge Function (Phase 2)
 * Routes: products, products/:id, categories, baskets, baskets/:id, images/upload
 *
 * Supabase Edge Function entry point (Deno runtime).
 * Handles product listing with location filtering, category browsing,
 * basket detail, and admin product image upload.
 */

import {
  createUserClient,
  createServiceClient,
  getAuthenticatedUserId,
  requireAdmin,
  HttpError,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Path patterns: /catalogue/{resource} or /catalogue/{resource}/{id}
    const resource = pathSegments[pathSegments.length - 2] ?? pathSegments[pathSegments.length - 1];
    const resourceId = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : null;

    // Determine if this is an ID lookup vs a list action
    const isUuid = resourceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId);

    switch (resource) {
      case 'products':
        if (isUuid) return await handleProductDetail(req, resourceId!);
        if (req.method === 'POST') return await handleCreateProduct(req);
        return await handleProductList(req);

      case 'categories':
        return await handleCategoryList(req);

      case 'baskets':
        if (isUuid) return await handleBasketDetail(req, resourceId!);
        if (req.method === 'POST') return await handleCreateBasket(req);
        return await handleBasketList(req);

      case 'images':
        if (resourceId === 'upload') return await handleImageUpload(req);
        throw new HttpError(404, 'Unknown images action');

      default:
        // Check if the last segment itself is 'catalogue' (root listing)
        if (resource === 'catalogue') return await handleProductList(req);
        throw new HttpError(404, `Unknown catalogue resource: ${resource}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * GET /catalogue/products?category_id=&service_area_id=&search=&page=&limit=&is_festive=
 * List products with optional filtering by category, location, and search.
 */
async function handleProductList(req: Request): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const url = new URL(req.url);
  const categoryId = url.searchParams.get('category_id') || undefined;
  const serviceAreaId = url.searchParams.get('service_area_id') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const isFestive = url.searchParams.get('is_festive');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase.rpc('get_products_for_area', {
    p_service_area_id: serviceAreaId ?? null,
    p_category_id: categoryId ?? null,
    p_search: search ?? null,
    p_is_festive: isFestive !== null ? isFestive === 'true' : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Product list error:', error);
    throw new HttpError(500, 'Failed to fetch products');
  }

  const total = rows?.[0]?.total_count ?? 0;

  // Fetch images for all returned products in one query
  const productIds = (rows ?? []).map((r: any) => r.id);
  let imagesMap: Record<string, any[]> = {};

  if (productIds.length > 0) {
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order');

    if (images) {
      for (const img of images) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
        imagesMap[img.product_id].push(img);
      }
    }
  }

  const products = (rows ?? []).map((p: any) => ({
    ...p,
    images: imagesMap[p.id] ?? [],
    primary_image_url: p.primary_image_url ?? (imagesMap[p.id]?.[0]?.image_url ?? null),
  }));

  return jsonResponse({
    products,
    total: Number(total),
    page,
    limit,
    has_more: offset + products.length < Number(total),
  });
}

/**
 * GET /catalogue/products/:id
 * Get a single product with images and location availability.
 */
async function handleProductDetail(req: Request, productId: string): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const supabase = createServiceClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories!inner(name, slug),
      images:product_images(*)
    `)
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (error || !product) {
    throw new HttpError(404, 'Product not found');
  }

  // Fetch location availability rules
  const { data: rules } = await supabase
    .from('product_location_rules')
    .select(`
      *,
      country:countries(name),
      state:states_regions(name),
      service_area:service_areas(name)
    `)
    .eq('product_id', productId);

  const locationAvailability = (rules ?? []).map((rule: any) => ({
    country_name: rule.country?.name ?? 'All countries',
    state_name: rule.state?.name ?? null,
    service_area_name: rule.service_area?.name ?? null,
    is_available: rule.is_available,
  }));

  const primaryImage = product.images?.find((img: any) => img.is_primary);

  return jsonResponse({
    product: {
      ...product,
      category_name: product.category?.name,
      primary_image_url: primaryImage?.image_url ?? product.images?.[0]?.image_url ?? null,
    },
    location_availability: locationAvailability,
  });
}

/**
 * GET /catalogue/categories
 * List all active product categories.
 */
async function handleCategoryList(req: Request): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const supabase = createServiceClient();

  const { data: categories, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw new HttpError(500, 'Failed to fetch categories');

  return jsonResponse({ categories: categories ?? [] });
}

/**
 * GET /catalogue/baskets?service_area_id=&is_festive=&search=&page=&limit=
 * List baskets with optional filtering.
 */
async function handleBasketList(req: Request): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const url = new URL(req.url);
  const isFestive = url.searchParams.get('is_festive');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from('baskets')
    .select(`
      *,
      items:basket_items(
        *,
        product:products(*)
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(offset, offset + limit - 1);

  if (isFestive !== null) {
    query = query.eq('is_festive', isFestive === 'true');
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: baskets, error, count } = await query;
  if (error) throw new HttpError(500, 'Failed to fetch baskets');

  const enriched = (baskets ?? []).map((b: any) => ({
    ...b,
    primary_image_url: b.image_url ?? null,
  }));

  return jsonResponse({
    baskets: enriched,
    total: count ?? 0,
    page,
    limit,
    has_more: offset + enriched.length < (count ?? 0),
  });
}

/**
 * GET /catalogue/baskets/:id
 * Get a single basket with its items and product details.
 */
async function handleBasketDetail(req: Request, basketId: string): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const supabase = createServiceClient();

  const { data: basket, error } = await supabase
    .from('baskets')
    .select(`
      *,
      items:basket_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', basketId)
    .eq('is_active', true)
    .single();

  if (error || !basket) {
    throw new HttpError(404, 'Basket not found');
  }

  return jsonResponse({
    basket: {
      ...basket,
      primary_image_url: basket.image_url ?? null,
    },
  });
}

/**
 * POST /catalogue/products (Admin only)
 * Create a new product.
 */
async function handleCreateProduct(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  await requireAdmin(supabase);

  const body = await req.json();
  const {
    category_id, name, slug, description, unit,
    weight_value, weight_unit, base_price,
    min_group_buy_target, max_group_buy_target,
    max_units_per_user = 10, minimum_fulfilment_quantity,
    is_active = true, is_festive = false, metadata = {},
  } = body;

  if (!category_id || !name || !unit || !base_price || !min_group_buy_target || !minimum_fulfilment_quantity) {
    throw new HttpError(400, 'Missing required fields: category_id, name, unit, base_price, min_group_buy_target, minimum_fulfilment_quantity');
  }

  const productSlug = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const serviceClient = createServiceClient();
  const { data: product, error } = await serviceClient
    .from('products')
    .insert({
      category_id, name, slug: productSlug, description, unit,
      weight_value, weight_unit, base_price, currency_code: 'NGN',
      min_group_buy_target, max_group_buy_target, max_units_per_user,
      minimum_fulfilment_quantity, is_active, is_festive, metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') throw new HttpError(409, 'Product slug already exists');
    throw new HttpError(500, 'Failed to create product');
  }

  return jsonResponse(product, 201);
}

/**
 * POST /catalogue/baskets (Admin only)
 * Create a new basket with items.
 */
async function handleCreateBasket(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  await requireAdmin(supabase);

  const body = await req.json();
  const {
    name, slug, description, image_url, total_price,
    max_units_per_user = 10, minimum_fulfilment_quantity,
    is_active = true, is_festive = false, festive_category,
    items = [],
  } = body;

  if (!name || !total_price || !minimum_fulfilment_quantity) {
    throw new HttpError(400, 'Missing required fields: name, total_price, minimum_fulfilment_quantity');
  }

  const basketSlug = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const serviceClient = createServiceClient();

  // Insert basket
  const { data: basket, error: basketError } = await serviceClient
    .from('baskets')
    .insert({
      name, slug: basketSlug, description, image_url, total_price,
      currency_code: 'NGN', max_units_per_user, minimum_fulfilment_quantity,
      is_active, is_festive, festive_category, metadata: {},
    })
    .select()
    .single();

  if (basketError) {
    console.error('Create basket error:', basketError);
    if (basketError.code === '23505') throw new HttpError(409, 'Basket slug already exists');
    throw new HttpError(500, 'Failed to create basket');
  }

  // Insert basket items
  if (items.length > 0) {
    const basketItems = items.map((item: any, index: number) => ({
      basket_id: basket.id,
      product_id: item.product_id,
      quantity: item.quantity ?? 1,
      sort_order: index,
    }));

    const { error: itemsError } = await serviceClient
      .from('basket_items')
      .insert(basketItems);

    if (itemsError) {
      console.error('Create basket items error:', itemsError);
      // Rollback basket
      await serviceClient.from('baskets').delete().eq('id', basket.id);
      throw new HttpError(500, 'Failed to create basket items');
    }
  }

  return jsonResponse(basket, 201);
}

/**
 * POST /catalogue/images/upload (Admin only)
 * Upload a product image to Supabase Storage.
 * Expects multipart/form-data with fields: file, product_id, alt_text, is_primary
 */
async function handleImageUpload(req: Request): Promise<Response> {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const supabase = createUserClient(req);
  await requireAdmin(supabase);

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const productId = formData.get('product_id') as string;
  const altText = formData.get('alt_text') as string | null;
  const isPrimary = formData.get('is_primary') === 'true';

  if (!file || !productId) {
    throw new HttpError(400, 'file and product_id are required');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new HttpError(400, `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new HttpError(400, 'File too large. Maximum 5MB.');
  }

  const serviceClient = createServiceClient();

  // Verify product exists
  const { data: product } = await serviceClient
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();

  if (!product) throw new HttpError(404, 'Product not found');

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filePath = `products/${productId}/${crypto.randomUUID()}.${ext}`;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await serviceClient.storage
    .from('product-images')
    .upload(filePath, fileBytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new HttpError(500, 'Failed to upload image');
  }

  // Get public URL
  const { data: urlData } = serviceClient.storage
    .from('product-images')
    .getPublicUrl(filePath);

  // If setting as primary, unset existing primaries
  if (isPrimary) {
    await serviceClient
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('is_primary', true);
  }

  // Get current max sort_order
  const { data: existingImages } = await serviceClient
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1;

  // Insert image record
  const { data: imageRecord, error: insertError } = await serviceClient
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: urlData.publicUrl,
      alt_text: altText,
      sort_order: nextSortOrder,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Image record insert error:', insertError);
    throw new HttpError(500, 'Image uploaded but record creation failed');
  }

  return jsonResponse({ image: imageRecord }, 201);
}
