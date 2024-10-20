import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from nudenet import NudeDetector
import cv2
from typing import Dict, List, Tuple
import tempfile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/check-content": {
        "origins": ["*"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"],
        "max_age": 3600,
        "supports_credentials": True
    }
})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'}

# Initialize NudeDetector
nude_detector = NudeDetector()

def get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return 'video' if ext in ALLOWED_EXTENSIONS else 'unknown'

def process_video_frames(video_path: str, sample_rate: int = 30) -> Dict[int, List[Tuple]]:
    """
    Process video frames and check for inappropriate content.
    
    Args:
        video_path: Path to the video file
        sample_rate: Process every Nth frame
    
    Returns:
        Dictionary with frame numbers as keys and detection results as values
    """
    results = {}
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % sample_rate == 0:
            # Save frame to temporary file
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                cv2.imwrite(temp_file.name, frame)
                # Process frame
                try:
                    frame_result = nude_detector.detect(temp_file.name)
                    if frame_result:
                        results[frame_count] = frame_result
                finally:
                    # Clean up temporary file
                    os.unlink(temp_file.name)
        
        frame_count += 1
    
    cap.release()
    return results

@app.route('/check-content', methods=['POST'])
def check_content():
    try:
        if 'file' not in request.files:
            return jsonify({
                'result': 'rejected',
                'message': 'No file part in the request'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'result': 'rejected',
                'message': 'No file selected for uploading'
            }), 400
        
        file_type = get_file_type(file.filename)
        if file_type != 'video':
            return jsonify({
                'result': 'rejected',
                'message': f'Unsupported file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(filepath)
            logger.info(f"Processing video file: {filename}")
            
            # Process video frames
            results = process_video_frames(filepath)
            
            # Check if any frame contains inappropriate content
            contains_nsfw = any(
                detection['class'] != 'UNKNOWN' 
                for frame_results in results.values() 
                for detection in frame_results
            )

            if contains_nsfw:
                return jsonify({
                    'result': 'rejected',
                    'message': 'Content contains inappropriate material',
                    'details': {
                        'frames_with_content': list(results.keys())
                    }
                }), 200
            
            return jsonify({
                'result': 'approved',
                'message': 'Content is appropriate'
            }), 200

        finally:
            # Clean up the temporary file
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.error(f"Error deleting temporary file: {str(e)}")

    except Exception as e:
        logger.exception("An error occurred during content checking")
        return jsonify({
            'result': 'rejected',
            'message': f'Error processing content: {str(e)}'
        }), 500

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True)