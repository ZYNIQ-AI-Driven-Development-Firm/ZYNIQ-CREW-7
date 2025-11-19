"""Initial migration with all models

Revision ID: c97d607f592c
Revises: 
Create Date: 2025-11-19 04:11:22.730845

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c97d607f592c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # Create enum types (if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE runstatus AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE chaintype AS ENUM ('ethereum', 'polygon', 'arbitrum', 'optimism', 'local', 'test');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactiondirection AS ENUM ('credit', 'debit');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False, server_default='default'),
        sa.Column('role', sa.String(), nullable=False, server_default='owner'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Wallets table
    op.create_table(
        'wallets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('org_id', sa.String(), nullable=False, unique=True),
        sa.Column('credits', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_wallets_org_id', 'wallets', ['org_id'], unique=True)
    
    # Crews table
    op.create_table(
        'crews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', sa.String(), nullable=False, server_default='demo'),
        sa.Column('org_id', sa.String(), nullable=False, server_default='default'),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='orchestrated_team'),
        sa.Column('recipe_json', sa.JSON(), nullable=True),
        sa.Column('base_crew_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('kv_namespace', sa.String(), nullable=False),
        sa.Column('vector_collection', sa.String(), nullable=False),
        sa.Column('models_json', sa.JSON(), nullable=True),
        sa.Column('tools_json', sa.JSON(), nullable=True),
        sa.Column('env_json', sa.JSON(), nullable=True),
        sa.Column('api_key', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['base_crew_id'], ['crews.id']),
    )
    
    # Agents table
    op.create_table(
        'agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('specialist_type', sa.String(), nullable=True),
        sa.Column('backstory', sa.Text(), nullable=True),
        sa.Column('goal', sa.Text(), nullable=True),
        sa.Column('llm_config', sa.Text(), nullable=True),
        sa.Column('tools_list', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_agents_crew_id', 'agents', ['crew_id'])
    
    # Runs table
    op.create_table(
        'runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('queued', 'running', 'succeeded', 'failed', 'cancelled', name='runstatus'), nullable=False, server_default='queued'),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('finished_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('prompt', sa.String(), nullable=False, server_default=''),
        sa.Column('total_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
    )
    
    # Audits table
    op.create_table(
        'audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('detail_json', sa.JSON(), nullable=False),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # EvalCases table
    op.create_table(
        'evalcases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('crew_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('input_json', sa.JSON(), nullable=False),
        sa.Column('expected_json', sa.JSON(), nullable=False),
    )
    op.create_index('ix_evalcases_crew_id', 'evalcases', ['crew_id'])
    
    # User Wallets (Crypto) table
    op.create_table(
        'user_wallets',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('address', sa.String(42), nullable=False),
        sa.Column('chain', sa.Enum('ethereum', 'polygon', 'arbitrum', 'optimism', 'local', 'test', name='chaintype'), nullable=False, server_default='test'),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('idx_user_wallet_address', 'user_wallets', ['address'])
    
    # Token Balances table
    op.create_table(
        'token_balances',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_symbol', sa.String(10), nullable=False, server_default='C7T'),
        sa.Column('balance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('idx_token_balance_user_symbol', 'token_balances', ['user_id', 'token_symbol'], unique=True)
    
    # Token Transactions table
    op.create_table(
        'token_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_symbol', sa.String(10), nullable=False, server_default='C7T'),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('direction', sa.Enum('credit', 'debit', name='transactiondirection'), nullable=False),
        sa.Column('reason', sa.String(255), nullable=False),
        sa.Column('balance_after', sa.Float(), nullable=False),
        sa.Column('reference_id', sa.String(100), nullable=True),
        sa.Column('reference_type', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('idx_token_tx_user_created', 'token_transactions', ['user_id', 'created_at'])
    op.create_index('idx_token_tx_reference', 'token_transactions', ['reference_type', 'reference_id'])
    
    # Crew Rentals table
    op.create_table(
        'crew_rentals',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('renter_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('price_c7t', sa.Float(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('duration_hours', sa.Integer(), nullable=True),
        sa.Column('tx_reference', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
        sa.ForeignKeyConstraint(['renter_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id']),
    )
    op.create_index('idx_rental_crew_status', 'crew_rentals', ['crew_id', 'status'])
    op.create_index('idx_rental_renter', 'crew_rentals', ['renter_user_id'])
    
    # Crew Portfolio table
    op.create_table(
        'crew_portfolios',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('missions_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('hours_worked', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('rating_avg', sa.Float(), nullable=True),
        sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('industries', sa.String(500), nullable=True),
        sa.Column('total_earned_c7t', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_rented_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_mission_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
    )
    op.create_index('idx_portfolio_rating', 'crew_portfolios', ['rating_avg'])
    
    # Crew XP table
    op.create_table(
        'crew_xp',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
    )
    op.create_index('idx_crew_xp_level', 'crew_xp', ['level'])
    
    # Crew Ratings table
    op.create_table(
        'crew_ratings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('crew_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.String(1000), nullable=True),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id']),
    )
    op.create_index('idx_rating_crew_user', 'crew_ratings', ['crew_id', 'user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    
    # Drop tables in reverse order
    op.drop_table('crew_ratings')
    op.drop_table('crew_xp')
    op.drop_table('crew_portfolios')
    op.drop_table('crew_rentals')
    op.drop_table('token_transactions')
    op.drop_table('token_balances')
    op.drop_table('user_wallets')
    op.drop_table('evalcases')
    op.drop_table('audits')
    op.drop_table('runs')
    op.drop_table('agents')
    op.drop_table('crews')
    op.drop_table('wallets')
    op.drop_table('users')
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS transactiondirection")
    op.execute("DROP TYPE IF EXISTS chaintype")
    op.execute("DROP TYPE IF EXISTS runstatus")
