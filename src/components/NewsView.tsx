import React, { useState } from 'react';
import { Newspaper, Send, Upload, Trash2, Bell, CheckCircle2, Inbox } from 'lucide-react';
import { Language, Post, Trip } from '../types';

interface NewsViewProps {
  lang: Language;
  posts: Post[];
  trips: Trip[];
  onAddPost: (newPost: Omit<Post, 'id' | 'createdAt'>) => void;
  onDeletePost: (id: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  lang,
  posts,
  trips,
  onAddPost,
  onDeletePost
}) => {
  const isAr = lang === 'AR';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetTripId, setTargetTripId] = useState('');
  const [notifyPush, setNotifyPush] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const selectedTrip = trips.find(t => t.id === targetTripId);

    onAddPost({
      title,
      content,
      tripId: targetTripId,
      tripName: selectedTrip ? selectedTrip.name : 'Tous les voyages (Public)',
      notifyPush,
      imageUrl: selectedImage || undefined
    });

    setTitle('');
    setContent('');
    setSelectedImage(null);
  };

  const handleSampleImage = () => {
    setSelectedImage('https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=800&q=80');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isAr ? 'مركز الأخبار والمنشورات' : "Centre d'Actualités & Posts"}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isAr ? 'إدارة ونشر الأخبار والتنبيهات لمجموعاتك ورحلاتك.' : 'Gérez et publiez des actualités et des annonces pour vos groupes et voyages.'}
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel ("Créer un Nouveau Post") */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Newspaper className="w-5 h-5 text-slate-800" />
            <h2 className="font-bold text-slate-900 text-sm">
              {isAr ? 'إنشاء منشور جديد' : 'Créer un Nouveau Post'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700">
                {isAr ? 'عنوان المنشور *' : 'Titre du Post *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? "...اكتب عنوان التنبيه أو الخبر هنا" : "Titre de l'annonce ou de l'actualité..."}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                required
              />
            </div>

            {/* Content Textarea */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700">
                {isAr ? 'محتوى المنشور *' : 'Contenu du Post *'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isAr ? "...اكتب محتوى المنشور هنا" : "Rédigez votre annonce ici..."}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                required
              />
            </div>

            {/* Upload Photo Area */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700">
                {isAr ? 'صورة المنشور (اختياري)' : "Photo d'illustration (Optionnelle)"}
              </label>
              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 rtl:right-auto rtl:left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md font-bold"
                  >
                    {isAr ? 'حذف' : 'Supprimer'}
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleSampleImage}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isAr ? 'اختيار صورة توضيحية' : "Choisir photo d'illustration"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'صورة إضافية تظهر في تطبيق الجوال' : "Image facultative affichée dans l'application mobile (Optionnel)"}
                  </p>
                </div>
              )}
            </div>

            {/* Target Trip */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700">
                {isAr ? 'الرحلة المستهدفة' : 'Voyage Ciblé'}
              </label>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
              >
                <option value="">{isAr ? 'جميع الرحلات (منشور عام)' : 'Tous les voyages (Post public)'}</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Push Notification Checkbox */}
            <div className="flex items-start gap-2 pt-1 text-start">
              <input
                type="checkbox"
                id="notifyPush"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
                className="mt-0.5 rounded text-black focus:ring-black"
              />
              <label htmlFor="notifyPush" className="text-xs text-slate-600 font-medium cursor-pointer">
                {isAr ? 'إرسال إشعار فوري لجميع المعتمرين والمرافقين' : 'Envoyer une notification push immédiate aux pèlerins et accompagnateurs'}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span>{isAr ? 'نشر الآن' : 'Publier maintenant'}</span>
            </button>
          </form>
        </div>

        {/* Right Panel ("Posts actuels de l'agence") */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">
              {isAr ? 'منشورات الوكالة الحالية' : "Posts actuels de l'agence"}
            </h2>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              {posts.length}
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                <Inbox className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-400">
                {isAr ? 'لا توجد منشورات.' : 'Aucun résultat trouvé.'}
              </p>
              <p className="text-xs text-slate-400">
                {isAr ? 'قم بنشر أول خبر لمجموعاتك.' : 'Publiez votre premier post pour vos pèlerins.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {post.tripName}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 text-start">{post.title}</h3>
                      <p className="text-[10px] text-slate-400">{post.createdAt}</p>
                    </div>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      title={isAr ? "حذف المنشور" : "Supprimer le post"}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {post.imageUrl && (
                    <div className="rounded-lg overflow-hidden h-36 border border-slate-200">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-xs text-slate-700 text-start whitespace-pre-line leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
