'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ApiClient } from '@/lib/api';
import { ArchivePost } from '@/types';
import styles from './ArchivesPage.module.css';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

// ============================================================
// Image Lightbox
// ============================================================
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <button className={styles.lightboxClose} onClick={onClose}><X size={24} /></button>
      <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[current]} alt={`Image ${current + 1}`} className={styles.lightboxImg} />
        {images.length > 1 && (
          <>
            <button className={`${styles.lightboxNav} ${styles.lightboxNavLeft}`}
              onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}>
              <ChevronLeft size={28} />
            </button>
            <button className={`${styles.lightboxNav} ${styles.lightboxNavRight}`}
              onClick={() => setCurrent(c => (c + 1) % images.length)}>
              <ChevronRight size={28} />
            </button>
            <div className={styles.lightboxCounter}>{current + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Post Card
// ============================================================
function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
}: {
  post: ArchivePost;
  currentUserId?: string;
  onEdit: (post: ArchivePost) => void;
  onDelete: (post: ArchivePost) => void;
}) {
  const isAuthor = currentUserId === post.author_id;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const images = post.image_urls ?? [];
  const hasImages = images.length > 0;

  // Fire view tracking once on mount (idempotent on server side)
  useEffect(() => {
    ApiClient.post(`/archives/${post.id}/view`, {}).catch(() => {/* non-fatal */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  return (
    <article className={styles.postCard}>
      {/* Author header */}
      <div className={styles.postHeader}>
        <div className={styles.authorAvatar}>
          {post.author_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author_photo} alt={post.author_name} />
          ) : (
            <span className={styles.authorInitial}>
              {(post.author_name ?? 'C').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className={styles.authorMeta}>
          <span className={styles.authorName}>{post.author_name ?? 'Committee Member'}</span>
          <div className={styles.postMetaRow}>
            <span className={styles.postDate}>{formattedDate}</span>
            {isAuthor && typeof post.view_count === 'number' && (
              <span className={styles.viewCount}>
                <Eye size={12} />
                {post.view_count} {post.view_count === 1 ? 'view' : 'views'}
              </span>
            )}
          </div>
        </div>
        {isAuthor && (
          <div className={styles.postActions}>
            <button
              className={styles.actionBtn}
              title="Edit post"
              onClick={() => onEdit(post)}
            >
              <Edit2 size={15} />
              <span>Edit</span>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              title="Delete post"
              onClick={() => onDelete(post)}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className={styles.postContent}>{post.content}</p>
      )}

      {/* Image grid */}
      {hasImages && (
        <div className={styles.imageGrid} data-count={Math.min(images.length, 4)}>
          {images.slice(0, 4).map((url, i) => (
            <button
              key={url}
              className={styles.imageGridItem}
              onClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Post image ${i + 1}`} loading="lazy" />
              {i === 3 && images.length > 4 && (
                <div className={styles.imageGridOverlay}>+{images.length - 4}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}

// ============================================================
// Create / Edit Modal
// ============================================================
function PostModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ArchivePost | null;
  onClose: () => void;
  onSaved: (post: ArchivePost) => void;
}) {
  const { token } = useAuth();
  const isEdit = !!initial;
  const [content, setContent] = useState(initial?.content ?? '');
  const [existingUrls, setExistingUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Build previews for newly selected files
  useEffect(() => {
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [newFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const allowed = selected.filter(f => f.type.startsWith('image/'));
    setNewFiles(prev => [...prev, ...allowed]);
  };

  const removeExisting = (url: string) => setExistingUrls(prev => prev.filter(u => u !== url));
  const removeNew = (index: number) => setNewFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim() && existingUrls.length === 0 && newFiles.length === 0) {
      setError('Please write something or add at least one image.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload new images to Supabase storage
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('archive_images')
          .upload(path, file, { upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('archive_images')
          .getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }

      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      // 2. Create or update the post
      let saved: ArchivePost;
      if (isEdit && initial) {
        saved = await ApiClient.put<ArchivePost>(`/archives/${initial.id}`, {
          content,
          image_urls: finalImageUrls,
        });
      } else {
        saved = await ApiClient.post<ArchivePost>('/archives', {
          content,
          image_urls: finalImageUrls,
        });
      }

      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  const totalImages = existingUrls.length + newFiles.length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Edit Post' : 'New Archive Post'}</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <textarea
              className={styles.contentArea}
              placeholder="Share something with the community…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
            />

            {/* Image previews */}
            {totalImages > 0 && (
              <div className={styles.previewGrid}>
                {existingUrls.map(url => (
                  <div key={url} className={styles.previewItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Existing" />
                    <button type="button" className={styles.previewRemove} onClick={() => removeExisting(url)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newPreviews.map((url, i) => (
                  <div key={url} className={styles.previewItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="New" />
                    <button type="button" className={styles.previewRemove} onClick={() => removeNew(i)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.addImageBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon size={16} />
              Add Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={uploading}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={uploading}>
                {uploading ? (
                  <><Loader2 size={16} className={styles.spinner} /> Posting…</>
                ) : (
                  isEdit ? 'Save Changes' : 'Publish'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Delete Confirmation Dialog
// ============================================================
function DeleteDialog({ post, onConfirm, onCancel, loading }: {
  post: ArchivePost;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={`${styles.modal} ${styles.modalSmall}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Delete Post?</h2>
          <button className={styles.modalClose} onClick={onCancel}><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.deleteMsg}>
            This post and all its images will be permanently deleted. This action cannot be undone.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
            <button className={`${styles.submitBtn} ${styles.submitBtnDanger}`} onClick={onConfirm} disabled={loading}>
              {loading ? <><Loader2 size={16} className={styles.spinner} /> Deleting…</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main ArchivesPage Component
// ============================================================
export default function ArchivesPage() {
  const { user, profile, role } = useAuth();
  const isCommittee = role === 'committee' || role === 'admin';

  const [posts, setPosts] = useState<ArchivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost] = useState<ArchivePost | null>(null);
  const [deletePost, setDeletePost] = useState<ArchivePost | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    ApiClient.get<ArchivePost[]>('/archives')
      .then(data => { setPosts(data ?? []); setLoading(false); })
      .catch((err) => {
        // Only log — don't wipe existing posts on a transient error
        console.error('Failed to fetch archive posts:', err);
        setLoading(false);
      });
  }, [user?.id]);

  const handleSaved = (saved: ArchivePost) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === saved.id);
      if (exists) return prev.map(p => p.id === saved.id ? { ...p, ...saved } : p);
      return [saved, ...prev];
    });
  };

  const handleDelete = async () => {
    if (!deletePost) return;
    setDeleting(true);
    try {
      await ApiClient.delete(`/archives/${deletePost.id}`);
      setPosts(prev => prev.filter(p => p.id !== deletePost.id));
      setDeletePost(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Archives</h1>
            <p className={styles.pageSubtitle}>
              Stories, milestones, and memories shared by our committee.
            </p>
          </div>
          {isCommittee && (
            <button
              id="create-archive-post-btn"
              className={styles.createBtn}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={18} />
              New Post
            </button>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <ImageIcon size={48} className={styles.emptyIcon} />
            <h3>No posts yet</h3>
            <p>Committee members can share updates, milestones, and memories here.</p>
          </div>
        ) : (
          <div className={styles.feed}>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={profile?.id}
                onEdit={setEditPost}
                onDelete={setDeletePost}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <PostModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}

      {/* Edit modal */}
      {editPost && (
        <PostModal
          initial={editPost}
          onClose={() => setEditPost(null)}
          onSaved={post => {
            handleSaved(post);
            setEditPost(null);
          }}
        />
      )}

      {/* Delete dialog */}
      {deletePost && (
        <DeleteDialog
          post={deletePost}
          onConfirm={handleDelete}
          onCancel={() => setDeletePost(null)}
          loading={deleting}
        />
      )}
    </main>
  );
}
