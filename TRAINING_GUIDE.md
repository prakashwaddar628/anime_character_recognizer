# Training Your Own Anime Character Recognition Models

This guide will help you train custom deep learning models on your laptop for anime character recognition.

## Overview

You'll need to train three types of models:

1. **Character Recognition Model** (Vision Transformer)
2. **Character Embedding Model** (Sentence Transformer)
3. **Character Image Generator** (Optional - Diffusion Model)

## Prerequisites

- Python 3.8+
- PyTorch or TensorFlow
- GPU recommended (NVIDIA with CUDA)
- Datasets of anime characters

## 1. Character Recognition Model

### Dataset Collection
- Collect images of anime characters (10,000+ images recommended)
- Organize by character name: `dataset/Naruto_Uzumaki/image1.jpg`
- Include multiple angles, expressions, and scenes

### Training Script (PyTorch)

```python
import torch
from transformers import ViTForImageClassification, ViTImageProcessor, Trainer, TrainingArguments
from datasets import load_dataset

# Load your dataset
dataset = load_dataset("imagefolder", data_dir="./anime_characters")

# Load pre-trained model
model_name = "google/vit-base-patch16-224"
processor = ViTImageProcessor.from_pretrained(model_name)
model = ViTForImageClassification.from_pretrained(
    model_name,
    num_labels=len(dataset["train"].features["label"].names),
    ignore_mismatched_sizes=True
)

# Training arguments
training_args = TrainingArguments(
    output_dir="./anime_character_model",
    per_device_train_batch_size=16,
    num_train_epochs=10,
    save_steps=500,
    evaluation_strategy="steps",
    learning_rate=5e-5,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
)

trainer.train()

# Export to ONNX for browser use
torch.onnx.export(
    model,
    dummy_input,
    "anime_character_model.onnx",
    export_params=True,
    opset_version=14,
)
```

### Convert to Transformers.js Format

```bash
# Install transformers.js CLI
npm install -g @huggingface/transformers

# Convert your model
transformers-convert --model_path ./anime_character_model --output_dir ./converted_model
```

## 2. Character Embedding Model

### Dataset for Embeddings
- Create pairs of character descriptions
- Format: `{"text": "Naruto is a ninja...", "label": "Naruto_Uzumaki"}`

### Training Script

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# Load base model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Prepare training data
train_examples = [
    InputExample(texts=['Character 1 description', 'Similar character description'], label=1.0),
    InputExample(texts=['Character 1 description', 'Different character description'], label=0.0),
]

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
train_loss = losses.CosineSimilarityLoss(model)

# Train
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=10,
    warmup_steps=100,
)

# Save
model.save('./anime_embedding_model')
```

## 3. Image Generation Model (Optional)

For generating character images, you can:
1. Fine-tune Stable Diffusion on anime characters
2. Train a custom GAN
3. Use a pre-trained anime model

### Fine-tune Stable Diffusion

```python
# This requires significant GPU resources
# Consider using Google Colab or cloud GPU

from diffusers import StableDiffusionPipeline
import torch

model_id = "runwayml/stable-diffusion-v1-5"
pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)

# Fine-tune on your anime dataset
# See: https://github.com/huggingface/diffusers/tree/main/examples/text_to_image
```

## 4. Create Character Knowledge Base

Create a JSON file with character information:

```json
{
  "Naruto_Uzumaki": {
    "name": "Naruto Uzumaki",
    "anime": "Naruto",
    "description": "A young ninja with dreams of becoming Hokage...",
    "relatedCharacters": ["Sasuke_Uchiha", "Sakura_Haruno"],
    "appearances": ["Naruto", "Naruto Shippuden", "Boruto"],
    "streamingPlatforms": [
      {"name": "Crunchyroll", "url": "https://crunchyroll.com/naruto"}
    ]
  }
}
```

## 5. Integrate Models into Your App

### Place Your Trained Models

1. Convert models to ONNX format
2. Place in `public/models/` directory
3. Update `src/lib/ml-models.ts`:

```typescript
const MODEL_PATHS = {
  characterRecognition: '/models/anime_character_model',
  embeddings: '/models/anime_embedding_model',
};
```

### Load Custom Knowledge Base

Update `src/lib/ml-models.ts`:

```typescript
import characterData from './character_knowledge.json';

export const characterKnowledgeBase = characterData;
```

## 6. Performance Optimization

### Model Size
- Use quantization to reduce model size
- Target: <100MB for browser deployment

```python
# Quantize with ONNX
from onnxruntime.quantization import quantize_dynamic

quantize_dynamic(
    "anime_character_model.onnx",
    "anime_character_model_quantized.onnx",
    weight_type=QuantType.QUInt8
)
```

### Caching
- Models are cached in browser after first load
- Enable service workers for offline support

## 7. Testing Your Models

```bash
# Run local development server
npm run dev

# Test with sample images
# Check browser console for model loading progress
```

## Resources

- **Datasets**: 
  - [Danbooru](https://www.gwern.net/Danbooru2021)
  - [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/)
  
- **Pre-trained Anime Models**:
  - [Anime Face Dataset](https://github.com/bchao1/Anime-Face-Dataset)
  - [AnimeFace Character Dataset](https://www.kaggle.com/datasets/soumikrakshit/anime-faces)

- **Training Resources**:
  - [Hugging Face Transformers](https://huggingface.co/docs/transformers)
  - [Sentence Transformers](https://www.sbert.net/)
  - [ONNX Runtime](https://onnxruntime.ai/)

## Estimated Training Times (on GTX 3080)

- Character Recognition: 4-8 hours (10k images)
- Embeddings: 2-4 hours (5k character descriptions)
- Image Generation: 12-24 hours (fine-tuning)

## Need Help?

Check out the community forums or create an issue on the project repository.
