import os
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import tempfile
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with more restrictive settings
CORS(app, resources={
    r"/check-content": {
        "origins": ["*"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600,
        "supports_credentials": True
    }
})

# Configuration
class Config:
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500 MB
    UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
    ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.wmv'}
    SAMPLE_RATE = 15  # Process every 30th frame
    BATCH_SIZE = 32  # Number of frames to process in parallel
    CONFIDENCE_THRESHOLD = 0.85

app.config.from_object(Config)

class ContentAnalyzer:
    def __init__(self):
        self.model = self._load_model()
        self.executor = ThreadPoolExecutor(max_workers=4)
    def _load_model(self):
        """Load and configure the model"""

        model = MobileNetV2(weights='imagenet', include_top=True)
        return model
        
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess a single frame for model input"""
        frame = cv2.resize(frame, (224, 224))
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = img_to_array(frame)
        frame = np.expand_dims(frame, axis=0)
        frame = preprocess_input(frame)
        return frame
        
    def process_batch(self, frames: List[np.ndarray]) -> List[Dict]:
        """Process a batch of frames"""
        if not frames:
            return []
            
        # Preprocess all frames
        processed_frames = np.vstack([
            self.preprocess_frame(frame) for frame in frames
        ])
        
        # Get predictions
        predictions = self.model.predict(processed_frames)
        
        results = []
        for pred in predictions:
            # Get top prediction
            class_idx = np.argmax(pred)
            confidence = float(pred[class_idx])
            
            if confidence > Config.CONFIDENCE_THRESHOLD:
                results.append({
                    'class_id': int(class_idx),
                    'confidence': confidence
                })
            else:
                results.append(None)
                
        return results

    def analyze_video(self, video_path: str) -> Dict:
        """Analyze video content"""

        results = {
            'inappropriate_frames': [],
            'total_frames': 0,
            'processed_frames': 0
        }
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Unable to open video file")
            
        frame_batch = []
        frame_indices = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % Config.SAMPLE_RATE == 0:
                frame_batch.append(frame)
                frame_indices.append(frame_count)
                
                if len(frame_batch) >= Config.BATCH_SIZE:
                    # Process batch
                    batch_results = self.process_batch(frame_batch)
                    
                    # Handle results
                    for idx, result in zip(frame_indices, batch_results):
                        if result:
                            results['inappropriate_frames'].append({
                                'frame_number': idx,
                                'timestamp': idx / cap.get(cv2.CAP_PROP_FPS),
                                'confidence': result['confidence']
                            })
                    
                    frame_batch = []
                    frame_indices = []
                    
            frame_count += 1
            
        # Process remaining frames
        if frame_batch:
            batch_results = self.process_batch(frame_batch)
            
            for idx, result in zip(frame_indices, batch_results):
                if result:
                    results['inappropriate_frames'].append({
                        'frame_number': idx,
                        'timestamp': idx / cap.get(cv2.CAP_PROP_FPS),
                        'confidence': result['confidence']
                    })
        
        cap.release()
        
        results['total_frames'] = frame_count
        results['processed_frames'] = frame_count // Config.SAMPLE_RATE
        
        return results

# Initialize content analyzer
analyzer = ContentAnalyzer()

@app.route('/check-content', methods=['POST'])
def check_content():
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
            
        file = request.files['file']
        if not file.filename:
            return jsonify({
                'status': 'error',
                'message': 'Empty filename'
            }), 400
            
        # Validate file type
        ext = Path(file.filename).suffix.lower()
        if ext not in Config.ALLOWED_EXTENSIONS:
            return jsonify({
                'status': 'error',
                'message': f'Unsupported file type. Allowed: {", ".join(Config.ALLOWED_EXTENSIONS)}'
            }), 400
            
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_file:
            try:
                file.save(temp_file.name)
                
                # Analyze content
                results = analyzer.analyze_video(temp_file.name)
                
                # Determine if content is appropriate
                is_appropriate = len(results['inappropriate_frames']) == 0
                
                return jsonify({
                    'status': 'success',
                    'appropriate': is_appropriate,
                    'analysis': {
                        'total_frames': results['total_frames'],
                        'processed_frames': results['processed_frames'],
                        'inappropriate_frames': results['inappropriate_frames']
                    }
                })
                
            finally:
                # Clean up
                os.unlink(temp_file.name)
                
    except Exception as e:
        logger.exception("Error processing content")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Create necessary directories
Config.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True)