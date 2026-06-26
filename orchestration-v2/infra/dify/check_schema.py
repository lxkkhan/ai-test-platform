from app import create_app
from sqlalchemy import inspect
from models.model import db
app = create_app()[1]
with app.app_context():
    ins = inspect(db.engine)
    for c in ins.get_columns('apps'):
        print(f"{c['name']}: {c['type']} nullable={c['nullable']}")
