# database/connection.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import FunctionElement

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class similarity(FunctionElement):
    """Register `similarity()` for PostgreSQL trigram search"""
    type = float

@compiles(similarity)
def compile_similarity(element, compiler, **kw):
    return "similarity(%s, %s)" % tuple(map(compiler.process, element.clauses))


class word_similarity(FunctionElement):
    """Register `word_similarity()` for PostgreSQL improved ranking"""
    type = float

@compiles(word_similarity)
def compile_word_similarity(element, compiler, **kw):
    return "word_similarity(%s, %s)" % tuple(map(compiler.process, element.clauses))


class levenshtein(FunctionElement):
    """Register `levenshtein()` for fuzzy string matching"""
    type = int

@compiles(levenshtein)
def compile_levenshtein(element, compiler, **kw):
    return "levenshtein(%s, %s)" % tuple(map(compiler.process, element.clauses))
