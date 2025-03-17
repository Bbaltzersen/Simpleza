from sqlalchemy import text
from database.session import SessionLocal

def initialize_vectors():
    """Runs SQL commands to set up full-text search triggers."""
    db = SessionLocal()

    sql_statements = [
        # Create function to update `name_tsv` for tags
        """
        CREATE OR REPLACE FUNCTION tag_name_tsv_update() RETURNS TRIGGER AS $$
        BEGIN
          NEW.name_tsv := to_tsvector('english', NEW.name);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,

        # Create trigger for tags
        """
        DROP TRIGGER IF EXISTS update_tag_tsv ON tags;
        CREATE TRIGGER update_tag_tsv
        BEFORE INSERT OR UPDATE ON tags
        FOR EACH ROW EXECUTE FUNCTION tag_name_tsv_update();
        """,

        # Create function to update `name_tsv` for ingredients
        """
        CREATE OR REPLACE FUNCTION ingredient_name_tsv_update() RETURNS TRIGGER AS $$
        BEGIN
          NEW.name_tsv := to_tsvector('english', NEW.name);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,

        # Create trigger for ingredients
        """
        DROP TRIGGER IF EXISTS update_ingredient_tsv ON ingredients;
        CREATE TRIGGER update_ingredient_tsv
        BEFORE INSERT OR UPDATE ON ingredients
        FOR EACH ROW EXECUTE FUNCTION ingredient_name_tsv_update();
        """
    ]

    try:
        for sql in sql_statements:
            db.execute(text(sql))
        db.commit()
        print("Full-text search triggers successfully initialized!")
    except Exception as e:
        db.rollback()
        print(f"Error initializing full-text search triggers: {e}")
    finally:
        db.close()
