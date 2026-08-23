from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from src.core.dependencies import get_order_service
from src.services.order_service import OrderEventService
from src.models.order_and_outbox import OrderModel
from src.schemas.common import APIResponse
from src.schemas.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["Order Aggregate & Outbox"])


@router.post("", response_model=APIResponse[OrderOut], status_code=status.HTTP_201_CREATED, summary="Create Order with Atomic Outbox Event")
async def create_order(
    payload: OrderCreate,
    service: OrderEventService = Depends(get_order_service)
):
    order = await service.create_order_with_outbox(payload)
    return APIResponse(
        message="Order created and transactional outbox event recorded",
        data=OrderOut(
            id=order.id,
            order_number=order.order_number,
            customer_email=order.customer_email,
            total_amount=order.total_amount,
            status=order.status
        )
    )


@router.get("/{order_number}", response_model=APIResponse[OrderOut], summary="Get Order by Order Number")
async def get_order(
    order_number: str,
    service: OrderEventService = Depends(get_order_service)
):
    stmt = select(OrderModel).where(OrderModel.order_number == order_number)
    order = (await service.session.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return APIResponse(
        data=OrderOut(
            id=order.id,
            order_number=order.order_number,
            customer_email=order.customer_email,
            total_amount=order.total_amount,
            status=order.status
        )
    )
