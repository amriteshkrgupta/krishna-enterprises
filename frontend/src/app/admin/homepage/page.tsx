'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  Save,
  UploadCloud,
  RotateCcw,
  History,
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Copy,
  Sparkles,
  Layers,
  Grid,
  ShoppingBag,
  Shield,
  MapPin,
  Megaphone,
  CheckCircle2,
  X,
  Clock,
  ExternalLink,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useHomepageConfig,
  useSaveDraftHomepage,
  usePublishHomepage,
  useResetHomepage,
  useHomepageVersions,
  useRollbackHomepage,
} from '@/hooks/useCms';
import { useCategories } from '@/hooks/useProducts';
import {
  HomepageSection,
  HomepageSectionType,
  ProductDataSourceType,
} from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const SECTION_TYPE_LABELS: Record<HomepageSectionType, { label: string; icon: React.ReactNode; color: string }> = {
  hero: { label: 'Hero Banner', icon: <Sparkles className="h-4 w-4" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  category_grid: { label: 'Category Grid', icon: <Grid className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  product_section: { label: 'Product Showcase', icon: <ShoppingBag className="h-4 w-4" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  trust_strip: { label: 'Trust Badges', icon: <Shield className="h-4 w-4" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  store_location: { label: 'Store & Contact', icon: <MapPin className="h-4 w-4" />, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  promotional_banner: { label: 'Promo Banner', icon: <Megaphone className="h-4 w-4" />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  announcement_bar: { label: 'Announcement Bar', icon: <Megaphone className="h-4 w-4" />, color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
};

export default function AdminHomepageBuilderPage() {
  const { data: draftConfig, isLoading: configLoading, refetch } = useHomepageConfig(true);
  const { data: versions = [], isLoading: versionsLoading } = useHomepageVersions();
  const { data: categories = [] } = useCategories();

  const { mutate: saveDraft, isPending: isSaving } = useSaveDraftHomepage();
  const { mutate: publishLive, isPending: isPublishing } = usePublishHomepage();
  const { mutate: resetDefault, isPending: isResetting } = useResetHomepage();
  const { mutate: rollback, isPending: isRollingBack } = useRollbackHomepage();

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals state
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  useEffect(() => {
    if (draftConfig?.sections) {
      setSections(draftConfig.sections);
      setHasChanges(false);
    }
  }, [draftConfig]);

  // Handle reordering
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    const updated = newSections.map((s, idx) => ({ ...s, position: idx + 1 }));
    setSections(updated);
    setHasChanges(true);
  };

  // Toggle enable/disable
  const toggleSectionEnabled = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    setHasChanges(true);
  };

  // Duplicate section
  const duplicateSection = (section: HomepageSection) => {
    const newSection: HomepageSection = {
      ...JSON.parse(JSON.stringify(section)),
      id: `sec_${Date.now()}`,
      title: `${section.title || 'Section'} (Copy)`,
      position: sections.length + 1,
    };
    setSections((prev) => [...prev, newSection]);
    setHasChanges(true);
    toast.success('Section duplicated');
  };

  // Delete section
  const deleteSection = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this section?')) return;
    setSections((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, position: idx + 1 }));
    });
    setHasChanges(true);
    toast.success('Section removed');
  };

  // Save changes to draft
  const handleSaveDraft = () => {
    saveDraft(sections, {
      onSuccess: () => {
        setHasChanges(false);
        toast.success('Draft homepage saved successfully!');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to save draft');
      },
    });
  };

  // Publish draft to live
  const handlePublishLive = () => {
    publishLive(publishNote || 'Published from Homepage Builder', {
      onSuccess: () => {
        setShowPublishModal(false);
        setPublishNote('');
        setHasChanges(false);
        toast.success('Homepage published live to customers!');
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to publish');
      },
    });
  };

  // Reset to factory default
  const handleResetDefault = () => {
    if (!window.confirm('This will reset your homepage to the default factory Krishna Enterprises layout. Continue?')) return;

    resetDefault(undefined, {
      onSuccess: (data) => {
        toast.success('Homepage reset to default layout!');
        setSections(data.sections || []);
        setHasChanges(false);
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to reset homepage');
      },
    });
  };

  // Rollback to version
  const handleRollback = (ver: number) => {
    if (!window.confirm(`Are you sure you want to rollback the live homepage to Version ${ver}?`)) return;

    rollback(ver, {
      onSuccess: () => {
        toast.success(`Successfully rolled back to Version ${ver}!`);
        setShowVersionsModal(false);
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Rollback failed');
      },
    });
  };

  // Save modal edits
  const handleSaveEdit = (updated: HomepageSection) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSection(null);
    setHasChanges(true);
    toast.success('Section settings updated');
  };

  // Add new section template
  const handleAddTemplate = (type: HomepageSectionType) => {
    const newId = `sec_${type}_${Date.now()}`;
    let template: HomepageSection = {
      id: newId,
      type,
      position: sections.length + 1,
      enabled: true,
      title: 'New Section',
      subtitle: '',
    };

    if (type === 'product_section') {
      template.title = 'Special Grocery Collection';
      template.subtitle = 'Hand-picked essentials for your kitchen';
      template.badge = 'Exclusive';
      template.dataSource = { type: 'featured', limit: 8 };
      template.content = {
        viewAllText: 'View All',
        viewAllLink: '/products',
        cardStyle: 'standard',
      };
    } else if (type === 'promotional_banner') {
      template.title = 'Festive Grocery Discounts';
      template.subtitle = 'Get flat discounts on mustard oil, basmati rice and festive treats!';
      template.badge = 'Limited Time';
      template.content = {
        targetLink: '/products',
        linkText: 'Shop Deals',
        backgroundColor: 'from-amber-600 to-orange-600',
      };
    } else if (type === 'announcement_bar') {
      template.title = 'Delivery Notice';
      template.content = {
        message: 'Morning slots delivery: Orders placed before 8:00 AM dispatched same day!',
        targetLink: '/products',
        linkText: 'Order Now',
      };
    } else if (type === 'category_grid') {
      template.title = 'Shop by Category';
      template.subtitle = 'Fresh vegetables, dals, oils & household needs';
      template.content = { limit: 8, seeAllText: 'See all', seeAllLink: '/products' };
    }

    setSections((prev) => [...prev, template]);
    setShowAddModal(false);
    setHasChanges(true);
    setEditingSection(template);
    toast.success('New section added');
  };

  if (configLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Top Header & Actions ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Sliders className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-gray-900">Dynamic Homepage Builder</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
              Live v{draftConfig?.version || 1}
            </span>
            {hasChanges && (
              <span className="animate-pulse rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Reorder, enable, edit, schedule, or add sections on your live Krishna Enterprises storefront.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Version History */}
          <button
            onClick={() => setShowVersionsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            title="View past versions and rollback"
          >
            <History className="h-3.5 w-3.5" /> History
          </button>

          {/* Reset to Default */}
          <button
            onClick={handleResetDefault}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Reset layout to standard factory Krishna Enterprises homepage"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>

          {/* Preview Draft */}
          <Link
            href="/?preview=true"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-800 hover:bg-green-100 transition-colors shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5" /> Preview Draft
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Publish Live */}
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-green-700 transition-all hover:scale-105 shadow-sm disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" /> Publish Live
          </button>
        </div>
      </div>

      {/* ── Section Control Header & Add Button ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Active Layout Sections ({sections.length})
          </h2>
          <p className="text-xs text-gray-500">Sections render from top to bottom on the homepage</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 shadow-2xs transition-all"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {/* ── Section Cards List ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {sections.map((section, idx) => {
          const typeMeta = SECTION_TYPE_LABELS[section.type] || {
            label: section.type,
            icon: <Layers className="h-4 w-4" />,
            color: 'bg-gray-50 text-gray-700 border-gray-200',
          };

          return (
            <div
              key={section.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-white transition-all shadow-2xs ${
                section.enabled
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-dashed border-gray-300 bg-gray-50/60 opacity-60'
              }`}
            >
              {/* Left: Reorder Controls & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <button
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 hover:bg-gray-100 rounded-md transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-black text-gray-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 hover:bg-gray-100 rounded-md transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${typeMeta.color}`}
                    >
                      {typeMeta.icon}
                      {typeMeta.label}
                    </span>

                    {section.badge && (
                      <span className="rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold px-2 py-0.2">
                        {section.badge}
                      </span>
                    )}

                    {section.startAt || section.endAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.2">
                        <Clock className="h-2.5 w-2.5" /> Scheduled
                      </span>
                    ) : null}

                    {section.type === 'product_section' && section.dataSource && (
                      <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.2">
                        Source: {section.dataSource.type === 'category' ? `Category (${section.dataSource.categoryName || section.dataSource.categorySlug})` : section.dataSource.type === 'featured' ? 'Featured Deals' : 'All Products'} ({section.dataSource.limit || 12})
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {section.title || <span className="text-gray-400 italic">Untitled Section</span>}
                  </h3>
                  {section.subtitle && (
                    <p className="text-xs text-gray-500 truncate max-w-md">{section.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Right: Toggle & Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => toggleSectionEnabled(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    section.enabled
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Toggle section visibility"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      section.enabled ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  />
                  {section.enabled ? 'Enabled' : 'Disabled'}
                </button>

                <button
                  onClick={() => setEditingSection(section)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>

                <button
                  onClick={() => duplicateSection(section)}
                  className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 shadow-2xs transition-colors"
                  title="Duplicate section"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => deleteSection(section.id)}
                  className="p-1.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 shadow-2xs transition-colors"
                  title="Delete section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Section Quick Bar ─────────────────────────────────────────── */}
      <div className="pt-2 text-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/50 px-6 py-3 text-xs font-black text-gray-600 hover:text-green-800 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Another Section
        </button>
      </div>

      {/* ── EDIT SECTION MODAL ─────────────────────────────────────────────── */}
      {editingSection && (
        <EditSectionModal
          section={editingSection}
          categories={categories}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ── ADD SECTION MODAL ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Add New Section</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Choose a section type to add to your homepage layout:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() => handleAddTemplate('product_section')}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-green-600 hover:bg-green-50/50 text-left transition-all"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Product Showcase</p>
                  <p className="text-[11px] text-gray-500">Display featured deals, popular staples, or a specific category</p>
                </div>
              </button>

              <button
                onClick={() => handleAddTemplate('promotional_banner')}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-green-600 hover:bg-green-50/50 text-left transition-all"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shrink-0">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Promotional Banner</p>
                  <p className="text-[11px] text-gray-500">Special seasonal sales, discount notices, or festival banners</p>
                </div>
              </button>

              <button
                onClick={() => handleAddTemplate('announcement_bar')}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-green-600 hover:bg-green-50/50 text-left transition-all"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Announcement Bar</p>
                  <p className="text-[11px] text-gray-500">Top strip for urgent store notices, timing, or delivery alerts</p>
                </div>
              </button>

              <button
                onClick={() => handleAddTemplate('category_grid')}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-green-600 hover:bg-green-50/50 text-left transition-all"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
                  <Grid className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Category Grid</p>
                  <p className="text-[11px] text-gray-500">Grid of shop category icons with direct product links</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH MODAL ──────────────────────────────────────────────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-green-600" />
                <h3 className="text-base font-black text-gray-900">Publish to Live Storefront</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-green-50 p-3.5 text-xs text-green-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> Ready to go live
              </p>
              <p className="text-green-700">
                You are about to publish {sections.filter((s) => s.enabled).length} active sections to live customers visiting krishna-enterprises-six.vercel.app.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Release Note (Optional)</label>
              <input
                type="text"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="e.g., Added Diwali discounts & updated hero"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:border-green-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishLive}
                disabled={isPublishing}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-green-700 shadow-md transition-all disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VERSION HISTORY MODAL ──────────────────────────────────────────── */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-700" />
                <h3 className="text-base font-black text-gray-900">Homepage Version History</h3>
              </div>
              <button
                onClick={() => setShowVersionsModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Each time you publish live, a version snapshot is saved. You can rollback to any previous version at any time.
            </p>

            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {versionsLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner size="md" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No previous versions recorded yet. Publish your first version to create history snapshots!
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id || ver.version}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-900">
                          Version {ver.version}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(ver.publishedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {ver.note || 'Regular release'} • {ver.sectionsCount} sections
                      </p>
                    </div>

                    <button
                      onClick={() => handleRollback(ver.version)}
                      disabled={isRollingBack}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      Rollback
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Section Modal Component ────────────────────────────────────────────
function EditSectionModal({
  section,
  categories,
  onClose,
  onSave,
}: {
  section: HomepageSection;
  categories: any[];
  onClose: () => void;
  onSave: (s: HomepageSection) => void;
}) {
  const [form, setForm] = useState<HomepageSection>(JSON.parse(JSON.stringify(section)));

  const updateContent = (key: string, val: any) => {
    setForm((prev) => ({
      ...prev,
      content: { ...prev.content, [key]: val },
    }));
  };

  const updateDataSource = (key: string, val: any) => {
    setForm((prev) => ({
      ...prev,
      dataSource: {
        ...(prev.dataSource || { type: 'featured', limit: 12 }),
        [key]: val,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-black text-gray-900">
              Edit Section: {SECTION_TYPE_LABELS[form.type]?.label || form.type}
            </h3>
            <p className="text-xs text-gray-400 font-mono">ID: {form.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Base Section Fields ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-gray-700">Section Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-green-600 focus:outline-hidden"
              placeholder="e.g. Popular Daily Staples"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-gray-700">Subtitle / Tagline</label>
            <input
              type="text"
              value={form.subtitle || ''}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-green-600 focus:outline-hidden"
              placeholder="e.g. Best market prices on authentic grains and pulses"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Badge Label (Optional)</label>
            <input
              type="text"
              value={form.badge || ''}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-green-600 focus:outline-hidden"
              placeholder="e.g. Special Deals, 20% OFF"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Visibility</label>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Show on Homepage
              </label>
            </div>
          </div>
        </div>

        {/* ── Scheduling Fields ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <p className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-600" /> Scheduling (Optional)
          </p>
          <p className="text-[11px] text-gray-500">
            Set date and time for when this section should automatically appear and disappear.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600">Start At</label>
              <input
                type="datetime-local"
                value={form.startAt || ''}
                onChange={(e) => setForm({ ...form, startAt: e.target.value || null })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600">End At</label>
              <input
                type="datetime-local"
                value={form.endAt || ''}
                onChange={(e) => setForm({ ...form, endAt: e.target.value || null })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ── Type Specific Configurations ───────────────────────────────── */}
        {form.type === 'hero' && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <p className="text-xs font-extrabold text-gray-700">Hero Buttons & Links</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600">Primary Button Text</label>
                <input
                  type="text"
                  value={form.content?.ctaPrimaryText || ''}
                  onChange={(e) => updateContent('ctaPrimaryText', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600">Primary Button Link</label>
                <input
                  type="text"
                  value={form.content?.ctaPrimaryLink || ''}
                  onChange={(e) => updateContent('ctaPrimaryLink', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600">Secondary Button Text</label>
                <input
                  type="text"
                  value={form.content?.ctaSecondaryText || ''}
                  onChange={(e) => updateContent('ctaSecondaryText', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600">Secondary Button Link</label>
                <input
                  type="text"
                  value={form.content?.ctaSecondaryLink || ''}
                  onChange={(e) => updateContent('ctaSecondaryLink', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {form.type === 'product_section' && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <p className="text-xs font-extrabold text-gray-700">Product Data Source</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600">Show Products From</label>
                <select
                  value={form.dataSource?.type || 'featured'}
                  onChange={(e) => updateDataSource('type', e.target.value as ProductDataSourceType)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                >
                  <option value="featured">Featured Deals (featured: true)</option>
                  <option value="all">All Products / Top Sellers</option>
                  <option value="category">Specific Category</option>
                </select>
              </div>

              {form.dataSource?.type === 'category' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-600">Select Category</label>
                  <select
                    value={form.dataSource?.categorySlug || ''}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.slug === e.target.value);
                      updateDataSource('categorySlug', e.target.value);
                      if (selectedCat) updateDataSource('categoryName', selectedCat.name);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-600">Product Count Limit</label>
                <input
                  type="number"
                  min={2}
                  max={48}
                  value={form.dataSource?.limit || 12}
                  onChange={(e) => updateDataSource('limit', parseInt(e.target.value) || 12)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">Card Layout Style</label>
                <select
                  value={form.content?.cardStyle || 'standard'}
                  onChange={(e) => updateContent('cardStyle', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                >
                  <option value="standard">Standard Open Grid</option>
                  <option value="featured_box">Boxed Card Container (with border & shadow)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">View All Button Text</label>
                <input
                  type="text"
                  value={form.content?.viewAllText || 'Browse All'}
                  onChange={(e) => updateContent('viewAllText', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">View All Link</label>
                <input
                  type="text"
                  value={form.content?.viewAllLink || '/products'}
                  onChange={(e) => updateContent('viewAllLink', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {form.type === 'promotional_banner' && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <p className="text-xs font-extrabold text-gray-700">Banner Options</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600">Target Link</label>
                <input
                  type="text"
                  value={form.content?.targetLink || '/products'}
                  onChange={(e) => updateContent('targetLink', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600">Button Text</label>
                <input
                  type="text"
                  value={form.content?.linkText || 'Shop Deals'}
                  onChange={(e) => updateContent('linkText', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-600">Color Theme</label>
                <select
                  value={form.content?.backgroundColor || 'from-amber-600 to-orange-600'}
                  onChange={(e) => updateContent('backgroundColor', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                >
                  <option value="from-amber-600 to-orange-600">Amber / Warm Orange</option>
                  <option value="from-green-700 to-emerald-600">Krishna Green Gradient</option>
                  <option value="from-blue-700 to-indigo-600">Royal Blue Gradient</option>
                  <option value="from-rose-700 to-red-600">Festive Red Gradient</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {form.type === 'announcement_bar' && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <p className="text-xs font-extrabold text-gray-700">Announcement Content</p>
            <div>
              <label className="text-[11px] font-bold text-gray-600">Announcement Message</label>
              <input
                type="text"
                value={form.content?.message || ''}
                onChange={(e) => updateContent('message', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                placeholder="e.g. Free express delivery on all orders above ₹500 in Madhuban!"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-600">Optional Action Link</label>
                <input
                  type="text"
                  value={form.content?.targetLink || ''}
                  onChange={(e) => updateContent('targetLink', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                  placeholder="/products"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600">Action Link Text</label>
                <input
                  type="text"
                  value={form.content?.linkText || ''}
                  onChange={(e) => updateContent('linkText', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                  placeholder="Order Now"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="rounded-xl bg-green-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-green-700 shadow-md transition-all"
          >
            Save Section Changes
          </button>
        </div>
      </div>
    </div>
  );
}
