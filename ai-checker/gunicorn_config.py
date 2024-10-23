# # gunicorn_config.py
# import multiprocessing
# import os
# # Set environment variables
# os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# os.environ['KERAS_BACKEND'] = 'tensorflow'
# os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
# os.environ['TF_DISABLE_MKL'] = '1'
# os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
# os.environ['PYTHONPATH'] = ''

# bind = "0.0.0.0:8000"
# workers = 3  # Adjust based on your server's capabilities
# threads = 1
# worker_class = 'gthread'
# timeout = 200  # Increased timeout for large file uploads
# max_requests = 0
# max_requests_jitter = 0
# preload_app = True

# def init_tensorflow():
#     """Initialize TensorFlow with CPU only"""
#     import tensorflow as tf
#     tf.config.set_visible_devices([], 'GPU')
#     physical_devices = tf.config.list_physical_devices('GPU')
#     for device in physical_devices:
#         tf.config.experimental.set_memory_growth(device, True)
#     tf.keras.backend.clear_session()

# def on_starting(server):
#     """Initialize TF before workers are spawned"""
#     init_tensorflow()

# def pre_fork(server, worker):
#     """Pre-fork initialization"""
#     init_tensorflow()

# def post_fork(server, worker):
#     """Post-fork initialization"""
#     init_tensorflow()
# # Logging
# capture_output = True
# errorlog = '-'
# loglevel = 'debug'
# accesslog = '-'

# # Performance tuning
# keepalive = 65
# worker_connections = 1000

import os
import multiprocessing

# Force CPU configuration
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_DISABLE_MKL'] = '1'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['PYTHONPATH'] = ''

# Basic configuration
bind = '0.0.0.0:8000'
workers = 1
threads = 1
worker_class = 'sync'
worker_connections = 1000
timeout = 300
keepalive = 2
preload_app = True

def init_tf():
    """Initialize TensorFlow in CPU-only mode"""
    import tensorflow as tf
    tf.config.set_visible_devices([], 'GPU')
    tf.keras.backend.clear_session()
    print("TensorFlow initialized with devices:", tf.config.list_physical_devices())

def on_starting(server):
    init_tf()

def pre_fork(server, worker):
    init_tf()

def post_fork(server, worker):
    init_tf()

# Logging
loglevel = 'debug'
accesslog = '-'
errorlog = '-'
capture_output = True