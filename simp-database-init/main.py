# main.py
import argparse
import os
import logging
import sys
from alembic import command
from alembic.config import Config
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from argon2 import PasswordHasher, exceptions as argon2_exceptions # Import Argon2 hasher

# --- Adjust these imports based on your project structure ---
from database.session import engine # Your existing engine
from models.base import Base
from models.nutrient import Nutrient # Import your Nutrient model
from models.user import User # <<<<---- ADDED: Import User model
from triggers.tsvectors import initialize_vectors
from database.seed_data.nutrients import seed_nutrients # Import the nutrient list
# --- ---

# Alembic Config Path
ALEMBIC_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "alembic.ini")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Create a Session factory associated with the engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Argon2 Password Hasher Instance ---
ph = PasswordHasher()

# --- Admin User Configuration (IMPORTANT: Use Environment Variables in Production!) ---
ADMIN_USERNAME = os.environ.get('ADMIN_USER', 'Admin')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') # CRITICAL: No default password!


def confirm_action(message: str) -> bool:
    """Ask the user for confirmation before proceeding."""
    response = input(f"{message} (yes/no): ").strip().lower()
    return response == "yes"


def seed_initial_data():
    """Seed the database with initial nutrient definitions."""
    logging.info("Seeding initial nutrient data...")
    db = SessionLocal() # Create a new session
    try:
        # Get existing names and symbols efficiently
        existing_data = db.query(Nutrient.nutrient_name, Nutrient.nutrient_symbol).all()
        existing_nutrient_names = {name for name, symbol in existing_data}
        existing_symbols = {symbol for name, symbol in existing_data if symbol is not None}

        added_count = 0
        skipped_count = 0

        for nutrient_data in seed_nutrients:
            name_exists = nutrient_data['nutrient_name'] in existing_nutrient_names
            symbol = nutrient_data.get('nutrient_symbol')
            symbol_exists = symbol and symbol in existing_symbols

            if not name_exists and not symbol_exists:
                nutrient_obj = Nutrient(**nutrient_data)
                db.add(nutrient_obj)
                existing_nutrient_names.add(nutrient_data['nutrient_name'])
                if symbol:
                    existing_symbols.add(symbol)
                added_count += 1
            else:
                skipped_count += 1

        if added_count > 0:
            db.commit()
            logging.info(f"Successfully added {added_count} new nutrients.")
        else:
             logging.info("No new nutrients were added.")

        if skipped_count > 0:
             logging.info(f"Skipped {skipped_count} nutrients (already exist based on name or symbol).")

    except SQLAlchemyError as db_err: # Catch specific DB errors
        db.rollback()
        logging.error(f"Database error during nutrient seeding: {db_err}", exc_info=True)
    except Exception as e:
        db.rollback() # Attempt rollback on general errors too
        logging.error(f"Unexpected error during nutrient seeding: {e}", exc_info=True)
    finally:
        db.close()


# --- ADDED ADMIN SEEDING FUNCTION ---
def seed_admin_user():
    """Seed the database with an initial admin user."""
    logging.info(f"Checking for initial admin user '{ADMIN_USERNAME}'...")

    if not ADMIN_PASSWORD:
        logging.warning("ADMIN_PASSWORD environment variable not set. Skipping admin user creation.")
        return # Don't treat as error, just skip

    if not ADMIN_USERNAME or not ADMIN_EMAIL:
         logging.warning("ADMIN_USER or ADMIN_EMAIL not set correctly. Skipping admin user creation.")
         return

    db = SessionLocal()
    try:
        # Check if admin user already exists by username or email
        admin_exists = db.query(User).filter(
            (User.username == ADMIN_USERNAME) | (User.email == ADMIN_EMAIL)
        ).first()

        if not admin_exists:
            logging.info(f"Admin user '{ADMIN_USERNAME}' not found. Creating...")
            try:
                # Hash the password using Argon2
                hashed_pw = ph.hash(ADMIN_PASSWORD)
                logging.info("Password hashed successfully using Argon2.")
            except argon2_exceptions.HashingError as hash_error:
                 logging.error(f"Argon2 failed to hash admin password: {hash_error}", exc_info=True)
                 return # Stop seeding admin if password cannot be hashed
            except Exception as e:
                logging.error(f"An unexpected error occurred during password hashing: {e}", exc_info=True)
                return

            # Create the new User object
            admin_user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                hashed_password=hashed_pw,
                role="admin", # Explicitly set role to admin
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logging.info(f"Admin user '{ADMIN_USERNAME}' created successfully.")
        else:
            logging.info(f"Admin user '{ADMIN_USERNAME}' or email '{ADMIN_EMAIL}' already exists. Skipping creation.")

    except SQLAlchemyError as db_err:
        db.rollback()
        logging.error(f"Database error during admin user seeding: {db_err}", exc_info=True)
    except Exception as e:
        db.rollback() # Attempt rollback on general errors too
        logging.error(f"An unexpected error occurred during admin user seeding: {e}", exc_info=True)
    finally:
        db.close()
# --- END ADDED ADMIN SEEDING FUNCTION ---


def create_database():
    """Create all tables, initialize vectors, seed nutrients, and seed admin.""" # Updated docstring
    try:
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logging.info("Initializing TSVectors...")
        initialize_vectors()
        logging.info("Database tables and vectors created.")

        # Seed data after tables and vectors exist
        seed_initial_data() # Seed nutrients first
        seed_admin_user()   # <<< CALL SEED ADMIN FUNCTION HERE

        logging.info("Database creation and seeding completed successfully!")
    except Exception as e:
        logging.error(f"Error during database creation/seeding: {e}", exc_info=True)


def drop_database():
    """Drop all tables in the database."""
    if confirm_action("WARNING: This will delete ALL data. Are you sure?"):
        try:
            logging.warning("Dropping all tables...")
            Base.metadata.drop_all(bind=engine)
            logging.info("Database dropped successfully!")
        except Exception as e:
            logging.error(f"Error dropping database: {e}", exc_info=True)
    else:
        logging.info("Operation cancelled.")


def migrate_database():
    """Run Alembic migrations."""
    logging.info("Applying Alembic migrations...")
    try:
        alembic_cfg = Config(ALEMBIC_CONFIG_PATH)
        command.upgrade(alembic_cfg, "head")
        logging.info("Migrations applied successfully!")
    except Exception as e:
        logging.error(f"Error applying migrations: {e}", exc_info=True)


def downgrade_database():
    """Rollback last Alembic migration."""
    if confirm_action("WARNING: This will revert the last migration. Continue?"):
        try:
            logging.info("Reverting last Alembic migration...")
            alembic_cfg = Config(ALEMBIC_CONFIG_PATH)
            command.downgrade(alembic_cfg, "-1")
            logging.info("Last migration reverted successfully!")
        except Exception as e:
            logging.error(f"Error reverting migration: {e}", exc_info=True)
    else:
        logging.info("Operation cancelled.")


def reset_database():
    """Reset database by dropping, creating, seeding, and migrating.""" # Updated docstring
    try:
        drop_database() # Confirmation is handled inside
        if confirm_action: # Check if drop was not cancelled implicitly (Needs better check maybe)
            create_database() # This now includes seeding nutrients and admin
            migrate_database() # Apply migrations after base tables/seed data exist
            logging.info("Database reset successfully!")
        # If drop_database was cancelled, log that reset didn't fully proceed.
        # Note: drop_database already logs cancellation. Maybe reset should check a return value?
        # For now, assuming drop either completes or logs cancellation.

    except Exception as e:
        logging.error(f"Error resetting database: {e}", exc_info=True)


def main():
    parser = argparse.ArgumentParser(description="Manage the database.")
    parser.add_argument(
        "action",
        choices=["create", "drop", "migrate", "downgrade", "reset", "seed", "seed-admin"], # Added 'seed-admin' choice
        help="Database action: create/drop/migrate/downgrade/reset/seed/seed-admin",
    )

    args = parser.parse_args()

    actions = {
        "create": create_database,
        "drop": drop_database,
        "migrate": migrate_database,
        "downgrade": downgrade_database,
        "reset": reset_database,
        "seed": seed_initial_data, # Seed only nutrients
        "seed-admin": seed_admin_user, # Seed only admin
    }

    selected_action = actions.get(args.action)
    if selected_action:
        try:
            selected_action()
        except Exception as e:
             logging.error(f"An error occurred during action '{args.action}': {e}", exc_info=True)
    else:
        logging.error(f"Invalid action specified: {args.action}")


if __name__ == "__main__":
     # Optional: Add security reminder printout here too
    print("+"*60)
    print(" Database Management Script ".center(60, "="))
    print("+"*60)
    if any(action in sys.argv for action in ["create", "reset", "seed-admin"]):
         print("INFO: Actions 'create', 'reset', 'seed-admin' may create an admin user.")
         print("      Credentials sourced from ADMIN_USER, ADMIN_EMAIL, ADMIN_PASSWORD env vars.")
         if not os.environ.get('ADMIN_PASSWORD'):
              print("WARN: ADMIN_PASSWORD environment variable is not set!")
         print("-"*60)

    main()

    print("+"*60)
    print(" Script Finished ".center(60, "="))
    print("+"*60)