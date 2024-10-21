# source nsfw/bin/activate
export FLASK_APP=app/app.py
export FLASK_ENV=production
gunicorn --config gunicorn_config.py "app.app:app"