import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trash2, Edit2, Image as ImageIcon, Plus, X, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import styles from './CommitteeFeed.module.css';

interface ArchivePost {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

export function CommitteeFeed() {
  const [posts, setPosts] = useState<ArchivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const { user, role } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPost = role === 'admin' || role === 'committee';

  const fetchPosts = async () => {
    try {
      const data = await ApiClient.get<ArchivePost[]>('/archives');
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      
      const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    try {
      if (editingPostId) {
        // Editing text only for simplicity in this version
        await ApiClient.put(`/archives/${editingPostId}`, { content });
        toast('Post updated successfully', 'success');
      } else {
        const formData = new FormData();
        formData.append('content', content);
        files.forEach(file => {
          formData.append('images', file);
        });

        await ApiClient.post('/archives', formData);
        toast('Post created successfully', 'success');
      }
      
      setIsModalOpen(false);
      setContent('');
      setFiles([]);
      setPreviewUrls([]);
      setEditingPostId(null);
      fetchPosts();
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to save post', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await ApiClient.delete(`/archives/${id}`);
      toast('Post deleted', 'success');
      fetchPosts();
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to delete post', 'error');
    }
  };

  const openEdit = (post: ArchivePost) => {
    setEditingPostId(post.id);
    setContent(post.content);
    setFiles([]);
    setPreviewUrls([]); // We don't support editing images in this simple version
    setIsModalOpen(true);
  };

  if (loading) return <div className={styles.loading}>Loading archives...</div>;

  return (
    <section className={styles.feedSection}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Committee Updates & Archives</h2>
          <p className={styles.subtitle}>Official updates, photos, and announcements from the committee.</p>
        </div>
        {canPost && (
          <button className={styles.createBtn} onClick={() => {
            setEditingPostId(null);
            setContent('');
            setFiles([]);
            setPreviewUrls([]);
            setIsModalOpen(true);
          }}>
            <Plus size={16} /> New Post
          </button>
        )}
      </div>

      <div className={styles.postGrid}>
        {posts.length === 0 ? (
          <div className={styles.emptyState}>No archive posts yet.</div>
        ) : (
          posts.map(post => {
            const canEdit = post.author_id === user?.id || role === 'admin';
            return (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postHeader}>
                  <div className={styles.authorInfo}>
                    <div className={styles.authorAvatar}>
                      {post.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className={styles.authorName}>{post.author_name}</div>
                      <div className={styles.postDate}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className={styles.postActions}>
                      <button onClick={() => openEdit(post)} className={styles.iconBtn} title="Edit Text">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Delete Post">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {post.content && <p className={styles.postContent}>{post.content}</p>}
                
                {post.images && post.images.length > 0 && (
                  <div className={styles.imageGrid} data-count={post.images.length}>
                    {post.images.map((img, idx) => (
                      <div key={idx} className={styles.imageWrapper}>
                        <img src={img} alt={`Archive ${idx}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingPostId ? 'Edit Post Text' : 'Create Archive Post'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <textarea
                className={styles.textarea}
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              
              {!editingPostId && (
                <div className={styles.uploadSection}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} /> Add Images
                  </button>
                  
                  {previewUrls.length > 0 && (
                    <div className={styles.previewGrid}>
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className={styles.previewItem}>
                          <img src={url} alt="Preview" />
                          <button type="button" onClick={() => removeFile(idx)} className={styles.removeFileBtn}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={!content.trim() && files.length === 0}>
                  {editingPostId ? 'Save Changes' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
