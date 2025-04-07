# seed_admin.py
import logging
import os
import sys
from argon2 import PasswordHasher, exceptions as argon2_exceptions
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# --- Database & Model Imports ---
# Adjust these paths if seed_admin.py is located elsewhere relative to your project structure
try:
    from database.session import engine # Import your configured SQLAlchemy engine
    from models.user import User       # Import your User model
except ImportError as e:
    print(f"[ERROR] Failed to import required modules: {e}", file=sys.stderr)
    print("[ERROR] Ensure this script is run from the project root directory or adjust import paths.", file=sys.stderr)
    sys.exit(1)
# --- ---

# --- Configuration ---
# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Admin User Credentials (Pulled from Environment Variables for Security)
# Provide defaults only for non-sensitive info or for local development convenience
ADMIN_USERNAME = os.environ.get('ADMIN_USER', 'Admin')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') # CRITICAL: No default password!

# --- Database Setup ---
# Create a Session factory associated with the engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Argon2 Password Hasher Instance
ph = PasswordHasher()
# --- ---

def seed_admin_user():
    """
    Checks for and creates the initial admin user if it doesn't exist.
    Reads credentials from environment variables.
    """
    logging.info(f"Attempting to seed admin user '{ADMIN_USERNAME}'...")

    if not ADMIN_PASSWORD:
        logging.warning("ADMIN_PASSWORD environment variable is not set. Cannot create admin user.")
        print("\n[WARNING] ADMIN_PASSWORD environment variable not set. Admin user was NOT created.", file=sys.stderr)
        return False # Indicate failure

    if not ADMIN_USERNAME or not ADMIN_EMAIL:
         logging.warning("ADMIN_USER or ADMIN_EMAIL not set or invalid. Cannot create admin user.")
         print("\n[WARNING] ADMIN_USER or ADMIN_EMAIL invalid. Admin user was NOT created.", file=sys.stderr)
         return False # Indicate failure

    db = SessionLocal()
    admin_created = False
    try:
        # Check if admin user already exists by username OR email
        admin_exists = db.query(User).filter(
            (User.username == ADMIN_USERNAME) | (User.email == ADMIN_EMAIL)
        ).first()

        if not admin_exists:
            logging.info(f"Admin user '{ADMIN_USERNAME}' not found with email '{ADMIN_EMAIL}'. Creating...")
            try:
                # Hash the password using Argon2
                hashed_pw = ph.hash(ADMIN_PASSWORD)
                logging.info("Password hashed successfully using Argon2.")
            except argon2_exceptions.HashingError as hash_error:
                 logging.error(f"Argon2 failed to hash admin password: {hash_error}", exc_info=True)
                 print("\n[ERROR] Failed to hash the admin password.", file=sys.stderr)
                 # No need to rollback as nothing was added yet
                 return False # Indicate failure
            except Exception as e:
                logging.error(f"An unexpected error occurred during password hashing: {e}", exc_info=True)
                print("\n[ERROR] An unexpected error occurred during password hashing.", file=sys.stderr)
                return False

            # Create the new User object
            admin_user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                hashed_password=hashed_pw,
                role="admin", # Explicitly set role
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logging.info(f"Admin user '{ADMIN_USERNAME}' created successfully.")
            admin_created = True
        else:
            logging.info(f"Admin user '{ADMIN_USERNAME}' or email '{ADMIN_EMAIL}' already exists. Skipping creation.")
            admin_created = True # Consider existing as success for seeding script

        return admin_created # Return True if exists or created, False on error

    except SQLAlchemyError as db_err:
        db.rollback()
        logging.error(f"Database error during admin user seeding: {db_err}", exc_info=True)
        print(f"\n[ERROR] Database error: {db_err}", file=sys.stderr)
        return False
    except Exception as e:
        db.rollback() # Attempt rollback on general errors too
        logging.error(f"An unexpected error occurred during admin user seeding: {e}", exc_info=True)
        print(f"\n[ERROR] Unexpected error: {e}", file=sys.stderr)
        return False
    finally:
        db.close()
        logging.info("Database session closed.")


if __name__ == "__main__":
    print("-" * 50)
    print("--- Running Initial Admin User Seeder ---")
    print("-" * 50)
    # ** SECURITY REMINDER **
    print(f"[*] Reading admin credentials from environment variables:")
    print(f"    ADMIN_USER    (default: '{ADMIN_USERNAME}')")
    print(f"    ADMIN_EMAIL   (default: '{ADMIN_EMAIL}')")
    print(f"    ADMIN_PASSWORD (required, no default)")

    if not ADMIN_PASSWORD:
        print("\n[ERROR] ADMIN_PASSWORD environment variable must be set to create the admin user.")
        print("        Example (Windows CMD): set ADMIN_PASSWORD=your_secure_password")
        print("        Example (PowerShell):  $env:ADMIN_PASSWORD='your_secure_password'")
        print("        Example (Bash/Zsh):    export ADMIN_PASSWORD='your_secure_password'")
    else:
        print("[*] ADMIN_PASSWORD is set (value hidden).")

    print("-" * 50)

    success = seed_admin_user()

    print("-" * 50)
    if success:
        print("--- Admin User Seeder Finished Successfully (or user already exists) ---")
    else:
        print("--- Admin User Seeder Finished With Errors ---", file=sys.stderr)
        sys.exit(1) # Exit with error code if seeding failed
    print("-" * 50)