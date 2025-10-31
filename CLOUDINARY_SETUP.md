# Cloudinary Setup Guide for Railway Deployment

This app uses Cloudinary for image uploads when deployed to Railway (or any platform without Replit's object storage).

## Why Cloudinary?

- ✅ **Free tier**: 25GB storage, 25GB bandwidth/month
- ✅ **Automatic image optimization**: WebP conversion, quality optimization
- ✅ **Works everywhere**: Railway, Render, Vercel, anywhere!
- ✅ **Simple integration**: No complex setup required

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click **"Sign Up Free"**
3. Create your account (free tier is perfect for this app)

### 2. Get Your Credentials

After signing up:

1. Go to your **Dashboard** at [https://cloudinary.com/console](https://cloudinary.com/console)
2. You'll see three credentials:
   - **Cloud Name** (e.g., `dxg1u2qv3`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `AbCdEfGhIjKlMnOpQrStUvWx`)

### 3. Add to Railway

1. Go to your Railway project
2. Click on your **web service**
3. Go to the **"Variables"** tab
4. Add these three environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```
CLOUDINARY_CLOUD_NAME=dxg1u2qv3
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWx
```

5. Railway will **automatically redeploy** with Cloudinary enabled!

## How It Works

The app automatically detects which environment it's running in:

- **On Replit**: Uses Replit's built-in object storage (no setup needed)
- **On Railway**: Uses Cloudinary if configured
- **Anywhere else**: Uses Cloudinary if configured

### Image Organization

Images are organized in Cloudinary folders:
- `avatars/{userId}/` - User avatar images
- `messages/` - Message attachment images

## Testing

After deployment, test image uploads:

1. **Avatar Upload**:
   - Log in to your app
   - Go to profile settings
   - Click "Upload Image" tab
   - Upload a photo
   - Should work instantly!

2. **Message Images**:
   - Go to Messages
   - Select a conversation
   - Click the image icon
   - Upload a photo
   - Send the message

## Troubleshooting

### "Failed to get upload URL"

**Problem**: Cloudinary credentials not set correctly

**Solution**:
1. Check Railway environment variables
2. Make sure variable names match exactly:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. No spaces, quotes, or extra characters
4. Redeploy after adding variables

### Images not loading

**Problem**: Images uploaded but won't display

**Solution**:
1. Check browser console for errors
2. Verify the image URL in the database starts with `https://res.cloudinary.com/`
3. Check Cloudinary dashboard to confirm images are there

### "Upload failed" error

**Problem**: Network issue or invalid credentials

**Solution**:
1. Check Railway logs for detailed error
2. Verify API Secret is correct (it's case-sensitive!)
3. Make sure your Cloudinary account is active

## Free Tier Limits

Cloudinary free tier includes:
- **25 GB storage**
- **25 GB bandwidth/month**
- **Unlimited transformations**

For a family chore app, this is more than enough! Even with 10 users uploading avatars and sharing images, you'll likely use less than 1GB/month.

## Production Tips

1. **Monitor usage**: Check your Cloudinary dashboard monthly
2. **Image optimization**: Cloudinary automatically optimizes images (no extra work needed!)
3. **Backup**: Images are stored on Cloudinary's servers (backed up automatically)

## Security

- ✅ Signed uploads (can't be faked)
- ✅ Folder-based organization (clean structure)
- ✅ Automatic HTTPS (secure by default)
- ✅ Environment variables (secrets never in code)

## Need Help?

If something isn't working:
1. Check Railway logs: `railway logs`
2. Look for "Cloudinary" in the logs
3. You should see: `✅ Cloudinary is configured and ready`

If you see: `⚠️  Cloudinary not configured`, check your environment variables!

---

That's it! Your app now has professional image upload capabilities on Railway. 🎉
