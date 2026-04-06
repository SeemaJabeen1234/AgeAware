import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard
from tensorflow.keras.optimizers import Adam
from mobilenetv2 import create_age_model, fine_tune_model, save_model
import datetime
import shutil

def train_age_model(
    train_dir,
    validation_dir,
    batch_size=32,
    epochs=50,
    img_size=(224, 224),
    fine_tune_epochs=20,
    learning_rate=0.001,
    fine_tune_lr=0.0001
):
    """
    Train the age classification model
    
    Args:
        train_dir: Directory with training images
        validation_dir: Directory with validation images
        batch_size: Batch size for training
        epochs: Number of initial training epochs
        img_size: Size of input images
        fine_tune_epochs: Number of fine-tuning epochs
        
    Returns:
        Trained model and training history
    """
    print("Setting up data generators...")
    
    # Data augmentation for training - enhanced for better generalization
    train_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        rotation_range=30,            # More rotation
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.3,               # More zoom variation
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],  # Brightness variation
        fill_mode='nearest',
        validation_split=0.1          # Use 10% of training data for validation
    )
    
    # Only preprocessing for validation
    validation_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
    )
    
    # Load training data with train/validation split from the same directory
    # Only include the specific classes we want (child, teen, adult)
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        classes=['child', 'teen', 'adult'],
        subset='training',
        shuffle=True
    )
    
    # Create validation split from training data
    # Only include the specific classes we want (child, teen, adult)
    validation_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        classes=['child', 'teen', 'adult'],
        subset='validation',
        shuffle=True
    )
    
    # Also use the separate validation directory if provided and not empty
    test_generators = []
    if os.path.exists(validation_dir):
        # Check if the validation dir has the expected subdirectories
        class_dirs = [d for d in os.listdir(validation_dir) 
                      if os.path.isdir(os.path.join(validation_dir, d)) and not d.startswith('.')]
        
        if class_dirs:  # If valid class subdirectories exist
            test_generator = validation_datagen.flow_from_directory(
                validation_dir,
                target_size=img_size,
                batch_size=batch_size,
                class_mode='categorical',
                classes=['child', 'teen', 'adult'],
                shuffle=False
            )
            test_generators.append(test_generator)
    
    # We expect exactly 3 classes (child, teen, adult)
    expected_classes = ['child', 'teen', 'adult']
    num_classes = len(expected_classes)
    print(f"Using {num_classes} classes: {train_generator.class_indices}")
    
    # Verify that we have the expected classes
    if set(train_generator.class_indices.keys()) != set(expected_classes):
        print("Warning: The classes found don't match our expected classes.")
        print(f"Expected: {expected_classes}")
        print(f"Found: {list(train_generator.class_indices.keys())}")
    
    # Verify we have data in each class
    print(f"Training data distribution:")
    for class_name, class_index in train_generator.class_indices.items():
        class_samples = len(os.listdir(os.path.join(train_dir, class_name)))
        print(f"  - {class_name}: {class_samples} images")
        
    # Confirm the generators are valid
    if len(train_generator.filenames) == 0:
        raise ValueError("No training images found. Please check your dataset structure.")
        
    print(f"Total training images: {len(train_generator.filenames)}")
    print(f"Total validation images: {len(validation_generator.filenames)}")
    
    # Always create model with exactly 3 classes for our use case
    model = create_age_model(
        input_shape=(*img_size, 3), 
        num_classes=3,      # Fixed number of classes: Child, Teen, Adult
        dropout_rate=0.4,   # Increase dropout for better regularization
        l2_reg=0.001        # Add L2 regularization
    )
    print("Model created with 3 output classes.")
    
    # Compile with optimized parameters
    optimizer = Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    # Create directories for saving models if they don't exist
    os.makedirs(os.path.join("model", "saved_model"), exist_ok=True)
    
    # Set up enhanced callbacks
    checkpoint_path = os.path.join("model", "saved_model", "checkpoint_{epoch:02d}_{val_accuracy:.4f}.h5")
    log_dir = os.path.join("model", "logs", datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
    os.makedirs(log_dir, exist_ok=True)
    
    callbacks = [
        ModelCheckpoint(
            checkpoint_path,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=15,           # More patience to avoid early stopping
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,            # More aggressive learning rate reduction
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        TensorBoard(
            log_dir=log_dir,
            histogram_freq=1,
            write_graph=True,
            update_freq='epoch'
        )
    ]
    
    # Class weights to handle class imbalance - only consider child, teen, adult
    class_weights = {}
    specified_classes = ['child', 'teen', 'adult']
    total_samples = sum(len([f for f in os.listdir(os.path.join(train_dir, class_name)) 
                           if os.path.isfile(os.path.join(train_dir, class_name, f)) and
                           f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.heic'))]) 
                        for class_name in specified_classes)
    
    print(f"Total samples across all classes: {total_samples}")
    
    for class_name, class_index in train_generator.class_indices.items():
        class_samples = len([f for f in os.listdir(os.path.join(train_dir, class_name)) 
                            if os.path.isfile(os.path.join(train_dir, class_name, f)) and
                            f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.heic'))])
        print(f"Class {class_name}: {class_samples} valid image files")
        if class_samples > 0:  # Avoid division by zero
            weight = (1.0 / class_samples) * (total_samples / len(specified_classes))
            class_weights[class_index] = min(weight * 1.5, 5.0)  # Lower the cap for more stability
    
    print(f"Using class weights: {class_weights}")
    
    # Initial training with frozen base model
    print("Starting initial training phase...")
    history = model.fit(
        train_generator,
        steps_per_epoch=len(train_generator),
        epochs=epochs,
        validation_data=validation_generator,
        validation_steps=len(validation_generator),
        callbacks=callbacks,
        class_weight=class_weights
    )
    
    # Fine-tuning phase with unfreezing more layers gradually
    print("Starting fine-tuning phase...")
    model = fine_tune_model(model, num_layers_to_unfreeze=20)  # Unfreeze more layers
    
    # Recompile with lower learning rate for fine-tuning
    model.compile(
        optimizer=Adam(learning_rate=fine_tune_lr),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    # Train with fine-tuning
    fine_tune_history = model.fit(
        train_generator,
        steps_per_epoch=len(train_generator),
        epochs=fine_tune_epochs,
        validation_data=validation_generator,
        validation_steps=len(validation_generator),
        callbacks=callbacks,
        class_weight=class_weights
    )
    
    # Evaluate on test data if available
    if test_generators:
        print("Evaluating on separate test data...")
        for i, test_gen in enumerate(test_generators):
            test_loss, test_acc, test_precision, test_recall = model.evaluate(
                test_gen,
                steps=len(test_gen)
            )
            print(f"Test dataset {i+1}:")
            print(f"  - Loss: {test_loss:.4f}")
            print(f"  - Accuracy: {test_acc:.4f}")
            print(f"  - Precision: {test_precision:.4f}")
            print(f"  - Recall: {test_recall:.4f}")
    
    # Save the final model
    model_save_path = os.path.join("model", "saved_model", "final_age_model.h5")
    save_model(model, model_save_path)
    
    return model, history, fine_tune_history

if __name__ == "__main__":
    # Set paths to datasets - using the new structure with 3 categories
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    train_dir = os.path.join(base_dir, "datasets", "train")
    test_dir = os.path.join(base_dir, "datasets", "test")
    
    # Check if directories exist
    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Training directory {train_dir} not found")
    if not os.path.exists(test_dir):
        raise FileNotFoundError(f"Test directory {test_dir} not found")
    
    # Verify class directories exist and have images
    expected_classes = ['child', 'teen', 'adult']
    for class_name in expected_classes:
        train_class_dir = os.path.join(train_dir, class_name)
        test_class_dir = os.path.join(test_dir, class_name)
        
        if not os.path.exists(train_class_dir):
            print(f"Warning: Training directory for class '{class_name}' not found: {train_class_dir}")
        else:
            files = [f for f in os.listdir(train_class_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.heic'))]
            print(f"Class '{class_name}' training images: {len(files)}")
            
        if not os.path.exists(test_class_dir):
            print(f"Warning: Test directory for class '{class_name}' not found: {test_class_dir}")
        else:
            files = [f for f in os.listdir(test_class_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.heic'))]
            print(f"Class '{class_name}' test images: {len(files)}")
    
    # Print dataset info
    print(f"Training data directory: {train_dir}")
    print(f"Test data directory: {test_dir}")
    
    try:
        # Train model with improved parameters
        model, history, ft_history = train_age_model(
            train_dir=train_dir,
            validation_dir=test_dir,
            batch_size=8,             # Smaller batch size for better generalization
            epochs=50,                # More epochs for initial training
            fine_tune_epochs=25,      # More epochs for fine-tuning
            learning_rate=0.0005,     # Lower initial learning rate
            fine_tune_lr=0.00005      # Lower fine-tuning learning rate
        )
    except Exception as e:
        print(f"Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("Training completed successfully!")
    
    # Save the final model to the standard path
    model_save_path = os.path.join(base_dir, "model", "saved_model", "final_age_model.h5")
    try:
        model.save(model_save_path)
        print(f"Model saved to {model_save_path}")
    except Exception as e:
        print(f"Error saving model: {str(e)}")
        
    # Print final accuracy metrics
    print("Final training accuracy metrics:")
    print(f"Training accuracy: {history.history['accuracy'][-1]:.4f}")
    print(f"Validation accuracy: {history.history['val_accuracy'][-1]:.4f}")
    
    print("Fine-tuning accuracy metrics:")
    print(f"Training accuracy: {ft_history.history['accuracy'][-1]:.4f}")
    print(f"Validation accuracy: {ft_history.history['val_accuracy'][-1]:.4f}")
