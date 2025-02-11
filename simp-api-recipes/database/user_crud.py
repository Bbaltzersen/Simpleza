# user_crud.py

from sqlalchemy.orm import Session
from models.user import User

def add_user(db: Session, username: str, email: str) -> User:
    """
    Create a new user in the database if one does not already exist.
    
    Args:
        db (Session): The SQLAlchemy session.
        username (str): The username (from Auth0 token: nickname or name).
        email (str): The user's unique email address.
    
    Returns:
        User: The existing or newly created User object.
    """
    # Check for an existing user by email.
    existing_user = db.query(User).filter_by(email=email).first()
    if existing_user:
        return existing_user

    # Create and persist the new user.
    new_user = User(username=username, email=email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
