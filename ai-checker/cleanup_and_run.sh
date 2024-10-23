
# #!/bin/bash
# # source nsfw/bin/activate

# echo "Cleaning up old processes..."
# pkill -f gunicorn
# sleep 2

# echo "Creating upload directory..."
# mkdir -p app/uploads
# chmod 777 app/uploads
# export TF_ENABLE_ONEDNN_OPTS=0
# export TF_CPP_MIN_LOG_LEVEL=2
# export TF_DISABLE_MKL=1

# echo "Starting server..."
# export FLASK_APP=app/app.py
# export FLASK_ENV=production
# # gunicorn --config gunicorn_config.py "app.app:app"

# # gunicorn --workers=1 \
# #          --threads=1 \
# #          --worker-class=sync \
# #          --timeout=120 \
# #          --preload \
# #          --log-level=debug \
# #          --capture-output \
# #          --config gunicorn_config.py "app.app:app"
# exec gunicorn \
#     --config gunicorn_config.py \
#     --preload \
#     --log-level debug \
#     "app.app:app"
#!/bin/bash

echo "Cleaning up old processes..."
pkill -f gunicorn
sleep 2

echo "Setting up environment..."
export TF_ENABLE_ONEDNN_OPTS=0
export KERAS_BACKEND="tensorflow"
export TF_CPP_MIN_LOG_LEVEL=2
export TF_DISABLE_MKL=1
export CUDA_VISIBLE_DEVICES="-1"
export PYTHONPATH=""

echo "Verifying TensorFlow setup..."
python - <<EOF
import tensorflow as tf
print("TensorFlow devices:", tf.config.list_physical_devices())
tf.config.set_visible_devices([], 'GPU')
print("After disabling GPU:", tf.config.list_physical_devices())
EOF

echo "Starting Gunicorn..."
exec gunicorn \
    --config gunicorn_config.py \
    --preload \
    --log-level debug \
    --worker-class=sync \
    --workers=1 \
    --threads=1 \
    "app.app:app"