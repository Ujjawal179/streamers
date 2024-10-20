# cleanup_and_run.sh
#!/bin/bash
echo "Cleaning up old processes..."
pkill -f gunicorn
sleep 2

echo "Creating upload directory..."
mkdir -p app/uploads
chmod 777 app/uploads

echo "Starting server..."
export FLASK_APP=app/app.py
export FLASK_ENV=production
gunicorn --config gunicorn_config.py "app.app:app"

