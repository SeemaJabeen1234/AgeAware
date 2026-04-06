# Age-Aware AI Backend

This directory contains the Python backend for the Age-Aware Screen Time Regulator app, featuring a deep learning model for face-based age estimation.

## 📋 Overview

The backend serves two primary purposes:

1. **Age Detection Model**: Provides a TensorFlow/Keras implementation of MobileNetV2 for age group classification
2. **API Server**: Exposes endpoints for the React Native frontend to interact with the model

## 🧠 Model Architecture

- Base: **MobileNetV2** (transfer learning from ImageNet weights)
- Custom Classification Head:
  - Global Average Pooling
  - Dense layers (512 → 128 → 3)
  - Dropout layers for regularization
- Output: 3 classes representing age groups (Child, Teen, Adult)

## 🔍 Model Training

The model is trained on the provided dataset in the `/datasets` directory:
- **Train**: Data for training the model
- **Test**: Data for validation and testing

To train the model:

```bash
python model/train.py
```

This will:
1. Load and preprocess training and validation data
2. Create the MobileNetV2-based model
3. Train the initial model with frozen base layers
4. Fine-tune the model by unfreezing top layers
5. Save the trained model to `model/saved_model/final_age_model.h5`

## 🚀 API Server

The FastAPI server provides endpoints for:

1. **Model Status**: Check if the model is loaded and ready
2. **Age Prediction**: Analyze an image and predict the age group

### Endpoints

- **GET** `/model-status`: Returns the current status of the model
  ```json
  {
    "model_loaded": true,
    "status": "ready"
  }
  ```

- **POST** `/predict-age`: Predicts age group from a base64-encoded image
  - Request:
    ```json
    {
      "image_base64": "<base64_encoded_image>",
      "detect_face": true
    }
    ```
  - Response:
    ```json
    {
      "age_group": "Teen",
      "confidence": 0.92,
      "predictions": {
        "Child": 0.05,
        "Teen": 0.92,
        "Adult": 0.03
      }
    }
    ```

## 📦 Dependencies

All required packages are listed in `requirements.txt`:

- TensorFlow 2.8+
- NumPy
- Pillow
- FastAPI
- Uvicorn
- OpenCV-Python
- scikit-image

## 🛠️ Setup & Running

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the API server:
   ```bash
   cd api
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

## 🔒 Privacy & Security

- The API server processes images in memory and does not store them
- No facial image data is retained after processing
- Only the predicted age group is returned to the frontend
- The model runs on-device and does not send data to external servers

## 📋 Technical Notes

1. **Image Processing**:
   - Images are resized to 224x224 pixels
   - Preprocessing matches MobileNetV2 requirements
   - Face detection is optional and can be toggled with the `detect_face` parameter

2. **Performance**:
   - Model is optimized for mobile-friendly inference
   - Batch predictions are supported for efficiency
   - API response times are typically under 200ms on modern devices

3. **Error Handling**:
   - Proper error handling for invalid images
   - Status codes and descriptive messages for troubleshooting
   - Automatic model reloading if errors occur

## 🚧 Limitations

- Accuracy is dependent on lighting conditions and image quality
- Age estimation is grouped into broad categories rather than specific ages
- Face detection works best with frontal faces in good lighting
