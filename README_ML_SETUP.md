# Anime Character Recognition - Local ML Setup

Your app now uses **browser-based deep learning models** that run entirely offline! This means:
- ✅ No external API dependencies
- ✅ Works offline once models are cached
- ✅ Complete control over your models
- ✅ No rate limits or costs

## 🚀 Quick Start

### Step 1: Add Character Data

Open `src/lib/ml-models.ts` and populate the `characterKnowledgeBase` with your anime character data:

```typescript
export const characterKnowledgeBase: Record<string, AnimeCharacterKnowledge> = {
  "Naruto Uzumaki": {
    name: "Naruto Uzumaki",
    anime: "Naruto",
    description: "A young ninja who dreams of becoming the Hokage of his village",
    relatedCharacters: ["Sasuke Uchiha", "Sakura Haruno", "Kakashi Hatake"],
    appearances: ["Naruto", "Naruto Shippuden", "Boruto"],
    streamingPlatforms: [
      { name: "Crunchyroll", url: "https://crunchyroll.com/naruto" },
      { name: "Netflix", url: "https://netflix.com" }
    ]
  },
  // Add more characters...
};
```

### Step 2: Test with Default Models

The app uses pre-trained models by default:
- **Character Recognition**: Vision Transformer (ViT)
- **Embeddings**: MiniLM for similarity calculations

Run the app and upload an anime image to test!

### Step 3: Train Your Own Models (Optional)

For better accuracy, train custom models on your laptop. See `TRAINING_GUIDE.md` for detailed instructions.

## 📁 Project Structure

```
src/lib/
├── ml-models.ts           # Model loading & character database
├── local-inference.ts     # Main inference pipeline
```

## 🎯 How It Works

1. **Image Upload** → Browser loads image
2. **Character Recognition** → Vision model identifies characters
3. **Knowledge Lookup** → Fetches character details from knowledge base
4. **Similarity Analysis** → Calculates embeddings and cosine similarity
5. **Recommendations** → Generates personalized suggestions

## 🔧 Customization Options

### Use Your Trained Models

1. Train your models (see `TRAINING_GUIDE.md`)
2. Convert to ONNX format
3. Place in `public/models/` directory
4. Update paths in `src/lib/ml-models.ts`:

```typescript
const MODEL_PATHS = {
  characterRecognition: '/models/your-custom-model',
  embeddings: '/models/your-embedding-model',
};
```

### Load Models from External URLs

```typescript
const MODEL_PATHS = {
  characterRecognition: 'https://your-cdn.com/models/character-recognition',
  embeddings: 'Xenova/all-MiniLM-L6-v2', // Or any HuggingFace model
};
```

## 🎮 Performance Tips

### GPU Acceleration
The models automatically use WebGPU if available:
```typescript
{ device: 'webgpu' } // Falls back to CPU if WebGPU unavailable
```

### Model Caching
Models are cached in browser after first load. Clear cache to reload:
```typescript
env.useBrowserCache = true; // Enable caching
```

### Model Size
- Default models: ~50MB total
- Custom models: Recommend <100MB for browser use
- Use quantization to reduce size (see training guide)

## 📊 Expected Performance

| Task | Time (WebGPU) | Time (CPU) |
|------|---------------|------------|
| Character Recognition | 1-2s | 5-10s |
| Embeddings | <1s | 2-3s |
| Full Analysis | 3-5s | 10-20s |

## 🐛 Troubleshooting

### "No characters found"
- Make sure you've added character data to `characterKnowledgeBase`
- The default vision model may not recognize anime characters well
- Train a custom model on anime datasets for better accuracy

### "Model loading failed"
- Check browser console for detailed errors
- Ensure you have enough memory (models need ~500MB RAM)
- Try using CPU instead of WebGPU

### Slow performance
- Use WebGPU-enabled browser (Chrome, Edge)
- Reduce image size before upload
- Use quantized models

## 🎓 Training Your Own Models

See `TRAINING_GUIDE.md` for:
- Dataset preparation
- Training scripts for PyTorch/TensorFlow
- Model conversion to ONNX
- Performance optimization

## 🌐 Deployment

### Hosting Models
- Place models in `public/models/` for bundling
- Or host on CDN for faster loading
- Vercel/Netlify automatically serve public files

### Build Size
- Models in `public/` increase bundle size
- Consider hosting large models externally
- Use lazy loading for better initial load times

## 💡 Next Steps

1. ✅ Add your character data to knowledge base
2. ✅ Test with default models
3. 📚 Collect anime character datasets
4. 🔨 Train custom models for better accuracy
5. 🚀 Deploy your app

## 📚 Resources

- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)
- [ONNX Runtime](https://onnxruntime.ai/)
- [WebGPU Support](https://caniuse.com/webgpu)

Happy training! 🎉
