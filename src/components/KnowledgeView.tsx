import React, { useState } from 'react';
import { KnowledgeDocument, RetrievedEvidence } from '../models/types';
import { searchEngineeringKnowledge } from '../ai/reasoningEngine';
import {
  BookOpen,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';

interface KnowledgeViewProps {
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  documents,
  onAddDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    'Why does bearing vibration increase at constant RPM when oil temperature rises?'
  );
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const retrievedEvidence: RetrievedEvidence[] = searchEngineeringKnowledge(
    searchQuery,
    documents,
    5
  );

  const activeDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawText = String(evt.target?.result || '').trim();
      if (!rawText) return;

      // Chunk text into ~500-char paragraphs
      const paragraphs = rawText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

      const chunks = (paragraphs.length > 0 ? paragraphs : [rawText]).slice(0, 8);
      const newDoc: KnowledgeDocument = {
        id: `DOC-USR-${Date.now().toString().slice(-4)}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        category: 'Engineering Procedures',
        docCode: `USR-${file.name.slice(0, 8).toUpperCase()}`,
        authorOrOem: 'Uploaded Plant Engineering Document',
        updatedAt: new Date().toISOString().slice(0, 10),
        sections: chunks.map((chunk, idx) => ({
          id: `SEC-USR-${idx + 1}`,
          sectionNumber: `Section 1.${idx + 1}`,
          heading: `Extracted Technical Passage #${idx + 1}`,
          page: idx + 1,
          content: chunk,
          keywords: chunk
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length > 4)
            .slice(0, 12),
        })),
      };

      onAddDocument(newDoc);
      setSelectedDocId(newDoc.id);
      setUploadStatus(
        `Indexed "${newDoc.title}" (${newDoc.sections.length} searchable engineering chunks).`
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top RAG Search & Document Upload Bar */}
      <div className="glass-panel-elevated rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-[#5CE1E6] font-semibold">
              CURAAI ENGINEERING KNOWLEDGE RETRIEVAL (RAG ENGINE)
            </div>
            <h2 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
              Technical Manuals, Bearing Datasheets & Historical Incident Evidence
            </h2>
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium glass-subcard text-[#F6F1E5] rounded-xl cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-[#19A7CE]" />
            <span>Upload Technical Manual (.txt / .md)</span>
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadStatus && (
          <div className="px-3 py-2 glass-subcard border border-[#19A7CE]/65 rounded-lg text-xs font-mono text-[#F6F1E5]">
            {uploadStatus}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#19A7CE] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manuals, SKF 22214 bearing limits, ISO 20816 vibration zones, or lubrication viscosity..."
            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F6F1E5]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Indexed Engineering Sources */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F6F1E5]">
              Indexed Technical Sources ({documents.length})
            </span>
            <span className="text-[11px] font-mono text-[#5CE1E6]">VERIFIED CITATIONS</span>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => {
              const active = doc.id === activeDoc?.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'glass-panel-elevated glass-cyan-glow'
                      : 'glass-subcard'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#EAE3D2]/90">
                    <span className="text-[#5CE1E6] font-semibold">{doc.category}</span>
                    <span>{doc.docCode}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#F6F1E5] mt-1">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                    {doc.authorOrOem} · Updated {doc.updatedAt}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 7 Columns: Retrieved Evidence & Selected Document Reader */}
        <div className="lg:col-span-7 space-y-5">
          {/* Retrieved Evidence Matches */}
          <div className="glass-panel-elevated rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#19A7CE]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F6F1E5]">
                  Retrieved Engineering Evidence Passages
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
                {retrievedEvidence.length} MATCHES
              </span>
            </div>

            <div className="space-y-3">
              {retrievedEvidence.map((ev) => (
                <div
                  key={`${ev.docId}-${ev.sectionNumber}`}
                  className="glass-subcard rounded-xl p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5CE1E6]">
                    <span>
                      SOURCE: {ev.docCode} · {ev.sectionNumber} (Page {ev.page})
                    </span>
                    <span className="text-[#F6F1E5] font-semibold">
                      Relevance: {Math.round(ev.relevanceScore * 100)}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#F6F1E5] mt-1">
                    {ev.docTitle} — {ev.heading}
                  </div>
                  <p className="text-xs text-[#EAE3D2]/90 mt-1.5 leading-relaxed">
                    “{ev.excerpt}”
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Document Full Section Inspector */}
          {activeDoc && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="border-b border-[#19A7CE]/35 pb-2.5">
                <div className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
                  DOCUMENT VIEWER · {activeDoc.docCode}
                </div>
                <h3 className="text-sm font-semibold text-[#F6F1E5] mt-0.5">
                  {activeDoc.title}
                </h3>
              </div>
              <div className="space-y-3">
                {activeDoc.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3.5 glass-subcard rounded-xl"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#EAE3D2]/90">
                      <span className="text-[#5CE1E6] font-semibold">
                        {sec.sectionNumber}: {sec.heading}
                      </span>
                      <span>Page {sec.page}</span>
                    </div>
                    <p className="text-xs text-[#F6F1E5]/95 mt-1.5 leading-relaxed">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
