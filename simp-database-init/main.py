import argparse
import os
import logging
from alembic import command
from alembic.config import Config
from database.session import engine
from models.database_tables import Base
from triggers.tsvectors import initialize_vectors

# Alembic Config Path
ALEMBIC_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "alembic.ini")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def confirm_action(message: str) -> bool:
    """Ask the user for confirmation before proceeding."""
    response = input(f"{message} (yes/no): ").strip().lower()
    return response == "yes"


def create_database():
    """Create all tables in the database."""
    try:
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        initialize_vectors()
        logging.info("Database created successfully!")
    except Exception as e:
        logging.error(f"Error creating database: {e}")


def drop_database():
    """Drop all tables in the database."""
    if confirm_action("WARNING: This will delete ALL data. Are you sure?"):
        try:
            logging.warning("Dropping all tables...")
            Base.metadata.drop_all(bind=engine)
            logging.info("Database dropped successfully!")
        except Exception as e:
            logging.error(f"Error dropping database: {e}")
    else:
        logging.info("Operation cancelled.")


def migrate_database():
    """Run Alembic migrations."""
    try:
        alembic_cfg = Config(ALEMBIC_CONFIG_PATH)
        command.upgrade(alembic_cfg, "head")
        logging.info("Migrations applied successfully!")
    except Exception as e:
        logging.error(f"Error applying migrations: {e}")


def downgrade_database():
    """Rollback last Alembic migration."""
    if confirm_action("WARNING: This will revert the last migration. Continue?"):
        try:
            alembic_cfg = Config(ALEMBIC_CONFIG_PATH)
            command.downgrade(alembic_cfg, "-1")
            logging.info("Last migration reverted successfully!")
        except Exception as e:
            logging.error(f"Error reverting migration: {e}")
    else:
        logging.info("Operation cancelled.")


def reset_database():
    """Reset database by dropping, creating, and migrating."""
    try:
        drop_database()
        create_database()
        migrate_database()
        logging.info("Database reset successfully!")
    except Exception as e:
        logging.error(f"Error resetting database: {e}")


def main():
    parser = argparse.ArgumentParser(description="Manage the database.")
    parser.add_argument(
        "action",
        choices=["create", "drop", "migrate", "downgrade", "reset"],
        help="Database action: create/drop/migrate/downgrade/reset",
    )

    args = parser.parse_args()

    actions = {
        "create": create_database,
        "drop": drop_database,
        "migrate": migrate_database,
        "downgrade": downgrade_database,
        "reset": reset_database,
    }

    try:
        actions[args.action]()
    except KeyError:
        logging.error("Invalid action specified.")


if __name__ == "__main__":
    main()
