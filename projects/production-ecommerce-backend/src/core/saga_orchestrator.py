"""
Saga Pattern Distributed Transaction Orchestrator
=================================================
Coordinates Order -> Payment -> Inventory -> Notification.
If Payment fails, triggers compensating rollback transaction on Order.
"""

from typing import Dict, Any, List


class OrderSagaOrchestrator:
    def __init__(self):
        self.inventory_stock = {"ITEM-MACBOOK": 5}
        self.executed_logs: List[str] = []

    async def execute_order_saga(self, order_id: str, item_sku: str, amount: float, should_fail_payment: bool = False) -> Dict[str, Any]:
        self.executed_logs.clear()
        
        # Step 1: Create Order (Pending)
        self.executed_logs.append("STEP_1: ORDER_PENDING_CREATED")
        
        # Step 2: Reserve Inventory
        if self.inventory_stock.get(item_sku, 0) < 1:
            return {"status": "FAILED", "reason": "OUT_OF_STOCK", "logs": self.executed_logs}
        
        self.inventory_stock[item_sku] -= 1
        self.executed_logs.append("STEP_2: INVENTORY_RESERVED")

        # Step 3: Process Payment (Simulated)
        if should_fail_payment:
            # Compensating Transaction: Rollback Inventory
            self.inventory_stock[item_sku] += 1
            self.executed_logs.append("COMPENSATION: INVENTORY_RESTORED")
            self.executed_logs.append("COMPENSATION: ORDER_CANCELLED")
            return {"status": "ROLLED_BACK", "reason": "PAYMENT_DECLINED", "logs": self.executed_logs}

        self.executed_logs.append("STEP_3: PAYMENT_CHARGED")
        self.executed_logs.append("STEP_4: NOTIFICATION_DISPATCHED")
        return {"status": "COMPLETED", "order_id": order_id, "logs": self.executed_logs}


saga = OrderSagaOrchestrator()
