# For First Time 

python -m venv nsfw 

source nsfw/bin/activate 

pip install -r app/requirements.txt

chmod +x ./run.sh

./run.sh

pkill -f gunicorn

# After Everytime 

source nsfw/bin/activate 

chmod +x ./cleanup_and_run.sh

./cleanup_and_run.sh