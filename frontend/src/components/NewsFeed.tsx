'use client';

import React from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsProps {
  news: any[];
}

export function NewsFeed({ news }: NewsProps) {
  if (!news || news.length === 0) {
    return <div className="text-body-sm text-ink-muted py-4">Belum ada berita atau laporan situasi terbaru.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {news.map((item) => (
        <a
          key={item.id}
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="group ndw-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 flex flex-col cursor-pointer block"
        >
          <div className="p-5 flex flex-col justify-between flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-end">
                <span className="text-small text-ink-muted flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.publishedAt).toLocaleDateString('id-ID')}</span>
                </span>
              </div>
              <h3 className="font-bold text-ink text-base leading-snug group-hover:text-sage-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-body-sm text-ink-muted leading-relaxed line-clamp-3">
                {item.summary}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-line-soft flex items-center justify-between">
              <span className="text-small font-medium text-ink-muted">{item.sourceName}</span>
              <span className="text-small font-semibold text-ink group-hover:text-sage-400 transition-colors flex items-center space-x-1">
                <span>Lihat Berita</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}