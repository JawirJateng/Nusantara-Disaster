'use client';

import React from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsProps {
  news: any[];
}

export function NewsFeed({ news }: NewsProps) {
  if (!news || news.length === 0) {
    return <div className="text-sm text-slate-500 py-4">Belum ada berita atau laporan situasi terbaru.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {news.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(item.publishedAt).toLocaleDateString('id-ID')}</span>
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {item.summary}
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{item.sourceName}</span>
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Sumber Asli</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
