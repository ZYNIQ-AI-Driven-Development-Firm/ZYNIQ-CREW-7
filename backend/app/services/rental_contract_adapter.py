"""
Rental Contract Adapter - Interface to on-chain rental contracts.
Provides mock implementation and future hooks for smart contracts.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.core.crypto_config import get_crypto_config, get_web3_client
from app.models.crypto import CrewRental

logger = logging.getLogger(__name__)


class RentalAgreement:
    """Rental agreement data structure."""
    
    def __init__(
        self,
        agreement_id: int,
        crew_id: str,
        renter_address: str,
        owner_address: str,
        price_c7t: float,
        start_time: datetime,
        end_time: Optional[datetime],
        status: str,
        tx_hash: Optional[str] = None,
    ):
        self.agreement_id = agreement_id
        self.crew_id = crew_id
        self.renter_address = renter_address
        self.owner_address = owner_address
        self.price_c7t = price_c7t
        self.start_time = start_time
        self.end_time = end_time
        self.status = status
        self.tx_hash = tx_hash


class RentalContractAdapter:
    """
    Adapter for rental contract operations.
    
    In mock mode: Uses database-backed rental agreements.
    In production mode: Ready to integrate with smart contracts.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.config = get_crypto_config()
        self.web3_client = get_web3_client()
    
    def create_rental_agreement(
        self,
        crew_id: str,
        renter_address: str,
        owner_address: str,
        duration_hours: Optional[int],
        price_c7t: float,
    ) -> RentalAgreement:
        """
        Create a new rental agreement.
        
        Args:
            crew_id: Crew UUID
            renter_address: Renter's wallet address
            owner_address: Owner's wallet address
            duration_hours: Rental duration (None = unlimited)
            price_c7t: Rental price in C7T tokens
        
        Returns:
            RentalAgreement object
        """
        if self.config.mock_mode:
            return self._create_rental_mock(
                crew_id, renter_address, owner_address, duration_hours, price_c7t
            )
        else:
            return self._create_rental_onchain(
                crew_id, renter_address, owner_address, duration_hours, price_c7t
            )
    
    def complete_rental(self, agreement_id: int) -> bool:
        """
        Complete/close a rental agreement.
        
        Args:
            agreement_id: Rental agreement ID
        
        Returns:
            True if successful
        """
        if self.config.mock_mode:
            return self._complete_rental_mock(agreement_id)
        else:
            return self._complete_rental_onchain(agreement_id)
    
    def cancel_rental(self, agreement_id: int) -> bool:
        """
        Cancel an active rental agreement.
        
        Args:
            agreement_id: Rental agreement ID
        
        Returns:
            True if successful
        """
        if self.config.mock_mode:
            return self._cancel_rental_mock(agreement_id)
        else:
            return self._cancel_rental_onchain(agreement_id)
    
    def get_rental_status(self, agreement_id: int) -> Optional[RentalAgreement]:
        """
        Get status of a rental agreement.
        
        Args:
            agreement_id: Rental agreement ID
        
        Returns:
            RentalAgreement object or None if not found
        """
        rental = self.db.query(CrewRental).filter(
            CrewRental.id == agreement_id
        ).first()
        
        if not rental:
            return None
        
        return RentalAgreement(
            agreement_id=rental.id,
            crew_id=str(rental.crew_id),
            renter_address="",  # Would fetch from user wallet in real impl
            owner_address="",
            price_c7t=rental.price_c7t,
            start_time=rental.start_time,
            end_time=rental.end_time,
            status=rental.status,
            tx_hash=rental.tx_reference,
        )
    
    def get_active_rentals_for_crew(self, crew_id: str) -> list[RentalAgreement]:
        """Get all active rentals for a crew."""
        rentals = self.db.query(CrewRental).filter(
            CrewRental.crew_id == crew_id,
            CrewRental.status == "active"
        ).all()
        
        return [
            RentalAgreement(
                agreement_id=r.id,
                crew_id=str(r.crew_id),
                renter_address="",
                owner_address="",
                price_c7t=r.price_c7t,
                start_time=r.start_time,
                end_time=r.end_time,
                status=r.status,
                tx_hash=r.tx_reference,
            )
            for r in rentals
        ]
    
    # ========== MOCK MODE IMPLEMENTATIONS ==========
    
    def _create_rental_mock(
        self,
        crew_id: str,
        renter_address: str,
        owner_address: str,
        duration_hours: Optional[int],
        price_c7t: float,
    ) -> RentalAgreement:
        """Create rental agreement in database (mock mode)."""
        start_time = datetime.utcnow()
        end_time = None
        if duration_hours:
            end_time = start_time + timedelta(hours=duration_hours)
        
        # This would typically be called from the marketplace route
        # which already creates the rental record
        # This is here for completeness
        
        logger.info(
            f"Mock: Created rental agreement for crew {crew_id}, "
            f"price {price_c7t} C7T, duration {duration_hours}h"
        )
        
        return RentalAgreement(
            agreement_id=0,  # Placeholder, actual ID set by DB
            crew_id=crew_id,
            renter_address=renter_address,
            owner_address=owner_address,
            price_c7t=price_c7t,
            start_time=start_time,
            end_time=end_time,
            status="active",
            tx_hash="mock_tx_" + crew_id[:8],
        )
    
    def _complete_rental_mock(self, agreement_id: int) -> bool:
        """Complete rental in database (mock mode)."""
        rental = self.db.query(CrewRental).filter(
            CrewRental.id == agreement_id
        ).first()
        
        if not rental:
            return False
        
        rental.status = "completed"
        rental.end_time = datetime.utcnow()
        rental.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Mock: Completed rental agreement {agreement_id}")
        return True
    
    def _cancel_rental_mock(self, agreement_id: int) -> bool:
        """Cancel rental in database (mock mode)."""
        rental = self.db.query(CrewRental).filter(
            CrewRental.id == agreement_id
        ).first()
        
        if not rental:
            return False
        
        rental.status = "canceled"
        rental.end_time = datetime.utcnow()
        rental.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Mock: Canceled rental agreement {agreement_id}")
        return True
    
    # ========== ON-CHAIN IMPLEMENTATIONS (STUBS) ==========
    
    def _create_rental_onchain(
        self,
        crew_id: str,
        renter_address: str,
        owner_address: str,
        duration_hours: Optional[int],
        price_c7t: float,
    ) -> RentalAgreement:
        """
        Create rental agreement on-chain (future implementation).
        
        This would:
        1. Call smart contract's createRentalAgreement() function
        2. Transfer C7T tokens to contract as escrow
        3. Emit RentalCreated event
        4. Store agreement ID on-chain
        """
        if not self.config.rental_contract_address:
            raise RuntimeError("Rental contract address not configured")
        
        # Future implementation would:
        # contract = self.web3_client.get_contract(
        #     address=self.config.rental_contract_address,
        #     abi=RENTAL_CONTRACT_ABI
        # )
        # tx = contract.functions.createRentalAgreement(
        #     crew_id,
        #     renter_address,
        #     owner_address,
        #     duration_hours or 0,
        #     int(price_c7t * 10**18)  # Convert to wei
        # ).transact()
        # receipt = self.web3_client._web3.eth.wait_for_transaction_receipt(tx)
        
        logger.warning("On-chain rental creation not yet implemented")
        raise NotImplementedError("On-chain rental creation coming soon")
    
    def _complete_rental_onchain(self, agreement_id: int) -> bool:
        """
        Complete rental on-chain (future implementation).
        
        This would:
        1. Call smart contract's completeRental() function
        2. Release escrowed tokens to owner
        3. Emit RentalCompleted event
        4. Update on-chain status
        """
        logger.warning("On-chain rental completion not yet implemented")
        raise NotImplementedError("On-chain rental completion coming soon")
    
    def _cancel_rental_onchain(self, agreement_id: int) -> bool:
        """
        Cancel rental on-chain (future implementation).
        
        This would:
        1. Call smart contract's cancelRental() function
        2. Refund escrowed tokens (if applicable)
        3. Emit RentalCanceled event
        4. Update on-chain status
        """
        logger.warning("On-chain rental cancellation not yet implemented")
        raise NotImplementedError("On-chain rental cancellation coming soon")


# Smart Contract ABI (placeholder for future use)
RENTAL_CONTRACT_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "crewId", "type": "bytes32"},
            {"name": "renter", "type": "address"},
            {"name": "owner", "type": "address"},
            {"name": "duration", "type": "uint256"},
            {"name": "price", "type": "uint256"}
        ],
        "name": "createRentalAgreement",
        "outputs": [{"name": "agreementId", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [{"name": "agreementId", "type": "uint256"}],
        "name": "completeRental",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [{"name": "agreementId", "type": "uint256"}],
        "name": "cancelRental",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [{"name": "agreementId", "type": "uint256"}],
        "name": "getRentalStatus",
        "outputs": [
            {"name": "crewId", "type": "bytes32"},
            {"name": "renter", "type": "address"},
            {"name": "owner", "type": "address"},
            {"name": "price", "type": "uint256"},
            {"name": "startTime", "type": "uint256"},
            {"name": "endTime", "type": "uint256"},
            {"name": "status", "type": "uint8"}
        ],
        "type": "function"
    }
]
