import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  Film,
  Image,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  FileVideo
} from 'lucide-react';
import { videoApi } from '../api/videoApi.js';

export const UploadPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      // Auto populate title from filename if title is empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file to upload.');
      return;
    }
    if (!thumbnailFile) {
      setError('Please provide a video thumbnail.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setIsProcessing(false);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('videoFile', videoFile);
      formData.append('thumbnail', thumbnailFile);

      const res = await videoApi.publishVideo(formData, (percent) => {
        setProgress(percent);
        if (percent >= 100) {
          setIsProcessing(true);
        }
      });

      const data = res?.data;
      setUploadedVideo(data);
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(
        err.response?.data?.message ||
          'Failed to upload video. Please ensure the file is valid and within size limits.'
      );
    } finally {
      setUploading(false);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setUploadedVideo(null);
    setProgress(0);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <UploadCloud className="w-7 h-7 text-blue-500" />
          <span>Vidora Upload Studio</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Publish your video to Vidora with high-definition streaming and custom thumbnails.
        </p>
      </div>

      {/* Success Banner */}
      {uploadedVideo ? (
        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Video Published Successfully!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              "{uploadedVideo.title}" is now live and ready for your audience.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to={`/watch/${uploadedVideo._id}`}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Watch Video</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#162033] hover:bg-[#1E293B] border border-[#1E293B] transition-all"
            >
              Upload Another Video
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Video File Dropzone */}
            <div
              onClick={() => !uploading && videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                videoFile
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-[#1E293B] hover:border-slate-600 bg-[#111827]/70 hover:bg-[#111827]'
              }`}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                disabled={uploading}
                className="hidden"
              />

              {videoFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-white max-w-[220px] truncate mx-auto">
                    {videoFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <span className="inline-block text-[10px] text-blue-400 font-semibold underline mt-1">
                    Change file
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[#162033] text-slate-400 flex items-center justify-center mx-auto">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    Select or drag video file
                  </div>
                  <p className="text-[11px] text-slate-400">MP4, WebM, MOV up to 100MB</p>
                </div>
              )}
            </div>

            {/* Thumbnail Dropzone */}
            <div
              onClick={() => !uploading && thumbInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] relative overflow-hidden ${
                thumbnailPreview
                  ? 'border-indigo-500/50 bg-[#111827]'
                  : 'border-[#1E293B] hover:border-slate-600 bg-[#111827]/70 hover:bg-[#111827]'
              }`}
            >
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                disabled={uploading}
                className="hidden"
              />

              {thumbnailPreview ? (
                <div className="relative w-full h-full aspect-video rounded-xl overflow-hidden group">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white">
                    Change Thumbnail
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[#162033] text-slate-400 flex items-center justify-center mx-auto">
                    <Image className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    Select video thumbnail
                  </div>
                  <p className="text-[11px] text-slate-400">16:9 ratio, JPG or PNG</p>
                </div>
              )}
            </div>
          </div>

          {/* Video Metadata Inputs */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Video Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={uploading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a compelling title..."
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                disabled={uploading}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video, links, timestamps, and hashtags..."
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Live Progress Bar Section */}
          {uploading && (
            <div className="bg-[#111827] border border-blue-500/30 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isProcessing
                    ? 'Processing on Cloudinary & creating video record...'
                    : `Uploading video to server...`}
                </span>
                <span className="font-bold text-blue-400">{progress}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2.5 bg-[#162033] rounded-full overflow-hidden p-0.5 border border-[#1E293B]">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>
                  Please keep this tab open until upload and processing complete.
                </span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => navigate('/studio')}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading || !videoFile || !thumbnailFile || !title.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Publish Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
