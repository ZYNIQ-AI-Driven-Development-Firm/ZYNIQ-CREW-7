"""
Wallet routes - Link and manage user wallets.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from app.deps import get_current_user, get_db
from app.models.user import User
from app.models.crypto import UserWallet, ChainType
from app.core.crypto_config import get_web3_client, get_crypto_config
from app.services.token_service import TokenService

router = APIRouter(prefix="/wallet", tags=["wallet"])
logger = logging.getLogger(__name__)


class WalletLinkRequest(BaseModel):
    """Request to link a wallet."""
    address: str = Field(..., description="Ethereum address (0x...)")
    chain: ChainType = Field(default=ChainType.TEST, description="Blockchain network")
    signature: Optional[str] = Field(None, description="Signed message for verification")
    message: Optional[str] = Field(None, description="Message that was signed")


class WalletResponse(BaseModel):
    """Wallet information response."""
    address: str
    chain: str
    verified: bool
    c7t_balance_offchain: float
    c7t_balance_onchain: float
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/link", response_model=WalletResponse)
async def link_wallet(
    request: WalletLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Link a wallet address to the user's account.
    
    In mock mode, signature verification is skipped.
    In production mode with Web3, verifies the signature.
    """
    config = get_crypto_config()
    web3_client = get_web3_client()
    
    # Validate address format
    if not request.address.startswith("0x") or len(request.address) != 42:
        raise HTTPException(status_code=400, detail="Invalid Ethereum address format")
    
    # Verify signature if not in mock mode
    verified = False
    if not config.mock_mode and request.signature and request.message:
        try:
            verified = web3_client.verify_signature(
                message=request.message,
                signature=request.signature,
                address=request.address
            )
            if not verified:
                raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Signature verification failed")
    elif config.mock_mode:
        # In mock mode, automatically accept
        verified = True
        logger.info(f"Mock mode: auto-accepting wallet {request.address} for user {current_user.id}")
    
    # Check if wallet already exists for this user
    existing_wallet = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id
    ).first()
    
    if existing_wallet:
        # Update existing wallet
        existing_wallet.address = request.address.lower()
        existing_wallet.chain = request.chain
        existing_wallet.verified_at = datetime.utcnow() if verified else None
        existing_wallet.updated_at = datetime.utcnow()
        wallet = existing_wallet
    else:
        # Create new wallet
        wallet = UserWallet(
            user_id=current_user.id,
            address=request.address.lower(),
            chain=request.chain,
            verified_at=datetime.utcnow() if verified else None,
        )
        db.add(wallet)
    
    db.commit()
    db.refresh(wallet)
    
    # Get balances
    token_service = TokenService(db)
    offchain_balance = token_service.get_balance(current_user.id, include_onchain=False)
    onchain_balance = token_service.get_onchain_balance(wallet.address) if not config.mock_mode else 0.0
    
    return WalletResponse(
        address=wallet.address,
        chain=wallet.chain.value,
        verified=wallet.verified_at is not None,
        c7t_balance_offchain=offchain_balance,
        c7t_balance_onchain=onchain_balance,
        created_at=wallet.created_at,
    )


@router.get("", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the linked wallet for the current user."""
    wallet = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet linked")
    
    config = get_crypto_config()
    token_service = TokenService(db)
    
    offchain_balance = token_service.get_balance(current_user.id, include_onchain=False)
    onchain_balance = token_service.get_onchain_balance(wallet.address) if not config.mock_mode else 0.0
    
    return WalletResponse(
        address=wallet.address,
        chain=wallet.chain.value,
        verified=wallet.verified_at is not None,
        c7t_balance_offchain=offchain_balance,
        c7t_balance_onchain=onchain_balance,
        created_at=wallet.created_at,
    )


@router.delete("")
async def unlink_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unlink the wallet from the current user."""
    wallet = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet linked")
    
    db.delete(wallet)
    db.commit()
    
    return {"message": "Wallet unlinked successfully"}


class TestTokensRequest(BaseModel):
    """Request test tokens in mock mode."""
    amount: float = Field(default=1000.0, ge=1, le=10000)


@router.post("/request-test-tokens")
async def request_test_tokens(
    request: TestTokensRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Request test C7T tokens (mock mode only).
    Useful for development and testing.
    """
    config = get_crypto_config()
    
    if not config.mock_mode:
        raise HTTPException(
            status_code=400,
            detail="Test tokens only available in mock mode"
        )
    
    token_service = TokenService(db)
    transaction = token_service.credit(
        user_id=current_user.id,
        amount=request.amount,
        reason="Test tokens request",
        reference_type="test_tokens",
    )
    
    new_balance = token_service.get_balance(current_user.id)
    
    return {
        "message": f"Credited {request.amount} test C7T tokens",
        "new_balance": new_balance,
        "transaction_id": transaction.id,
    }
