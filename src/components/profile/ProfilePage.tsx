'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Eye, ShieldCheck, Mail, Phone, CheckCircle2, LogOut, AlertTriangle, X, Send, KeyRound, Settings, UserPlus, Users, MessageSquare, AtSign, Trash2, Copy } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import FamilyMemberModal from './FamilyMemberModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangeUsernameModal from './ChangeUsernameModal';
import VerifyEmailModal from './VerifyEmailModal';
import { Member } from '@/types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name?: string) {
  let hash = 0;
  const n = name || '';
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Canonical relation groups for perspective calculation
const PARENT_RELS = ['father', 'mother', 'stepfather', 'stepmother', 'adoptive father', 'adoptive mother'];
const CHILD_RELS = ['son', 'daughter', 'stepson', 'stepdaughter', 'adopted son', 'adopted daughter'];
const SIBLING_RELS = ['brother', 'sister', 'half brother', 'half sister', 'stepbrother', 'stepsister', 'adopted sibling'];
const SPOUSE_RELS = ['spouse', 'husband', 'wife'];
const GRANDPARENT_RELS = ['paternal grandfather', 'paternal grandmother', 'maternal grandfather', 'maternal grandmother', 'great grandfather', 'great grandmother', 'step grandfather', 'step grandmother'];
const GRANDCHILD_RELS = ['grandson', 'granddaughter', 'great grandson', 'great granddaughter'];
const UNCLE_AUNT_RELS = ['uncle', 'aunt', 'paternal uncle', 'paternal aunt', 'maternal uncle', 'maternal aunt', 'great uncle', 'great aunt'];
const NEPHEW_NIECE_RELS = ['nephew', 'niece', 'great nephew', 'great niece'];
const IN_LAW_PARENT_RELS = ['father-in-law', 'mother-in-law'];
const IN_LAW_CHILD_RELS = ['son-in-law', 'daughter-in-law', 'grandson-in-law', 'granddaughter-in-law'];
const IN_LAW_SIBLING_RELS = ['brother-in-law', 'sister-in-law'];
const COUSIN_RELS = ['cousin', 'first cousin', 'second cousin', 'cousin once removed', 'step cousin'];
const PRIMARY_RELS = ['', 'primary', 'primary account', 'self', 'head'];

function gSibling(g: string) { return g === 'female' ? 'Sister' : 'Brother'; }
function gParent(g: string) { return g === 'female' ? 'Mother' : 'Father'; }
function gChild(g: string) { return g === 'female' ? 'Daughter' : 'Son'; }
function gGrandparent(g: string) { return g === 'female' ? 'Grandmother' : 'Grandfather'; }
function gGrandchild(g: string) { return g === 'female' ? 'Granddaughter' : 'Grandson'; }
function gUnclAunt(g: string) { return g === 'female' ? 'Aunt' : 'Uncle'; }
function gNephNiece(g: string) { return g === 'female' ? 'Niece' : 'Nephew'; }
function gInlawParent(g: string) { return g === 'female' ? 'Mother-in-law' : 'Father-in-law'; }
function gInlawChild(g: string) { return g === 'female' ? 'Daughter-in-law' : 'Son-in-law'; }
function gInlawSibling(g: string) { return g === 'female' ? 'Sister-in-law' : 'Brother-in-law'; }
function gSpouse(g: string) { return g === 'female' ? 'Wife' : 'Husband'; }

/**
 * Compute what `target` is to `viewer`, given that all relations are stored 
 * from the primary account's perspective.
 * - viewerRel: target's stored relation (relative to primary)  
 * - targetRel: viewer's stored relation (relative to primary)
 * - targetGender: target's gender
 */
function computeRelFromPerspective(viewerRel: string, targetRel: string, targetGender: string): string {
  const vr = viewerRel.trim().toLowerCase();   // viewer's relation to primary
  const tr = targetRel.trim().toLowerCase();   // target's relation to primary
  const g = targetGender.trim().toLowerCase(); // target's gender

  // Target IS the viewer
  if (vr === tr) return 'Self';

  // Viewer is Primary
  if (PRIMARY_RELS.includes(vr)) {
    if (PRIMARY_RELS.includes(tr)) return 'Primary Account';
    return targetRel || 'Family Member';
  }

  // Target is Primary Account
  if (PRIMARY_RELS.includes(tr)) {
    // Invert viewer's relation
    if (PARENT_RELS.includes(vr)) return gChild(g);
    if (CHILD_RELS.includes(vr)) return gParent(g);
    if (SIBLING_RELS.includes(vr)) return gSibling(g);
    if (SPOUSE_RELS.includes(vr)) return gSpouse(g);
    if (GRANDPARENT_RELS.includes(vr)) return gGrandchild(g);
    if (GRANDCHILD_RELS.includes(vr)) return gGrandparent(g);
    if (UNCLE_AUNT_RELS.includes(vr)) return gNephNiece(g);
    if (NEPHEW_NIECE_RELS.includes(vr)) return gUnclAunt(g);
    if (IN_LAW_PARENT_RELS.includes(vr)) return gInlawChild(g);
    if (IN_LAW_CHILD_RELS.includes(vr)) return gInlawParent(g);
    if (IN_LAW_SIBLING_RELS.includes(vr)) return gInlawSibling(g);
    if (COUSIN_RELS.includes(vr)) return 'Cousin';
    return targetRel || 'Family Member';
  }

  // Both are non-primary — chain through primary
  // viewer → primary (inverse of vr), then primary → target (tr)

  // VIEWER is Parent of Primary
  if (PARENT_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return g === 'female' ? 'Wife' : 'Husband';
    if (CHILD_RELS.includes(tr)) return g === 'female' ? 'Granddaughter' : 'Grandson';
    if (SIBLING_RELS.includes(tr)) return gChild(g);
    if (SPOUSE_RELS.includes(tr)) return gInlawChild(g);
    if (GRANDPARENT_RELS.includes(tr)) return gParent(g);
    if (UNCLE_AUNT_RELS.includes(tr)) return gSibling(g);
    if (IN_LAW_PARENT_RELS.includes(tr)) return gInlawParent(g);
    if (NEPHEW_NIECE_RELS.includes(tr)) return 'Cousin';
    if (COUSIN_RELS.includes(tr)) return 'Cousin';
  }

  // VIEWER is Child of Primary
  if (CHILD_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gGrandparent(g);
    if (CHILD_RELS.includes(tr)) return gSibling(g);
    if (SIBLING_RELS.includes(tr)) return gUnclAunt(g);
    if (SPOUSE_RELS.includes(tr)) return gParent(g);
    if (GRANDPARENT_RELS.includes(tr)) return g === 'female' ? 'Great-Grandmother' : 'Great-Grandfather';
    if (GRANDCHILD_RELS.includes(tr)) return gChild(g);
    if (IN_LAW_CHILD_RELS.includes(tr)) return gInlawSibling(g);
    if (NEPHEW_NIECE_RELS.includes(tr)) return 'First Cousin';
  }

  // VIEWER is Sibling of Primary
  if (SIBLING_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gParent(g);
    if (CHILD_RELS.includes(tr)) return gNephNiece(g);
    if (SIBLING_RELS.includes(tr)) return gSibling(g);
    if (SPOUSE_RELS.includes(tr)) return gInlawSibling(g);
    if (UNCLE_AUNT_RELS.includes(tr)) return gUnclAunt(g);
    if (NEPHEW_NIECE_RELS.includes(tr)) return 'First Cousin';
    if (COUSIN_RELS.includes(tr)) return 'Cousin';
  }

  // VIEWER is Spouse of Primary
  if (SPOUSE_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gInlawParent(g);
    if (CHILD_RELS.includes(tr)) return gChild(g);
    if (SIBLING_RELS.includes(tr)) return gInlawSibling(g);
    if (UNCLE_AUNT_RELS.includes(tr)) return gUnclAunt(g);
    if (IN_LAW_PARENT_RELS.includes(tr)) return gParent(g);
    if (NEPHEW_NIECE_RELS.includes(tr)) return gNephNiece(g);
  }

  // VIEWER is Grandparent of Primary
  if (GRANDPARENT_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gChild(g);
    if (GRANDPARENT_RELS.includes(tr)) return gSpouse(g);
    if (CHILD_RELS.includes(tr)) return g === 'female' ? 'Great-Granddaughter' : 'Great-Grandson';
    if (SIBLING_RELS.includes(tr)) return gNephNiece(g);
    if (UNCLE_AUNT_RELS.includes(tr)) return gSibling(g);
  }

  // VIEWER is Grandchild of Primary
  if (GRANDCHILD_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gParent(g);
    if (CHILD_RELS.includes(tr)) return gSibling(g);
    if (GRANDPARENT_RELS.includes(tr)) return gGrandparent(g);
    if (SIBLING_RELS.includes(tr)) return gUnclAunt(g);
    if (GRANDCHILD_RELS.includes(tr)) return gSibling(g);
  }

  // VIEWER is Uncle/Aunt of Primary
  if (UNCLE_AUNT_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gSibling(g);
    if (GRANDPARENT_RELS.includes(tr)) return gParent(g);
    if (SIBLING_RELS.includes(tr)) return gSibling(g);
    if (UNCLE_AUNT_RELS.includes(tr)) return gSpouse(g);
    if (CHILD_RELS.includes(tr)) return 'First Cousin';
    if (NEPHEW_NIECE_RELS.includes(tr)) return 'Nephew/Niece';
  }

  // VIEWER is Nephew/Niece of Primary
  if (NEPHEW_NIECE_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gUnclAunt(g);
    if (SIBLING_RELS.includes(tr)) return gParent(g);
    if (NEPHEW_NIECE_RELS.includes(tr)) return gSibling(g);
    if (CHILD_RELS.includes(tr)) return 'First Cousin';
  }

  // VIEWER is Cousin of Primary
  if (COUSIN_RELS.includes(vr)) {
    if (SIBLING_RELS.includes(tr)) return 'Cousin';
    if (PARENT_RELS.includes(tr)) return gUnclAunt(g);
    if (CHILD_RELS.includes(tr)) return 'Cousin Once Removed';
    if (COUSIN_RELS.includes(tr)) return gSpouse(g);
  }

  // VIEWER is Father-in-law / Mother-in-law of Primary
  if (IN_LAW_PARENT_RELS.includes(vr)) {
    if (SPOUSE_RELS.includes(tr)) return gChild(g);
    if (CHILD_RELS.includes(tr)) return g === 'female' ? 'Granddaughter' : 'Grandson';
    if (IN_LAW_PARENT_RELS.includes(tr)) return gSpouse(g);
    if (SIBLING_RELS.includes(tr)) return gInlawChild(g);
  }

  // VIEWER is Son-in-law / Daughter-in-law of Primary
  if (IN_LAW_CHILD_RELS.includes(vr)) {
    if (PARENT_RELS.includes(tr)) return gInlawParent(g);
    if (CHILD_RELS.includes(tr)) return gInlawSibling(g);
    if (IN_LAW_CHILD_RELS.includes(tr)) return gSpouse(g);
    if (SIBLING_RELS.includes(tr)) return gInlawSibling(g);
  }

  // VIEWER is Brother-in-law / Sister-in-law of Primary
  if (IN_LAW_SIBLING_RELS.includes(vr)) {
    if (SPOUSE_RELS.includes(tr)) return gSibling(g);
    if (SIBLING_RELS.includes(tr)) return gInlawSibling(g);
    if (PARENT_RELS.includes(tr)) return gInlawParent(g);
    if (CHILD_RELS.includes(tr)) return gNephNiece(g);
  }

  return targetRel || 'Family Member';
}

function getDynamicRelation(targetMember: Member, selectedMember: Member, familyMembers: Member[]): string {
  // Find primary member
  const primaryMember = familyMembers.find(m =>
    PRIMARY_RELS.includes((m.relation || '').trim().toLowerCase())
  ) || familyMembers[0];

  if (!primaryMember) return targetMember.relation || 'Family Member';

  const viewerRel = selectedMember.id === primaryMember.id
    ? '' // viewer is primary
    : (selectedMember.relation || '');

  const targetRel = targetMember.id === primaryMember.id
    ? '' // target is primary
    : (targetMember.relation || '');

  const targetGender = (targetMember.gender || '').trim().toLowerCase();

  return computeRelFromPerspective(viewerRel, targetRel, targetGender);
}


interface ProfilePageProps {
  memberId?: string;
}

export default function ProfilePage({ memberId }: ProfilePageProps) {
  // `member` is the main logged in user (or the main profile being viewed)
  const [member, setMember] = useState<Member | null>(null);
  
  // New state for Family Dashboard
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  
  // Legacy modal state for non-family updates or requests
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalMode] = useState<'self-update' | 'request-update'>('self-update');
  
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | undefined>(undefined);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);

  // Duplicate profile detection
  interface DuplicateProfile { id: string; name: string; same_family: boolean; }
  const [duplicateProfiles, setDuplicateProfiles] = useState<DuplicateProfile[]>([]);
  const [duplicateBannerDismissed, setDuplicateBannerDismissed] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingNotification, setPendingNotification] = useState<any>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<'verify' | 'change'>('verify');
  
  const { profile, role, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    router.replace('/home');
    logout();
  };

  const isMyProfile = !memberId || memberId === 'me' || profile?.member_id === (member?._id || member?.id);

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const endpoint = memberId && memberId !== 'me' ? `/members/${memberId}` : '/members/me';
      const data = await ApiClient.get<Member>(endpoint);
      setMember(data);

      // Fetch the family for this member
      try {
        const familyEndpoint = memberId && memberId !== 'me' 
          ? `/members/family?memberId=${data.id}` 
          : '/members/family';
        const familyData = await ApiClient.get<{ members: Member[] }>(familyEndpoint);
        const membersList = familyData.members || [];
        setFamilyMembers(membersList);

        // Update selectedMember: update details if selected, otherwise set to primary profile
        setSelectedMember(prev => {
          if (!prev) return data;
          if (prev.id === data.id) return data;
          const updatedSelected = membersList.find(m => m.id === prev.id);
          return updatedSelected || prev;
        });
      } catch (e) {
        console.error("Failed to fetch family members", e);
      }
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to load profile', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Fetch the current username from auth profile
  useEffect(() => {
    async function fetchUsername() {
      try {
        const data = await ApiClient.get<{ username?: string }>('/auth/me');
        if (data?.username) setCurrentUsername(data.username);
      } catch {
        // Silently fail — username display is non-critical
      }
    }
    if (isMyProfile) fetchUsername();
  }, [isMyProfile]);

  // Fetch duplicate profiles
  useEffect(() => {
    async function checkDuplicates() {
      try {
        const data = await ApiClient.get<{ duplicates: DuplicateProfile[] }>('/members/duplicates');
        if (data.duplicates && data.duplicates.length > 0) {
          setDuplicateProfiles(data.duplicates);
        }
      } catch {
        // Silently fail — non-critical
      }
    }
    if (isMyProfile) checkDuplicates();
  }, [isMyProfile]);

  useGSAP(() => {
    if (!profileRef.current || isLoading || !selectedMember) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const items = profileRef.current.querySelectorAll('.gsap-profile-anim');
    gsap.fromTo(items,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'expo.out',
        clearProps: 'transform,opacity',
      }
    );
  }, { scope: profileRef, dependencies: [selectedMember, isLoading] });

  useEffect(() => {
    if (!isMyProfile) return;
    
    async function checkNotifications() {
      try {
        interface Notification {
          type: string;
          is_read: boolean;
        }
        const data = await ApiClient.get<{ notifications: Notification[] }>('/members/me/notifications');
        const profileUpdateNotif = data.notifications?.find(n => n.type === 'profile_update' && !n.is_read);
        if (profileUpdateNotif) {
          setPendingNotification(profileUpdateNotif);
        }
      } catch {
        // Silently fail
      }
    }
    checkNotifications();
  }, [isMyProfile]);

  const handleDismissNotification = async () => {
    if (!pendingNotification?.id) return;
    try {
      await ApiClient.put('/members/me/notifications', { notificationId: pendingNotification.id });
      setPendingNotification(null);
      toast('Notification dismissed', 'success');
    } catch {
      toast('Failed to dismiss notification', 'error');
    }
  };

  const handleRequestUpdate = async () => {
    const targetId = selectedMember?._id || selectedMember?.id;
    if (!targetId) return;

    setIsRequestingUpdate(true);
    try {
      await ApiClient.post(`/members/${targetId}/request-update`, {});
      toast('Update request sent to this member successfully!', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to send update request', 'error');
    } finally {
      setIsRequestingUpdate(false);
    }
  };

  const handleEditFamilyMember = (m: Member) => {
    setEditingMember(m);
    setIsFamilyModalOpen(true);
  };

  const handleAddFamilyMember = () => {
    setEditingMember(null);
    setIsFamilyModalOpen(true);
  };

  const handleFamilyMemberSaved = (savedMember: Member) => {
    // Update local state
    if (editingMember) {
      // It was an edit
      setFamilyMembers(prev => prev.map(m => m.id === savedMember.id ? savedMember : m));
      if (selectedMember?.id === savedMember.id) {
        setSelectedMember(savedMember);
      }
      if (member?.id === savedMember.id) {
        setMember(savedMember);
      }
    } else {
      // It was an add
      setFamilyMembers(prev => [...prev, savedMember]);
      setSelectedMember(savedMember);
    }

    // Silently re-fetch entire family & profile to handle merges and relationship recalculations automatically!
    loadProfile(true);
    
    if (pendingNotification && savedMember.id === member?.id) {
      handleDismissNotification();
    }
    
    // Check if email needs verification (only for the main logged-in user)
    if (savedMember.id === member?.id && savedMember.email && !savedMember.email_verified) {
      setEmailModalMode('verify');
      setIsVerifyEmailModalOpen(true);
    }
  };

  const handlePrivacyChange = async (visibility: 'public' | 'private') => {
    if (!selectedMember) return;
    try {
      // Assume updating visibility applies to the selected member via PUT family
      await ApiClient.put(`/members/family/${selectedMember.id}`, {
        contact_visibility: visibility
      });
      setSelectedMember(prev => prev ? { ...prev, contact_visibility: visibility } : prev);
      setFamilyMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, contact_visibility: visibility } : m));
      toast(`Profile is now ${visibility}`, 'success');
      setShowSettingsMenu(false);
    } catch {
      toast('Failed to update privacy settings', 'error');
    }
  };

  const handleSetPrimary = async () => {
    if (!selectedMember) return;
    setIsSettingPrimary(true);
    try {
      const nameStr = selectedMember.name || `${selectedMember.first_name} ${selectedMember.last_name}`;

      if (!selectedMember.family_id) {
        // Solo member — create a family for them and enroll in directory
        const result = await ApiClient.post<{ success: boolean; family_id: string; family_name: string }>(
          '/members/me/show-in-directory', {}
        );
        // Update local state so subsequent actions know the family_id
        setMember(prev => prev ? { ...prev, family_id: result.family_id } : prev);
        setSelectedMember(prev => prev ? { ...prev, family_id: result.family_id } : prev);
        toast(`You will now appear in the directory as "${result.family_name}"`, 'success');
      } else {
        // Multi-member family — update the family name
        const familyName = `${nameStr} Family`;
        await ApiClient.post(`/members/family/${selectedMember.family_id}/set-primary`, {
          memberName: familyName
        });
        toast(`Directory will now show ${familyName}`, 'success');
      }
    } catch {
      toast('Failed to update directory listing', 'error');
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const handleRemoveMember = async (fm: Member) => {
    const name = fm.name || `${fm.first_name || ''} ${fm.last_name || ''}`.trim() || 'this member';
    const confirmed = window.confirm(`Remove ${name} from your family? This cannot be undone.`);
    if (!confirmed) return;

    const memberId = fm.id || fm._id;
    if (!memberId) return;

    setIsRemovingMember(memberId);
    try {
      await ApiClient.delete(`/members/family/${memberId}`);
      setFamilyMembers(prev => prev.filter(m => (m.id || m._id) !== memberId));
      // If the removed member was selected, fall back to the main profile
      if (selectedMember?.id === memberId || selectedMember?._id === memberId) {
        setSelectedMember(member);
      }
      toast(`${name} has been removed from your family.`, 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to remove member.', 'error');
    } finally {
      setIsRemovingMember(null);
    }
  };

  const handleDeleteOtherDuplicate = async (dupId: string, dupName: string) => {
    const confirmed = window.confirm(
      `Delete "${dupName}" permanently?\n\nThis will remove that duplicate record from the database. Your profile will remain. This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await ApiClient.delete(`/members/${dupId}`);
      setDuplicateProfiles(prev => prev.filter(d => d.id !== dupId));
      toast(`Duplicate profile "${dupName}" has been deleted.`, 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to delete duplicate.', 'error');
    }
  };

  const handleDeleteSelf = async () => {
    const usernameInput = window.prompt(
      `This will permanently delete YOUR profile and account.\n\nType your username to confirm:`
    );
    if (!usernameInput) return;
    if (usernameInput.trim().toLowerCase() !== (currentUsername || '').toLowerCase()) {
      toast('Username did not match. Deletion cancelled.', 'error');
      return;
    }
    const finalConfirm = window.confirm(
      'Last chance — this is IRREVERSIBLE. Delete your account now?'
    );
    if (!finalConfirm) return;
    try {
      await ApiClient.delete('/members/me');
      toast('Your profile has been deleted. Logging out…', 'success');
      setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to delete your profile.', 'error');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!selectedMember) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Profile unavailable.</div>;
  }

  const displayMember = selectedMember;
  const firstName = displayMember.first_name || '';
  const middleName = displayMember.middle_name ? displayMember.middle_name + ' ' : '';
  const lastName = displayMember.last_name || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

  const isCommitteeViewingOther = !isMyProfile && (role === 'admin' || role === 'committee');
  // True if the user is looking at their own personal record within the family
  const isSelectedMyOwn = isMyProfile && displayMember.id === member?.id;

  const renderProfileDetail = () => (
    <div className={styles.detailPanel}>
      {/* Pending Update Notification Banner */}
      {isSelectedMyOwn && pendingNotification && (
        <div className={`${styles.notificationBanner} gsap-profile-anim`}>
          <div className={styles.notificationContent}>
            <AlertTriangle size={20} className={styles.notificationIcon} />
            <div>
              <strong>Profile Update Requested</strong>
              <p>A committee member has requested you to update your profile because it may be incomplete. Please review and update your information.</p>
            </div>
          </div>
          <div className={styles.notificationActions}>
            <button 
              className={styles.notificationUpdateBtn}
              onClick={() => handleEditFamilyMember(displayMember)}
            >
              <Pencil size={14} /> Update Now
            </button>
            <button 
              className={styles.notificationDismissBtn}
              onClick={handleDismissNotification}
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Profile Detection Banner */}
      {isSelectedMyOwn && duplicateProfiles.length > 0 && !duplicateBannerDismissed && (
        <div className={`${styles.notificationBanner} gsap-profile-anim`} style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
          borderLeft: '4px solid #f59e0b',
          marginBottom: '1.25rem',
        }}>
          <div className={styles.notificationContent}>
            <Copy size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#92400e' }}>Duplicate Profile Detected</strong>
              <p style={{ color: '#78350f', fontSize: '0.85rem', marginTop: '4px', marginBottom: '8px' }}>
                We found {duplicateProfiles.length} other profile{duplicateProfiles.length > 1 ? 's' : ''} with the same name as yours. Only one should exist. Please choose how to resolve this:
              </p>
              {duplicateProfiles.map(dup => (
                <div key={dup.id} style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.875rem' }}>
                    {dup.name}
                    {dup.same_family && (
                      <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#fde68a', color: '#78350f', padding: '2px 6px', borderRadius: '10px' }}>Same Family</span>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleDeleteOtherDuplicate(dup.id, dup.name)}
                      style={{
                        padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                        background: '#dc2626', color: '#fff', border: 'none',
                        borderRadius: '6px', cursor: 'pointer',
                      }}
                    >
                      Delete "{dup.name}"
                    </button>
                    <button
                      onClick={handleDeleteSelf}
                      style={{
                        padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                        background: 'transparent', color: '#dc2626',
                        border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer',
                      }}
                    >
                      Delete My Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDuplicateBannerDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', padding: '4px', alignSelf: 'flex-start', flexShrink: 0 }}
            title="Dismiss (will reappear on next visit)"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className={`${styles.profileHero} gsap-profile-anim`}>
        <div className={styles.profilePhoto}>
          <div className={styles.profilePhotoInitials} style={{ backgroundColor: getAvatarColor(displayMember.name || `${displayMember.first_name} ${displayMember.last_name}`) }}>
            {initials}
          </div>
        </div>
        <div className={styles.profileHeroInfo}>
          <p className={styles.verifiedLabel}>
            {displayMember.active ? 'Verified Member' : 'Member'}
          </p>
          <h1 className={styles.profileName}>
            {firstName} {middleName}<br />
            <span className={styles.profileNameItalic}>{lastName}</span>
          </h1>
          <p className={styles.profileBio}>
            A valued member of the KVO Nagpur community.
          </p>
          <div className={styles.profileActions}>
            {/* Edit Profile — only if managing own family */}
            {isMyProfile && (
              <>
                <button className={styles.editProfileBtn} onClick={() => handleEditFamilyMember(displayMember)}>
                  <Pencil size={16} /> Edit Member
                </button>
                {/* Show in Directory */}
                {familyMembers.length > 1 ? (
                  <button 
                    className={styles.editProfileBtn} 
                    style={{ backgroundColor: 'var(--color-bg-section-alt)', border: '1px solid var(--color-border)' }}
                    onClick={handleSetPrimary}
                    disabled={isSettingPrimary}
                    title="Show this member's name as the family name in the directory"
                  >
                    <Users size={16} /> {isSettingPrimary ? 'Setting...' : 'Show in Directory'}
                  </button>
                ) : (
                  <label 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', 
                      background: 'var(--color-bg-section-alt)', border: '1px solid var(--color-border)', 
                      borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-primary)'
                    }}
                    title="Show your profile in the community directory"
                  >
                    <input 
                      type="checkbox" 
                      checked={displayMember.contact_visibility === 'public'}
                      onChange={(e) => handlePrivacyChange(e.target.checked ? 'public' : 'private')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    Show in Directory
                  </label>
                )}
              </>
            )}
            
            {/* Request Update — only for committee viewing someone else */}
            {isCommitteeViewingOther && (
              <button 
                className={styles.requestUpdateBtn} 
                onClick={handleRequestUpdate}
                disabled={isRequestingUpdate}
              >
                <Send size={16} /> {isRequestingUpdate ? 'Sending...' : 'Request Update'}
              </button>
            )}
            
            {/* Settings drop down - only available for the primary logged in user's own profile */}
            {isSelectedMyOwn && (
              <div style={{ position: 'relative' }}>
                <button className={styles.privacyBtn} onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
                  <Settings size={16} /> Settings
                </button>
                {showSettingsMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '220px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg-section-alt)' }}>
                      Privacy
                    </div>
                    <button 
                      onClick={() => { handlePrivacyChange('public'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <Eye size={14} /> Make Profile Public
                    </button>
                    <button 
                      onClick={() => { handlePrivacyChange('private'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <ShieldCheck size={14} /> Make Profile Private
                    </button>
                    
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg-section-alt)', borderTop: '1px solid var(--color-border)' }}>
                      Security
                    </div>
                    <button 
                      onClick={() => { setIsUsernameModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <AtSign size={14} /> Change Username
                    </button>
                    <button 
                      onClick={() => { setIsPasswordModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <KeyRound size={14} /> Change Password
                    </button>
                    <button 
                      onClick={() => { setEmailModalMode('verify'); setIsVerifyEmailModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <CheckCircle2 size={14} /> Verify Email
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className={styles.infoGrid}>
        {/* Personal Info */}
        <div className={`${styles.infoCard} gsap-profile-anim`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Personal</span>
          </div>
          <div className={styles.infoLabel}>Origin Kutch Town</div>
          <div className={styles.infoValue}>{displayMember.kutch_town || 'Not specified'}</div>
          <div className={styles.infoLabel}>Nukh</div>
          <div className={styles.infoValue}>{displayMember.nukh || 'Not specified'}</div>
          <div className={styles.infoLabel}>Birthplace</div>
          <div className={styles.infoValue}>{displayMember.birthplace || 'Not specified'}</div>
          <div className={styles.infoLabel}>Marital Status</div>
          <div className={styles.infoValue}>{displayMember.marital_status || 'Not specified'}</div>
        </div>

        {/* Professional Standing */}
        <div className={`${styles.infoCard} gsap-profile-anim`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Professional Standing</span>
            <CheckCircle2 size={16} className={styles.verifiedIcon} />
          </div>
          <div className={styles.infoLabel}>Current Occupation</div>
          <div className={`${styles.infoValue} ${styles.infoValueLarge}`}>
            {displayMember.occupation || 'Not specified'}
          </div>
          <div className={styles.separator} />
          <div className={styles.infoLabel}>Current Residence</div>
          <div className={styles.infoValue}>{displayMember.current_place || 'Not specified'}</div>
        </div>
      </div>

      {/* Contact Info */}
      <div className={`${styles.contactCard} gsap-profile-anim`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionDash} />
          <span className={styles.sectionTitle}>Contact</span>
        </div>
        <div className={styles.contactRow}>
          <Mail size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Email Address</div>
            <div className={styles.contactValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayMember.email || 'Not available'}
              {displayMember.email_verified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                isMyProfile && displayMember.email && (
                  <button
                    onClick={() => {
                      setEmailModalMode('verify');
                      setIsVerifyEmailModalOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(139, 26, 26, 0.08)',
                      border: '1px solid var(--color-primary)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.08)';
                    }}
                  >
                    Verify Email
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <Phone size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Phone Number</div>
            <div className={styles.contactValue}>
              {displayMember.contact_numbers?.length 
                ? displayMember.contact_numbers.join(', ')
                : displayMember.contact_no 
                  ? displayMember.contact_no 
                  : <span style={{ fontStyle: 'italic', color: '#666' }}>Number is private</span>
              }
            </div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <MessageSquare size={18} className={styles.contactIcon} style={{ color: '#25D366' }} />
          <div>
            <div className={styles.contactLabel}>WhatsApp Number</div>
            <div className={styles.contactValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayMember.whatsapp || 'Not available'}
            </div>
          </div>
        </div>
      </div>

      {/* Visibility Banner */}
      <div className={`${styles.visibilityBanner} gsap-profile-anim`}>
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility ({displayMember.contact_visibility})</h3>
          <p className={styles.visibilityText}>
            {displayMember.contact_visibility === 'private' 
              ? 'Your profile is private, meaning some details are hidden, but your contact number and email remain public for the community.'
              : 'Your profile is fully public. All verified community members can view your details.'}
          </p>
        </div>
      </div>

      {/* Logout Button */}
      {isSelectedMyOwn && (
        <div className="gsap-profile-anim" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 24px', background: 'var(--color-bg-card)', 
              border: '1px solid var(--color-border)', borderRadius: '8px', 
              color: '#dc2626', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={profileRef} className={styles.profileContent}>
      {familyMembers.length > 0 ? (
        <div className={styles.dashboardLayout}>
          {/* Left Sidebar: Family Members List */}
          <div className={`${styles.familySidebar} gsap-profile-anim`}>
            <div className={styles.familySidebarHeader}>
              <h2 className={styles.familySidebarTitle}>Family Dashboard</h2>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            
            <div className={styles.familyList}>
              {familyMembers.map((fm) => {
                const fmId = fm.id || fm._id;
                const isOwnRecord = fmId === (member?.id || member?._id);
                const isRemoving = isRemovingMember === fmId;
                return (
                  <div
                    key={fmId}
                    className={`${styles.familyMemberItem} ${selectedMember?.id === fmId ? styles.active : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0', cursor: 'pointer', position: 'relative' }}
                    onClick={() => setSelectedMember(fm)}
                  >
                    <div className={styles.familyMemberAvatar} style={{ backgroundColor: getAvatarColor(fm.name || `${fm.first_name} ${fm.last_name}`), flexShrink: 0 }}>
                      {`${fm.first_name?.[0] || ''}${fm.last_name?.[0] || ''}`}
                    </div>
                    <div className={styles.familyMemberInfo} style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.familyMemberName}>{fm.name || `${fm.first_name} ${fm.last_name}`}</div>
                      {getDynamicRelation(fm, selectedMember!, familyMembers) ? (
                        <div className={styles.familyMemberRelation}>
                          {getDynamicRelation(fm, selectedMember!, familyMembers)}
                        </div>
                      ) : null}
                      {fm.active === false && (
                        <div style={{ fontSize: '0.7rem', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                          Pending Approval
                        </div>
                      )}
                    </div>
                    {isMyProfile && !isOwnRecord && (
                      <button
                        title={`Remove ${fm.first_name || 'member'} from family`}
                        disabled={isRemoving}
                        onClick={(e) => { e.stopPropagation(); handleRemoveMember(fm); }}
                        style={{
                          flexShrink: 0,
                          marginLeft: '4px',
                          background: 'transparent',
                          border: 'none',
                          cursor: isRemoving ? 'not-allowed' : 'pointer',
                          color: isRemoving ? 'var(--color-text-muted)' : '#dc2626',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: isRemoving ? 0.5 : 0.7,
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!isRemoving) e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { if (!isRemoving) e.currentTarget.style.opacity = '0.7'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {isMyProfile && (
              <button className={styles.addMemberBtn} onClick={handleAddFamilyMember}>
                <UserPlus size={16} /> Add Family Member
              </button>
            )}
          </div>

          {/* Right Panel: Selected Member Details */}
          {renderProfileDetail()}
        </div>
      ) : (
        renderProfileDetail()
      )}

      {/* Modals */}
      {isFamilyModalOpen && (
        <FamilyMemberModal 
          member={editingMember} 
          isPrimary={editingMember?.id === member?.id}
          onClose={() => setIsFamilyModalOpen(false)}
          onSaved={handleFamilyMemberSaved}
        />
      )}

      {/* Legacy self-update modal (if needed elsewhere) */}
      {isUpdateModalOpen && !isMyProfile && (
        <ProfileUpdateModal 
          member={selectedMember} 
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdated={handleFamilyMemberSaved}
          mode={updateModalMode}
        />
      )}

      {isUsernameModalOpen && (
        <ChangeUsernameModal
          currentUsername={currentUsername}
          onClose={() => setIsUsernameModalOpen(false)}
          onSuccess={(newUsername) => {
            setCurrentUsername(newUsername);
            setIsUsernameModalOpen(false);
          }}
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {isVerifyEmailModalOpen && (
        <VerifyEmailModal
          mode={emailModalMode}
          initialEmail={selectedMember?.email}
          familyMemberId={isSelectedMyOwn ? undefined : selectedMember?.id}
          onClose={() => setIsVerifyEmailModalOpen(false)}
          onSuccess={(newEmail) => {
            if (!selectedMember) return;
            const updated = { ...selectedMember, email: newEmail, email_verified: true };
            setSelectedMember(updated);
            if (member?.id === selectedMember.id) {
               setMember(updated);
            }
            setFamilyMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
            setIsVerifyEmailModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
