# Age-Aware AI Screen Time Regulator

A production-grade React Native CLI mobile application that uses AI-powered face recognition and age estimation to automatically enforce age-appropriate screen time limits for children, teens, and adults.

![Age-Aware Banner](./docs/banner.png)

## 📱 Features

- **AI-Powered Age Detection**: Uses MobileNetV2 to detect user age group (Child/Teen/Adult)
- **Automatic Screen Time Management**: Enforces age-appropriate screen time limits
- **App Usage Tracking**: Monitors and displays detailed app usage statistics
- **Full Device Locking**: Locks the entire phone when screen time expires
- **Parent Mode**: Protected by secure PIN for parental control
- **Beautiful UI/UX**: Modern interface with smooth animations and transitions
- **Privacy-Focused**: All processing done on-device, no images stored
- **Background Monitoring**: Continues tracking even when app is closed

## 🏗️ Project Architecture

The project follows a modern, scalable architecture split into two main components:

### 1. Frontend (React Native CLI)

- **React Navigation**: For seamless screen transitions
- **Context API**: For state management across the app
- **React Native Reanimated**: For smooth, performant animations
- **Native Modules**: Custom Android implementations for device-level functionality

### 2. Backend (Python)

- **TensorFlow/Keras**: For deep learning model implementation
- **MobileNetV2**: Optimized for mobile devices
- **FastAPI**: For serving model predictions via API
- **Face Detection**: Built into the model pipeline

## 📂 Project Structure

```
age-aware-screen-time/
│
├── frontend/                # React Native CLI app
│   ├── android/             # Android native code
│   ├── ios/                 # iOS configuration
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── components/      # Reusable UI components
│   │   ├── navigation/      # Navigation configuration
│   │   ├── services/        # Services for native functionality
│   │   ├── context/         # State management
│   │   ├── animations/      # Animation files
│   │   ├── theme/           # UI theme configuration
│   │   └── utils/           # Helper functions
│   └── App.js               # Root component
│
└── backend/                 # Python deep learning backend
    ├── datasets/            # Training and test data
    ├── model/               # Deep learning model files
    │   ├── mobilenetv2.py
    │   ├── train.py
    │   ├── predict.py
    │   └── saved_model/
    ├── api/                 # FastAPI implementation
    │   └── app.py
    └── requirements.txt
```

## 🚀 Installation

### Prerequisites

- Node.js v14+
- Python 3.8+
- React Native CLI
- Android Studio
- TensorFlow 2.8+

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/age-aware-screen-time.git
cd age-aware-screen-time/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Install native module dependencies:
```bash
cd android
./gradlew clean
```

4. Start the React Native app:
```bash
cd ..
npx react-native run-android
```

### Backend Setup

1. Set up a Python virtual environment:
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Train the model (optional - pre-trained model included):
```bash
python model/train.py
```

4. Start the FastAPI server:
```bash
cd api
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 📱 App Flow

1. **Splash Screen**: Animated logo and app name fade-in (5s)
2. **Permissions Screen**: Request necessary Android permissions
3. **Model Loading Screen**: Load AI model with progress animation
4. **Face Detection & Age Verification**: Detect user's age group
5. **Home Dashboard**: Display remaining screen time and usage stats
6. **App Usage Screen**: Visualize app usage with charts and statistics
7. **Settings Screen**: Configure screen time limits and app preferences
8. **Lock Screen**: Appears when screen time expires, requiring parent PIN

## 🧠 Technical Implementation

### AI/Deep Learning

- **Architecture**: MobileNetV2 with custom classification head
- **Input**: Face images from device camera (224x224)
- **Output**: Age group classification (Child/Teen/Adult)
- **Training**: Transfer learning from ImageNet weights
- **Performance**: Optimized for mobile inference

### Android Native Modules

- **UsageStatsModule**: Tracks app usage through Android's UsageStatsManager
- **PermissionsModule**: Manages advanced Android permissions
- **DeviceAdminModule**: Handles device administrator features for locking
- **AccessibilityModule**: Controls accessibility services for monitoring

### Background Services

- **ForegroundService**: Maintains app functionality in background
- **UsageMonitor**: Periodically checks app usage statistics
- **TimeTracker**: Tracks remaining screen time
- **LockScreenService**: Displays overlay when time expires

## 🔒 Privacy & Security

- All face detection and age estimation happens on-device
- No images are stored or transmitted to external servers
- Parent PIN is securely encrypted using device-specific keys
- Usage statistics are stored only locally on the device
- Clear privacy policy and permission explanations

## 🛠️ Future Enhancements

- Sync settings across multiple devices
- Machine learning model improvements for better age accuracy
- Additional parental controls (app-specific restrictions)
- Gamification of healthy screen time habits
- iOS version with equivalent functionality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

Developed as a final-year/capstone project for demonstrating advanced mobile development and AI integration skills.
