import os
import numpy as np
import tensorflow as tf
try:
    from model.mobilenetv2 import load_saved_model, preprocess_image
except ImportError:
    from mobilenetv2 import load_saved_model, preprocess_image

class AgeEstimator:
    """Class for face-based age estimation using the trained MobileNetV2 model"""
    
    def __init__(self, model_path=None):
        """
        Initialize the age estimator
        
        Args:
            model_path: Path to the saved model. If None, will look for the default path.
        """
        if model_path is None:
            # Default model path
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            model_path = os.path.join(base_dir, "model", "saved_model", "final_age_model.h5")
        
        self.model = None
        self.is_model_loaded = False
        self.age_groups = ["Child", "Teen", "Adult"]  # Default age groups
        self.model_path = model_path
    
    def load_model(self):
        """
        Load the model from disk
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            print(f"Loading model from {self.model_path}")
            self.model = load_saved_model(self.model_path)
            self.is_model_loaded = True
            print("Model loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.is_model_loaded = False
            return False
    
    def predict_age(self, image):
        """
        Predict age group from an image
        
        Args:
            image: Image as numpy array, file path, or byte stream
            
        Returns:
            dict: Prediction results with age group and confidence
        """
        if not self.is_model_loaded:
            return {"error": "Model not loaded. Call load_model() first."}
        
        try:
            # Preprocess the image
            processed_img = preprocess_image(image)
            
            # Make prediction
            predictions = self.model.predict(processed_img)[0]
            
            # Get the predicted class index and confidence
            pred_class_idx = np.argmax(predictions)
            confidence = float(predictions[pred_class_idx])
            age_group = self.age_groups[pred_class_idx]
            
            return {
                "success": True,
                "age_group": age_group,
                "confidence": confidence,
                "predictions": {group: float(pred) for group, pred in zip(self.age_groups, predictions)}
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def set_age_groups(self, age_groups):
        """
        Set custom age group labels
        
        Args:
            age_groups: List of age group labels
        """
        if len(age_groups) != len(self.age_groups):
            print(f"Warning: Expected {len(self.age_groups)} age groups, but got {len(age_groups)}")
        
        self.age_groups = age_groups
        print(f"Age groups set to: {self.age_groups}")

# For quick testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    
    estimator = AgeEstimator()
    if estimator.load_model():
        result = estimator.predict_age(image_path)
        print("Prediction result:", result)
    else:
        print("Failed to load model.")
