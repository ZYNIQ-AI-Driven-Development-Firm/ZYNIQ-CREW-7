"""
Token Service - Manages C7T token balances and transactions.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import logging

from app.models.crypto import (
    TokenBalance,
    TokenTransaction,
    TransactionDirection,
)
from app.core.crypto_config import get_web3_client, get_crypto_config

logger = logging.getLogger(__name__)


class InsufficientBalanceError(Exception):
    """Raised when user doesn't have enough tokens."""
    pass


class TokenService:
    """Service for managing token balances and transactions."""
    
    def __init__(self, db: Session):
        self.db = db
        self.web3_client = get_web3_client()
        self.config = get_crypto_config()
    
    def get_balance(
        self,
        user_id: str,
        token_symbol: str = "C7T",
        include_onchain: bool = True
    ) -> float:
        """
        Get user's token balance.
        
        Args:
            user_id: User ID
            token_symbol: Token symbol (default C7T)
            include_onchain: If True and not in mock mode, fetch on-chain balance too
        
        Returns:
            Total balance (off-chain + on-chain if available)
        """
        # Get off-chain balance
        balance_record = self.db.query(TokenBalance).filter(
            and_(
                TokenBalance.user_id == user_id,
                TokenBalance.token_symbol == token_symbol
            )
        ).first()
        
        offchain_balance = balance_record.balance if balance_record else 0.0
        
        # If in mock mode or not checking on-chain, return off-chain only
        if self.config.mock_mode or not include_onchain:
            return float(offchain_balance)
        
        # Try to get on-chain balance
        try:
            from app.models.crypto import UserWallet
            wallet = self.db.query(UserWallet).filter(
                UserWallet.user_id == user_id
            ).first()
            
            if wallet:
                onchain_balance = self.web3_client.get_balance(wallet.address)
                # Convert from wei to tokens (assuming 18 decimals)
                onchain_balance_tokens = onchain_balance / (10 ** 18)
                return float(offchain_balance) + onchain_balance_tokens
        except Exception as e:
            logger.warning(f"Failed to get on-chain balance: {e}")
        
        return float(offchain_balance)
    
    def credit(
        self,
        user_id: str,
        amount: float,
        reason: str,
        token_symbol: str = "C7T",
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
    ) -> TokenTransaction:
        """
        Credit tokens to user's account.
        
        Args:
            user_id: User ID
            amount: Amount to credit
            reason: Reason for credit
            token_symbol: Token symbol
            reference_id: Optional reference to related entity
            reference_type: Type of reference (rental, purchase, etc.)
        
        Returns:
            Created transaction record
        """
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        
        # Get or create balance record
        balance_record = self.db.query(TokenBalance).filter(
            and_(
                TokenBalance.user_id == user_id,
                TokenBalance.token_symbol == token_symbol
            )
        ).first()
        
        if not balance_record:
            balance_record = TokenBalance(
                user_id=user_id,
                token_symbol=token_symbol,
                balance=0.0
            )
            self.db.add(balance_record)
            self.db.flush()
        
        # Update balance
        new_balance = float(balance_record.balance) + amount
        balance_record.balance = new_balance
        balance_record.updated_at = datetime.utcnow()
        
        # Create transaction record
        transaction = TokenTransaction(
            user_id=user_id,
            token_symbol=token_symbol,
            amount=amount,
            direction=TransactionDirection.CREDIT,
            reason=reason,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        
        self.db.add(transaction)
        self.db.commit()
        
        logger.info(f"Credited {amount} {token_symbol} to user {user_id}: {reason}")
        return transaction
    
    def debit(
        self,
        user_id: str,
        amount: float,
        reason: str,
        token_symbol: str = "C7T",
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
    ) -> TokenTransaction:
        """
        Debit tokens from user's account.
        
        Args:
            user_id: User ID
            amount: Amount to debit
            reason: Reason for debit
            token_symbol: Token symbol
            reference_id: Optional reference to related entity
            reference_type: Type of reference (rental, purchase, etc.)
        
        Returns:
            Created transaction record
        
        Raises:
            InsufficientBalanceError: If user doesn't have enough balance
        """
        if amount <= 0:
            raise ValueError("Debit amount must be positive")
        
        # Get balance record
        balance_record = self.db.query(TokenBalance).filter(
            and_(
                TokenBalance.user_id == user_id,
                TokenBalance.token_symbol == token_symbol
            )
        ).first()
        
        current_balance = float(balance_record.balance) if balance_record else 0.0
        
        # Check sufficient balance
        if current_balance < amount:
            raise InsufficientBalanceError(
                f"Insufficient balance: have {current_balance} {token_symbol}, need {amount}"
            )
        
        # Update balance
        new_balance = current_balance - amount
        balance_record.balance = new_balance
        balance_record.updated_at = datetime.utcnow()
        
        # Create transaction record
        transaction = TokenTransaction(
            user_id=user_id,
            token_symbol=token_symbol,
            amount=amount,
            direction=TransactionDirection.DEBIT,
            reason=reason,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        
        self.db.add(transaction)
        self.db.commit()
        
        logger.info(f"Debited {amount} {token_symbol} from user {user_id}: {reason}")
        return transaction
    
    def get_transaction_history(
        self,
        user_id: str,
        token_symbol: str = "C7T",
        limit: int = 50,
        offset: int = 0
    ) -> List[TokenTransaction]:
        """Get user's transaction history."""
        return (
            self.db.query(TokenTransaction)
            .filter(
                and_(
                    TokenTransaction.user_id == user_id,
                    TokenTransaction.token_symbol == token_symbol
                )
            )
            .order_by(TokenTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
    
    def get_onchain_balance(self, address: str) -> float:
        """
        Get on-chain token balance for an address.
        
        Args:
            address: Wallet address
        
        Returns:
            Balance in tokens (not wei)
        """
        if self.config.mock_mode:
            return 0.0
        
        try:
            balance_wei = self.web3_client.get_balance(address)
            return balance_wei / (10 ** 18)
        except Exception as e:
            logger.error(f"Failed to get on-chain balance: {e}")
            return 0.0
