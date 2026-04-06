import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.regularizers import l2

def create_age_model(input_shape=(224, 224, 3), num_classes=3, dropout_rate=0.3, l2_reg=0.0):
    """
    Creates a MobileNetV2-based model for age classification
    
    Args:
        input_shape: Input shape of the images (default: 224x224x3)
        num_classes: Number of age groups (default: 3 - Child, Teen, Adult)
        
    Returns:
        A compiled Keras model
    """
    # Use MobileNetV2 as the base model
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=input_shape
    )
    
    # Freeze the base model layers
    for layer in base_model.layers:
        layer.trainable = False
    
    # Add custom classification head with regularization and improved architecture
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    
    # First dense block with regularization
    x = Dense(512, activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = Dropout(dropout_rate)(x)
    
    # Second dense block with regularization
    x = Dense(256, activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = Dropout(dropout_rate * 0.8)(x)
    
    # Third dense block with regularization
    x = Dense(128, activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = Dropout(dropout_rate * 0.6)(x)
    
    # Final layer with softmax activation for multi-class classification
    predictions = Dense(num_classes, activation='softmax', kernel_regularizer=l2(l2_reg))(x)
    
    # Create the full model
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Compile the model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def fine_tune_model(model, num_layers_to_unfreeze=10):
    """
    Fine-tunes a pre-trained model by unfreezing some top layers
    
    Args:
        model: The pre-trained model
        num_layers_to_unfreeze: Number of top layers to unfreeze for fine-tuning
        
    Returns:
        The fine-tuned model
    """
    # Unfreeze the top layers for fine-tuning
    for layer in model.layers[-num_layers_to_unfreeze:]:
        layer.trainable = True
    
    # Recompile with a lower learning rate for fine-tuning
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def preprocess_image(img_path, target_size=(224, 224)):
    """
    Preprocess an image for the model
    
    Args:
        img_path: Path to the image file or image array
        target_size: Target size for the image (default: 224x224)
        
    Returns:
        Preprocessed image array ready for model input
    """
    if isinstance(img_path, str):
        img = tf.keras.preprocessing.image.load_img(img_path, target_size=target_size)
        img_array = tf.keras.preprocessing.image.img_to_array(img)
    else:
        # Assuming img_path is already an image array
        img_array = tf.image.resize(img_path, target_size)
    
    # Expand dimensions and preprocess for MobileNetV2
    img_array = tf.expand_dims(img_array, 0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    
    return img_array

def load_saved_model(model_path):
    """
    Load a saved model from disk
    
    Args:
        model_path: Path to the saved model
        
    Returns:
        The loaded model
    """
    return tf.keras.models.load_model(model_path)

def save_model(model, save_path):
    """
    Save the model to disk
    
    Args:
        model: The model to save
        save_path: Path where to save the model
    """
    model.save(save_path)
    print(f"Model saved to {save_path}")
