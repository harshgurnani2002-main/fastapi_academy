from typing import List, Union
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_project_service
from src.services.project_service import ProjectService
from src.schemas.common import APIResponse
from src.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectDetailOut

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=APIResponse[ProjectOut], status_code=status.HTTP_201_CREATED, summary="Create Project")
async def create_project(
    payload: ProjectCreate,
    project_service: ProjectService = Depends(get_project_service)
):
    project = await project_service.create_project(payload)
    return APIResponse(message="Project created", data=ProjectOut.model_validate(project))


@router.get("/{project_id}", response_model=APIResponse[Union[ProjectDetailOut, ProjectOut]], summary="Get Project (Eager Loading Tasks)")
async def get_project(
    project_id: int,
    include_tasks: bool = Query(False, description="Eager load child tasks (vectorized selectinload)"),
    project_service: ProjectService = Depends(get_project_service)
):
    project = await project_service.get_project(project_id, eager_tasks=include_tasks)
    if include_tasks:
        return APIResponse(data=ProjectDetailOut.model_validate(project))
    return APIResponse(data=ProjectOut.model_validate(project))


@router.put("/{project_id}", response_model=APIResponse[ProjectOut], summary="Update Project with OCC")
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    project_service: ProjectService = Depends(get_project_service)
):
    updated = await project_service.update_project_with_occ(project_id, payload)
    return APIResponse(message="Project updated with OCC", data=ProjectOut.model_validate(updated))
