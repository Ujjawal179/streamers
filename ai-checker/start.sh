#!/bin/bash

echo "Cleaning up old processes..."
pkill -f gunicorn
sleep 2

echo "Setting up environment..."
export CUDA_VISIBLE_DEVICES="-1"
export TF_ENABLE_ONEDNN_OPTS=0
export KERAS_BACKEND="tensorflow"
export TF_CPP_MIN_LOG_LEVEL=2
export TF_DISABLE_MKL=1
export TF_FORCE_GPU_ALLOW_GROWTH=true
export PYTHONPATH=""

echo "Testing TensorFlow CPU configuration..."
python - <<EOF
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
import tensorflow as tf
print("TensorFlow version:", tf.__version__)
tf.config.set_visible_devices([], 'GPU')
print("Available devices:", tf.config.list_physical_devices())
# Test computation
result = tf.reduce_sum(tf.random.normal([1000, 1000]))
print("Test computation result:", result.numpy())
EOF

if [ $? -eq 0 ]; then
    echo "TensorFlow test successful, starting Gunicorn..."
    exec gunicorn \
        --config gunicorn_config.py \
        --preload \
        --worker-class=sync \
        --workers=1 \
        --threads=1 \
        --log-level=debug \
        "app.app:app"
else
    echo "TensorFlow test failed"
    exit 1
fi