import os
from flask import (
    Flask
)
from flask_sqlalchemy import SQLAlchemy


app = Flask(
    __name__,
    static_folder='./templates/static',
    template_folder='./templates'
)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRESQL_DATABASE_URL')
db = SQLAlchemy(app, session_options={'autocommit': False})
