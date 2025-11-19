"""Settings management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Any

from app.deps import auth, get_db, UserCtx
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])


# ============================================
# Account Settings
# ============================================

class AccountUpdate(BaseModel):
    """Account profile update payload."""
    name: str | None = None
    timezone: str | None = None
    avatarUrl: str | None = None


class AccountResponse(BaseModel):
    """Account profile response."""
    id: str
    name: str
    email: str
    timezone: str
    avatarUrl: str | None = None


@router.get("/account", response_model=AccountResponse)
async def get_account(
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> AccountResponse:
    """Get current user account information."""
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return AccountResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        timezone=getattr(user, 'timezone', 'UTC'),
        avatarUrl=getattr(user, 'avatar_url', None),
    )


@router.patch("/account", response_model=AccountResponse)
async def update_account(
    payload: AccountUpdate,
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> AccountResponse:
    """Update account profile."""
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if payload.name is not None:
        user.name = payload.name
    if payload.timezone is not None:
        user.timezone = payload.timezone  # type: ignore
    if payload.avatarUrl is not None:
        user.avatar_url = payload.avatarUrl  # type: ignore
    
    db.commit()
    db.refresh(user)
    
    return AccountResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        timezone=getattr(user, 'timezone', 'UTC'),
        avatarUrl=getattr(user, 'avatar_url', None),
    )


@router.post("/account/delete-request")
async def request_account_deletion(
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Request account deletion (would typically send email or create ticket)."""
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    # In production, this would create a deletion request ticket
    return {"message": f"Deletion request created for {user.email}"}


# ============================================
# Organization Settings
# ============================================

class OrganizationUpdate(BaseModel):
    """Organization update payload."""
    name: str
    primaryDomain: str
    allowedDomains: list[str]


class OrganizationResponse(BaseModel):
    """Organization response."""
    id: str
    name: str
    primaryDomain: str
    allowedDomains: list[str]


@router.get("/org", response_model=OrganizationResponse)
async def get_organization(
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> OrganizationResponse:
    """Get organization information."""
    # Simplified - would query org table in production
    return OrganizationResponse(
        id=current_user.org_id,
        name="Crew-7 Organization",
        primaryDomain="crew7.ai",
        allowedDomains=["crew7.ai", "zyniq.solutions"],
    )


@router.patch("/org", response_model=OrganizationResponse)
async def update_organization(
    payload: OrganizationUpdate,
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> OrganizationResponse:
    """Update organization settings."""
    # Simplified - would update org table in production
    return OrganizationResponse(
        id=current_user.org_id,
        name=payload.name,
        primaryDomain=payload.primaryDomain,
        allowedDomains=payload.allowedDomains,
    )


# ============================================
# Security Settings
# ============================================

class SecurityConfig(BaseModel):
    """Security configuration."""
    totpEnabled: bool = False
    deviceVerificationEnabled: bool = False
    ssoConfigured: bool = False


@router.get("/security", response_model=SecurityConfig)
async def get_security_config(
    current_user: UserCtx = Depends(auth),
) -> SecurityConfig:
    """Get security configuration."""
    return SecurityConfig(
        totpEnabled=False,
        deviceVerificationEnabled=False,
        ssoConfigured=False,
    )


@router.patch("/security", response_model=SecurityConfig)
async def update_security_config(
    payload: SecurityConfig,
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> SecurityConfig:
    """Update security settings."""
    # Simplified - would update security settings in production
    return payload


class SAMLConfig(BaseModel):
    """SAML configuration payload."""
    saml_metadata_xml: str


@router.post("/security/saml")
async def configure_saml(
    payload: SAMLConfig,
    current_user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Upload SAML metadata XML."""
    # In production, would parse and store SAML config
    return {"message": "SAML configuration saved"}


# ============================================
# Integrations
# ============================================

class Integration(BaseModel):
    """Integration configuration."""
    key: str
    name: str
    connected: bool


@router.get("/integrations", response_model=list[Integration])
async def list_integrations(
    current_user: UserCtx = Depends(auth),
) -> list[Integration]:
    """List available integrations."""
    return [
        Integration(key="github", name="GitHub", connected=False),
        Integration(key="slack", name="Slack", connected=False),
        Integration(key="jira", name="Jira", connected=False),
        Integration(key="notion", name="Notion", connected=False),
    ]


class WebhookConfig(BaseModel):
    """Webhook configuration."""
    url: str


@router.patch("/integrations/webhook")
async def update_webhook(
    payload: WebhookConfig,
    current_user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Update alert webhook URL."""
    # In production, would store webhook URL
    return {"message": "Webhook URL updated", "url": payload.url}


# ============================================
# Notifications
# ============================================

class NotificationPreferences(BaseModel):
    """Notification preferences."""
    emailAlerts: bool = True
    smsHandoff: bool = False
    pushNotifications: bool = True
    slackDmMirror: bool = False
    quietHours: dict[str, str] = {"start": "22:00", "end": "06:00"}


@router.get("/notifications", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: UserCtx = Depends(auth),
) -> NotificationPreferences:
    """Get notification preferences."""
    return NotificationPreferences()


@router.patch("/notifications", response_model=NotificationPreferences)
async def update_notification_preferences(
    payload: NotificationPreferences,
    current_user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> NotificationPreferences:
    """Update notification preferences."""
    # In production, would store in user preferences table
    return payload
