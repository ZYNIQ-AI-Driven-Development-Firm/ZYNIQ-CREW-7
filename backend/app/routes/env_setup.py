"""Environment setup routes for first-time user onboarding."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.deps import auth, get_db
from app.models.user import User
from app.models.crew import Crew

router = APIRouter(prefix="/env", tags=["environment"])


class DefaultEnvResponse(BaseModel):
    """Response from default environment setup."""
    success: bool
    message: str
    collection_id: str | None = None
    workspace_id: str | None = None
    crew_id: str | None = None
    project_id: str | None = None


@router.post("/default-setup", response_model=DefaultEnvResponse)
async def setup_default_environment(
    current_user: User = Depends(auth),
    db: Session = Depends(get_db),
) -> DefaultEnvResponse:
    """
    Create default environment for first-time users:
    - Collection: Crew-7
    - Workspace: Crew-7 Commander Board
    - Crew: Atlas
    - Project: Project-X
    """
    
    # Check if user already has environment set up
    if hasattr(current_user, 'env_initialized') and current_user.env_initialized:
        return DefaultEnvResponse(
            success=False,
            message="Environment already initialized"
        )
    
    try:
        # Create default crew (simplified - would normally create full structure)
        default_crew = db.query(Crew).filter(
            Crew.name == "Atlas",
            Crew.org_id == current_user.org_id
        ).first()
        
        if not default_crew:
            # Create minimal default crew
            default_crew = Crew(
                name="Atlas",
                org_id=current_user.org_id,
                description="Your default AI crew for mission orchestration",
                recipe_json={"crew_type": "standard", "version": "1.0"},
                created_by=str(current_user.id)
            )
            db.add(default_crew)
        
        # Mark user environment as initialized
        current_user.env_initialized = True  # type: ignore
        db.commit()
        db.refresh(default_crew)
        
        return DefaultEnvResponse(
            success=True,
            message="Default environment created successfully",
            collection_id="crew-7-collection",
            workspace_id="crew-7-commander-board",
            crew_id=str(default_crew.id),
            project_id="project-x"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to setup environment: {str(e)}")


@router.get("/status")
async def get_environment_status(
    current_user: User = Depends(auth),
) -> dict[str, bool]:
    """Check if user has initialized their environment."""
    return {
        "env_initialized": getattr(current_user, 'env_initialized', False)
    }
