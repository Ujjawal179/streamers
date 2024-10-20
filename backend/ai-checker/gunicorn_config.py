# Gunicorn configuration file: gunicorn_config.py

bind = "0.0.0.0:8000"
workers = 3  # Adjust based on your server's capabilities
timeout = 120  # Increased timeout for large file uploads
max_requests = 1000
max_requests_jitter = 50


# gunicorn_config.py

# import multiprocessing

# # Binding
# bind = "0.0.0.0:8000"

# # Worker Processes
# workers = multiprocessing.cpu_count() * 2 + 1
# worker_class = 'sync'
# worker_connections = 1000
# timeout = 300
# keepalive = 2

# # Logging
# errorlog = '/path/to/error.log'
# accesslog = '/path/to/access.log'
# loglevel = 'info'

# # Server Mechanics
# user = 'www-data'
# group = 'www-data'
# pidfile = '/path/to/gunicorn.pid'

# # Server Socket
# backlog = 2048

# # Security
# limit_request_line = 4094
# limit_request_fields = 100
# limit_request_field_size = 8190

# # App Loading
# reload = False
# preload_app = True

# # SSL (uncomment if using HTTPS)
# # keyfile = '/path/to/keyfile'
# # certfile = '/path/to/certfile'

# # Server Hooks
# def on_starting(server):
#     print("Server is starting!")

# def on_reload(server):
#     print("Server is reloading!")

# def post_worker_init(worker):
#     print(f"Worker {worker.id} initialized!")

# def worker_int(worker):
#     print(f"Worker {worker.id} was interrupted!")

# def worker_abort(worker):
#     print(f"Worker {worker.id} was aborted!")

# # Max Requests
# max_requests = 1000
# max_requests_jitter = 50

# # Timeouts
# graceful_timeout = 120