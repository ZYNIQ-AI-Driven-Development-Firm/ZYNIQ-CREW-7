"""
Crypto/Web3 Configuration Layer
Provides abstraction for blockchain operations with mock mode support.
"""
import os
from typing import Optional, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class CryptoConfig:
    """Configuration for crypto/Web3 features."""
    
    c7t_token_address: Optional[str] = None
    crew_nft_address: Optional[str] = None
    rental_contract_address: Optional[str] = None
    rpc_url: Optional[str] = None
    mock_mode: bool = True
    chain_id: int = 1337  # Default to local/test chain
    
    @classmethod
    def from_env(cls) -> "CryptoConfig":
        """Load configuration from environment variables."""
        mock_mode = os.getenv("CRYPTO_MOCK_MODE", "true").lower() == "true"
        
        return cls(
            c7t_token_address=os.getenv("C7T_TOKEN_ADDRESS"),
            crew_nft_address=os.getenv("CREW_NFT_ADDRESS"),
            rental_contract_address=os.getenv("RENTAL_CONTRACT_ADDRESS"),
            rpc_url=os.getenv("RPC_URL"),
            mock_mode=mock_mode,
            chain_id=int(os.getenv("CHAIN_ID", "1337")),
        )
    
    def is_configured(self) -> bool:
        """Check if Web3 is properly configured."""
        if self.mock_mode:
            return True
        return all([
            self.c7t_token_address,
            self.rpc_url,
        ])


class Web3Client:
    """
    Web3 client wrapper with mock mode support.
    Provides safe access to blockchain operations.
    """
    
    def __init__(self, config: CryptoConfig):
        self.config = config
        self._web3 = None
        self._initialized = False
        
        if not config.mock_mode and config.is_configured():
            try:
                from web3 import Web3
                self._web3 = Web3(Web3.HTTPProvider(config.rpc_url))
                self._initialized = self._web3.is_connected()
                if self._initialized:
                    logger.info(f"Web3 connected to {config.rpc_url}")
                else:
                    logger.warning("Web3 provider configured but not connected")
            except ImportError:
                logger.warning("web3.py not installed, falling back to mock mode")
                self.config.mock_mode = True
            except Exception as e:
                logger.error(f"Failed to initialize Web3: {e}")
                self.config.mock_mode = True
    
    def is_connected(self) -> bool:
        """Check if Web3 is connected."""
        if self.config.mock_mode:
            return True
        return self._initialized and self._web3 is not None
    
    def get_balance(self, address: str, token_address: Optional[str] = None) -> int:
        """
        Get token balance for an address.
        
        Args:
            address: Wallet address
            token_address: ERC-20 token address (uses C7T if None)
        
        Returns:
            Balance in smallest unit (wei for ETH, or token decimals)
        """
        if self.config.mock_mode:
            # In mock mode, return 0 - actual balance managed off-chain
            return 0
        
        if not self._web3:
            raise RuntimeError("Web3 not initialized")
        
        token_addr = token_address or self.config.c7t_token_address
        if not token_addr:
            raise ValueError("Token address not configured")
        
        # ERC-20 balanceOf ABI
        abi = [{
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        }]
        
        try:
            contract = self._web3.eth.contract(
                address=self._web3.to_checksum_address(token_addr),
                abi=abi
            )
            balance = contract.functions.balanceOf(
                self._web3.to_checksum_address(address)
            ).call()
            return balance
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return 0
    
    def verify_signature(self, message: str, signature: str, address: str) -> bool:
        """
        Verify a signed message.
        
        Args:
            message: Original message
            signature: Signature hex string
            address: Expected signer address
        
        Returns:
            True if signature is valid
        """
        if self.config.mock_mode:
            # In mock mode, accept any signature
            logger.info(f"Mock mode: accepting signature for {address}")
            return True
        
        if not self._web3:
            return False
        
        try:
            from eth_account.messages import encode_defunct
            
            message_hash = encode_defunct(text=message)
            recovered_address = self._web3.eth.account.recover_message(
                message_hash,
                signature=signature
            )
            return recovered_address.lower() == address.lower()
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False
    
    def get_contract(self, address: str, abi: list) -> Any:
        """Get a contract instance."""
        if self.config.mock_mode:
            raise RuntimeError("Contract access not available in mock mode")
        
        if not self._web3:
            raise RuntimeError("Web3 not initialized")
        
        return self._web3.eth.contract(
            address=self._web3.to_checksum_address(address),
            abi=abi
        )


# Global config instance
_config: Optional[CryptoConfig] = None
_client: Optional[Web3Client] = None


def get_crypto_config() -> CryptoConfig:
    """Get global crypto configuration."""
    global _config
    if _config is None:
        _config = CryptoConfig.from_env()
        logger.info(f"Crypto config initialized (mock_mode={_config.mock_mode})")
    return _config


def get_web3_client() -> Web3Client:
    """Get global Web3 client."""
    global _client
    if _client is None:
        config = get_crypto_config()
        _client = Web3Client(config)
    return _client


def reset_crypto_config():
    """Reset global config (useful for testing)."""
    global _config, _client
    _config = None
    _client = None
