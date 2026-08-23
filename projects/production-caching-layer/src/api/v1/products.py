from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_caching_service
from src.services.caching_service import CachingService
from src.core.exceptions import NotFoundException
from src.schemas.common import APIResponse
from src.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["High-Throughput Cached Products"])


@router.post("", response_model=APIResponse[ProductOut], status_code=status.HTTP_201_CREATED, summary="Create Product")
async def create_product(
    payload: ProductCreate,
    caching_service: CachingService = Depends(get_caching_service)
):
    product = await caching_service.product_repo.create(
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock_quantity=payload.stock_quantity,
        category=payload.category
    )
    # Eagerly warm L1 + L2
    p_dict = {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock_quantity": product.stock_quantity,
        "category": product.category
    }
    caching_service.l1.set(f"product:{product.id}", p_dict, ttl_seconds=60)
    await caching_service.l2.set(f"product:{product.id}", p_dict, ttl_seconds=300)

    return APIResponse(message="Product created", data=ProductOut.model_validate(product))


@router.get("/{product_id}", response_model=APIResponse[ProductOut], summary="Get Product (L1/L2 Cached)")
async def get_product(
    product_id: int,
    caching_service: CachingService = Depends(get_caching_service)
):
    data, source, latency_ms = await caching_service.get_product(product_id)
    if not data:
        raise NotFoundException("Product", product_id)

    out = ProductOut(**data)
    out.cache_source = source
    out.latency_ms = latency_ms
    return APIResponse(data=out)


@router.put("/{product_id}", response_model=APIResponse[ProductOut], summary="Update Product & Invalidate Cache")
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    caching_service: CachingService = Depends(get_caching_service)
):
    product = await caching_service.product_repo.get_by_id(product_id)
    if not product:
        raise NotFoundException("Product", product_id)

    if payload.name is not None:
        product.name = payload.name
    if payload.price is not None:
        product.price = payload.price
    if payload.stock_quantity is not None:
        product.stock_quantity = payload.stock_quantity
    if payload.category is not None:
        product.category = payload.category

    await caching_service.session.flush()

    # Invalidate both L1 and L2 caches immediately
    await caching_service.invalidate_product(product_id)

    return APIResponse(message="Product updated and cache invalidated", data=ProductOut.model_validate(product))


@router.delete("/{product_id}", response_model=APIResponse[dict], summary="Delete Product & Purge Cache")
async def delete_product(
    product_id: int,
    caching_service: CachingService = Depends(get_caching_service)
):
    product = await caching_service.product_repo.get_by_id(product_id)
    if not product:
        raise NotFoundException("Product", product_id)

    await caching_service.session.delete(product)
    await caching_service.session.flush()
    await caching_service.invalidate_product(product_id)

    return APIResponse(message="Product deleted and purged from cache", data={"deleted_id": product_id})
