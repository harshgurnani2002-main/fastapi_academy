import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.uow import UnitOfWork
from src.models.organization import OrgTier


@pytest.mark.asyncio
async def test_uow_atomic_rollback(db_session: AsyncSession):
    uow = UnitOfWork(db_session)
    
    # 1. Create org in UoW
    org = await uow.organizations.create(
        name="Transaction Test Org",
        slug="tx-test",
        tier=OrgTier.PRO,
        settings_json={}
    )
    assert org.id is not None

    # 2. Simulate failure & rollback
    await uow.rollback()

    # 3. Verify org does not exist in DB after rollback
    check_org = await uow.organizations.get_by_slug("tx-test")
    assert check_org is None


@pytest.mark.asyncio
async def test_uow_savepoint_partial_rollback(db_session: AsyncSession):
    uow = UnitOfWork(db_session)

    # 1. Create base org
    org = await uow.organizations.create(
        name="Savepoint Org",
        slug="savepoint-org",
        tier=OrgTier.ENTERPRISE,
        settings_json={}
    )
    assert org.id is not None

    # 2. Inside a savepoint, attempt an invalid operation
    try:
        async with uow.savepoint():
            # Attempt to create duplicate org in savepoint
            await uow.organizations.create(
                name="Duplicate Org",
                slug="savepoint-org",
                tier=OrgTier.FREE,
                settings_json={}
            )
    except Exception:
        pass  # Savepoint caught and rolled back internal block

    # 3. Base org should still be valid and commit cleanly
    await uow.commit()
    persisted_org = await uow.organizations.get_by_slug("savepoint-org")
    assert persisted_org is not None
