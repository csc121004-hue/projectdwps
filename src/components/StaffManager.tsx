import React, { useState, useEffect, useRef } from 'react';
import { StaffMember, INITIAL_STAFF_MEMBERS } from '../data/schoolData';
import { api } from '../services/api';

interface StaffManagerProps {
  currentUser: { name: string; role: string; email: string };
  onBackToWebsite: () => void;
  onStaffUpdated?: () => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  currentUser,
  onBackToWebsite,
  onStaffUpdated
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Leadership' | 'Faculty'>('All');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    photoUrl: string;
    designation: string;
    category: 'Leadership' | 'Faculty';
    subjectsInput: string;
    skillsInput: string;
    description: string;
    qualification: string;
    experience: string;
    displayOrder: number;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    photoUrl: '',
    designation: '',
    category: 'Faculty',
    subjectsInput: '',
    skillsInput: '',
    description: '',
    qualification: '',
    experience: '',
    displayOrder: 1,
    status: 'Active'
  });

  // Photo Upload States
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Staff
  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const resp = await api.getAdminStaff(currentUser.email);
      if (resp.success && resp.data && resp.data.length > 0) {
        setStaffList(resp.data);
      } else {
        // Fallback to public or initial
        const pubResp = await api.getStaff();
        if (pubResp.success && pubResp.data && pubResp.data.length > 0) {
          setStaffList(pubResp.data);
        } else {
          setStaffList(INITIAL_STAFF_MEMBERS);
        }
      }
    } catch {
      setStaffList(INITIAL_STAFF_MEMBERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // Open Add Form
  const handleOpenAddForm = () => {
    const nextOrder = staffList.length > 0
      ? Math.max(...staffList.map((s) => s.displayOrder || 0)) + 1
      : 1;

    setEditingStaffId(null);
    setPhotoPreview('');
    setPhotoError('');
    setFormData({
      name: '',
      photoUrl: '',
      designation: '',
      category: 'Faculty',
      subjectsInput: '',
      skillsInput: '',
      description: '',
      qualification: '',
      experience: '',
      displayOrder: nextOrder,
      status: 'Active'
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setPhotoPreview(staff.photoUrl || staff.imageUrl || '');
    setPhotoError('');
    setFormData({
      name: staff.name || '',
      photoUrl: staff.photoUrl || staff.imageUrl || '',
      designation: staff.designation || staff.role || '',
      category: staff.category || 'Faculty',
      subjectsInput: (staff.subjects || []).join(', '),
      skillsInput: (staff.skills || []).join(', '),
      description: staff.description || '',
      qualification: staff.qualification || staff.qualifications || '',
      experience: staff.experience || '',
      displayOrder: typeof staff.displayOrder === 'number' ? staff.displayOrder : 1,
      status: staff.status === 'Inactive' ? 'Inactive' : 'Active'
    });
    setIsFormModalOpen(true);
  };

  // Handle Photo File Selection from computer (Exact uploaded file)
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setPhotoError('Unable to upload photo. Please upload a valid image file (JPEG, PNG, WebP).');
      showToast('Unable to upload photo. Please upload a valid image file (JPEG, PNG, WebP).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError(`Unable to upload photo. File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      showToast('Unable to upload photo. File size exceeds 5MB limit.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read base64 and upload to persistent server storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) {
        setPhotoError('Unable to read photo file from your device.');
        return;
      }

      // Show immediate local preview
      setPhotoPreview(base64Data);
      setIsUploadingPhoto(true);

      try {
        const uploadResp = await api.uploadStaffPhoto(
          base64Data,
          file.name,
          file.type,
          currentUser.email
        );

        if (uploadResp.success && uploadResp.photoUrl) {
          // Store exact persistent photo path
          setFormData((prev) => ({ ...prev, photoUrl: uploadResp.photoUrl! }));
          setPhotoPreview(uploadResp.photoUrl);
          showToast('Photo uploaded successfully.', 'success');
        } else {
          setPhotoError(uploadResp.error || 'Unable to upload photo. Please try again.');
          showToast(uploadResp.error || 'Unable to upload photo. Please try again.', 'error');
        }
      } catch (err: any) {
        setPhotoError(err?.message || 'Unable to upload photo. Please try again.');
        showToast('Unable to upload photo. Please try again.', 'error');
      } finally {
        setIsUploadingPhoto(false);
      }
    };

    reader.onerror = () => {
      setPhotoError('Unable to read photo from your computer. Please try another file.');
      showToast('Unable to upload photo. Please try again.', 'error');
    };

    reader.readAsDataURL(file);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');

    // Validation: Name is required
    if (!formData.name.trim()) {
      showToast('Staff Name is required.', 'error');
      return;
    }

    // Validation: Photo is required when creating a new staff member
    if (!editingStaffId && !formData.photoUrl.trim() && !photoPreview.trim()) {
      setPhotoError('Photo is required when creating a new staff member.');
      showToast('Photo is required when creating a new staff member.', 'error');
      return;
    }

    // Parse subjects and skills arrays
    const cleanSubjects = formData.subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanSkills = formData.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const finalPhoto = formData.photoUrl.trim() || photoPreview.trim();

    const payload: Partial<StaffMember> = {
      name: formData.name.trim(),
      photoUrl: finalPhoto,
      imageUrl: finalPhoto,
      designation: formData.designation.trim() || 'Faculty Member',
      category: formData.category,
      subjects: cleanSubjects,
      skills: cleanSkills,
      description: formData.description.trim(),
      qualification: formData.qualification.trim(),
      qualifications: formData.qualification.trim(),
      experience: formData.experience.trim(),
      displayOrder: Number(formData.displayOrder) || 0,
      status: formData.status
    };

    try {
      if (editingStaffId) {
        // Update existing staff
        const res = await api.updateStaff(editingStaffId, payload, currentUser.email);
        if (res.success) {
          showToast('Staff member updated successfully.', 'success');
          setIsFormModalOpen(false);
          await loadStaff();
          if (onStaffUpdated) onStaffUpdated();
        } else {
          showToast(res.error || 'Failed to update staff member.', 'error');
        }
      } else {
        // Create new staff
        const res = await api.createStaff(payload, currentUser.email);
        if (res.success) {
          showToast('Staff member added successfully.', 'success');
          setIsFormModalOpen(false);
          await loadStaff();
          if (onStaffUpdated) onStaffUpdated();
        } else {
          showToast(res.error || 'Failed to add staff member.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save staff record.', 'error');
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (staff: StaffMember) => {
    const targetStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.toggleStaffStatus(staff.id, targetStatus, currentUser.email);
      if (res.success) {
        showToast(`Staff member status changed to ${targetStatus}.`, 'success');
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, status: targetStatus } : s))
        );
        if (onStaffUpdated) onStaffUpdated();
      } else {
        showToast(res.error || 'Failed to update status.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status.', 'error');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    try {
      const res = await api.deleteStaff(deletingStaff.id, currentUser.email);
      if (res.success) {
        showToast('Staff member deleted successfully.', 'success');
        setDeletingStaff(null);
        await loadStaff();
        if (onStaffUpdated) onStaffUpdated();
      } else {
        showToast(res.error || 'Failed to delete staff member.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete staff member.', 'error');
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((staff) => {
    // Search query matching Name, Designation, or Subjects
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = (staff.name || '').toLowerCase().includes(query);
      const designationMatch = (staff.designation || staff.role || '').toLowerCase().includes(query);
      const subjectMatch = (staff.subjects || []).some((s) => s.toLowerCase().includes(query));
      const skillMatch = (staff.skills || []).some((s) => s.toLowerCase().includes(query));
      if (!nameMatch && !designationMatch && !subjectMatch && !skillMatch) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active' && staff.status !== 'Active') return false;
      if (statusFilter === 'Inactive' && staff.status === 'Active') return false;
    }

    // Category filter
    if (categoryFilter !== 'All') {
      if (staff.category !== categoryFilter) return false;
    }

    return true;
  });

  // Sort by displayOrder ascending
  const sortedStaff = [...filteredStaff].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const activeCount = staffList.filter((s) => s.status === 'Active').length;
  const inactiveCount = staffList.filter((s) => s.status === 'Inactive').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-fadeIn transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toastMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="ml-3 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#021936] text-[#fe932c] flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-[#021936]">
                  Staff &amp; Faculty Management
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F8FD] text-[#021936] border border-[#dce3ec]">
                  {staffList.length} Total Members
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage official school educators, leadership directory, credentials, and custom uploaded photos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddForm}
              className="py-2.5 px-4 rounded-xl bg-[#904d00] hover:bg-[#B45309] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Add New Staff</span>
            </button>
            <button
              onClick={onBackToWebsite}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Website</span>
            </button>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#dce3ec]">
          <div className="p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec]/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">groups</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Staff</span>
              <span className="text-base font-extrabold text-[#021936]">{staffList.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active Online</span>
              <span className="text-base font-extrabold text-emerald-900">{activeCount}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">visibility_off</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Inactive / Hidden</span>
              <span className="text-base font-extrabold text-amber-900">{inactiveCount}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec]/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">military_tech</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Leadership</span>
              <span className="text-base font-extrabold text-[#021936]">
                {staffList.filter((s) => s.category === 'Leadership').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search staff by Name, Designation, or Subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-8 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs text-[#021936] placeholder:text-slate-400 focus:outline-none focus:border-[#904d00] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-base">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-[#F2F8FD] p-1 rounded-xl border border-[#dce3ec]">
            {(['All', 'Active', 'Inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#021936] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#021936]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center bg-[#F2F8FD] p-1 rounded-xl border border-[#dce3ec]">
            {(['All', 'Faculty', 'Leadership'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#904d00] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#904d00]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={loadStaff}
            title="Reload from Neon Database"
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </div>

      {/* Staff List Table & Responsive Cards */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <span className="material-symbols-outlined text-3xl animate-spin text-[#904d00]">sync</span>
            <p className="text-xs font-semibold">Loading staff records from Neon PostgreSQL database...</p>
          </div>
        ) : sortedStaff.length === 0 ? (
          <div className="py-16 px-4 text-center text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F2F8FD] text-slate-400 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">person_off</span>
            </div>
            <h4 className="text-sm font-bold text-[#021936]">No staff members found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                ? 'Try adjusting your search criteria or clear status filters.'
                : 'Get started by clicking "Add New Staff" to register educators.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                }}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#021936] cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F8FD] text-[#021936] border-b border-[#dce3ec] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Subjects / Skills</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Qualifications</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce3ec]">
                {sortedStaff.map((staff) => {
                  const photoSrc = staff.photoUrl || staff.imageUrl || '/assets/faculty/anuradha.jpg';
                  const isActive = staff.status === 'Active';

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-[#f7f9ff]/70 transition-colors group"
                    >
                      {/* Display Order */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-xs">
                          {staff.displayOrder || 0}
                        </span>
                      </td>

                      {/* Photo & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-[#dce3ec] shrink-0 shadow-2xs">
                            <img
                              src={photoSrc}
                              alt={staff.name}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/faculty/anuradha.jpg';
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#021936] block hover:text-[#904d00] transition-colors">
                              {staff.name}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[12px] text-slate-400">
                                {staff.category === 'Leadership' ? 'military_tech' : 'school'}
                              </span>
                              <span>{staff.category || 'Faculty'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {staff.designation || staff.role || 'Faculty Member'}
                        </span>
                        {staff.experience && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {staff.experience}
                          </span>
                        )}
                      </td>

                      {/* Subjects & Skills */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(staff.subjects || []).slice(0, 2).map((sub, idx) => (
                            <span
                              key={`sub-${idx}`}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-semibold"
                            >
                              {sub}
                            </span>
                          ))}
                          {(staff.skills || []).slice(0, 2).map((sk, idx) => (
                            <span
                              key={`sk-${idx}`}
                              className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold"
                            >
                              {sk}
                            </span>
                          ))}
                          {((staff.subjects?.length || 0) + (staff.skills?.length || 0)) > 4 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{((staff.subjects?.length || 0) + (staff.skills?.length || 0)) - 4} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Qualifications */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-600">
                        {staff.qualification || staff.qualifications || '—'}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          title={`Click to switch to ${isActive ? 'Inactive' : 'Active'}`}
                          className={`py-1 px-2.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => setViewingStaff(staff)}
                            title="View Staff Profile Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(staff)}
                            title="Edit Staff Member"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingStaff(staff)}
                            title="Delete Staff Member"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* ADD / EDIT STAFF MODAL DIALOG                                          */}
      {/* ====================================================================== */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsFormModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#dce3ec] my-8 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#021936] text-white p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#904d00] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    {editingStaffId ? 'manage_accounts' : 'person_add'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    {editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-[#8396b9]">
                    {editingStaffId
                      ? 'Update educator credentials, subjects, bio, or upload a new photo.'
                      : 'Register a new teacher or school administrator in the institutional directory.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Photo Upload & Preview Section */}
              <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#021936] uppercase tracking-wider block text-[11px]">
                    Staff Photo {!editingStaffId && <span className="text-red-600">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Supports JPG, PNG, WebP (Max 5MB)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Thumbnail */}
                  <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-white border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 shadow-xs group">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Staff Preview"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <span className="material-symbols-outlined text-3xl">account_circle</span>
                        <span className="text-[9px] block font-semibold mt-1">No Photo</span>
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & Requirements */}
                  <div className="flex-1 space-y-2 text-left w-full">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="py-2 px-3.5 rounded-lg bg-[#021936] hover:bg-[#1a2e4c] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                        <span>{photoPreview ? 'Change Photo from Computer' : 'Upload Photo from Computer'}</span>
                      </button>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setFormData((prev) => ({ ...prev, photoUrl: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong>Exact Photo Guarantee:</strong> When you upload a photo from your computer, that exact file is saved and displayed on the website. No stock or AI images are substituted.
                    </p>

                    {photoError && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{photoError}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 1: Name and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Staff Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ms. Anuradha"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as 'Leadership' | 'Faculty' })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  >
                    <option value="Faculty">Teaching Faculty</option>
                    <option value="Leadership">Institutional Leadership</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Designation and Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#021936] mb-1">
                    Designation / Heading <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Childhood Educator or Mathematics Faculty"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] mb-1" title="Lower numbers appear first">
                    Display Order <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 3: Subjects and Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Subjects / Areas (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Early Childhood Literacy, Environmental Studies"
                    value={formData.subjectsInput}
                    onChange={(e) => setFormData({ ...formData, subjectsInput: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Storytelling, Phonics, Creative Learning"
                    value={formData.skillsInput}
                    onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 4: Qualification and Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.A., B.Ed., N.T.T."
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6+ Years in Early Childhood Pedagogy"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Short Description */}
              <div>
                <label className="block font-bold text-[#021936] mb-1">
                  Short Description / Teaching Philosophy
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Experienced early childhood educator focused on activity-based learning and language fluency."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] focus:outline-none focus:border-[#904d00] focus:bg-white leading-relaxed resize-none"
                />
              </div>

              {/* Row 6: Status Selector */}
              <div>
                <label className="block font-bold text-[#021936] mb-1.5">
                  Publishing Status
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData({ ...formData, status: 'Active' })}
                      className="text-[#904d00] focus:ring-[#904d00]"
                    />
                    <span>Active (Visible on Website)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                      className="text-[#904d00] focus:ring-[#904d00]"
                    />
                    <span>Inactive (Hidden from Website)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[#dce3ec] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="py-2.5 px-5 rounded-xl bg-[#904d00] hover:bg-[#B45309] text-white font-bold shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{editingStaffId ? 'Update Staff' : 'Save Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                              */}
      {/* ====================================================================== */}
      {deletingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setDeletingStaff(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dce3ec] space-y-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#021936]">
                Delete Staff Member?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong>{deletingStaff.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                This will deactivate the record so it will no longer appear on the public school website.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* VIEW STAFF PROFILE MODAL                                               */}
      {/* ====================================================================== */}
      {viewingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setViewingStaff(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce3ec] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 bg-slate-900 overflow-hidden">
              <img
                src={viewingStaff.photoUrl || viewingStaff.imageUrl || '/assets/faculty/anuradha.jpg'}
                alt={viewingStaff.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = '/assets/faculty/anuradha.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021936]/80 via-transparent to-transparent" />
              <button
                onClick={() => setViewingStaff(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDE68A] block">
                  {viewingStaff.category} • Order #{viewingStaff.displayOrder}
                </span>
                <h3 className="text-xl font-bold font-serif text-white">{viewingStaff.name}</h3>
                <span className="text-xs text-slate-200">
                  {viewingStaff.designation || viewingStaff.role}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-[#021936] uppercase tracking-wider mb-1">
                  About &amp; Educational Role
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {viewingStaff.description || 'No description provided.'}
                </p>
              </div>

              {(viewingStaff.qualification || viewingStaff.qualifications) && (
                <div className="p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec]">
                  <span className="font-bold text-[#021936] block">Credentials:</span>
                  <span className="text-slate-600">
                    {viewingStaff.qualification || viewingStaff.qualifications}
                  </span>
                </div>
              )}

              {viewingStaff.subjects && viewingStaff.subjects.length > 0 && (
                <div>
                  <span className="font-bold text-[#021936] uppercase tracking-wider block mb-1.5">
                    Subjects / Areas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingStaff.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-semibold"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingStaff.skills && viewingStaff.skills.length > 0 && (
                <div>
                  <span className="font-bold text-[#021936] uppercase tracking-wider block mb-1.5">
                    Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingStaff.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = viewingStaff;
                    setViewingStaff(null);
                    handleOpenEditForm(st);
                  }}
                  className="py-2 px-4 bg-[#904d00] hover:bg-[#B45309] text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setViewingStaff(null)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
