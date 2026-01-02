'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  Layers,
  Link2,
  Database,
  FileText,
  Scale,
  BookOpen,
  Sparkles,
  LayoutGrid,
  Share2,
  Zap,
  BarChart3,
  Target,
  Accessibility,
  ArrowRight,
  FolderTree,
  FileCode,
  Columns3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';

interface ReadmeViewerProps {
  content: string;
}

interface Section {
  title: string;
  level: number;
  content: string;
  icon?: React.ReactNode;
}

interface FeatureItem {
  title: string;
  description: string[];
  icon: React.ReactNode;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'features': <Sparkles className="w-4 h-4" />,
  'how it works': <Layers className="w-4 h-4" />,
  'quick start': <Rocket className="w-4 h-4" />,
  'url structure': <Link2 className="w-4 h-4" />,
  'tech stack': <Database className="w-4 h-4" />,
  'documentation': <FileText className="w-4 h-4" />,
  'license': <Scale className="w-4 h-4" />,
};

function getIconForSection(title: string): React.ReactNode {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }
  return <BookOpen className="w-4 h-4" />;
}

// Feature card component
function FeatureCard({ feature }: { feature: FeatureItem }) {
  return (
    <div className="bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary)]/50 rounded-xl p-4 border border-[var(--border)] hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
          {feature.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-[var(--foreground)] mb-1">
            {feature.title}
          </h4>
          {feature.description.map((line, i) => (
            <p key={i} className="text-xs text-[var(--muted-foreground)]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Features grid component
function FeaturesGrid() {
  const features: FeatureItem[] = [
    {
      title: 'Kanban Board',
      description: ['3-column pipeline', 'Backlog → Done'],
      icon: <LayoutGrid className="w-6 h-6" />,
    },
    {
      title: 'Shareable Links',
      description: ['Clean slug-based', 'URLs for sharing'],
      icon: <Share2 className="w-6 h-6" />,
    },
    {
      title: 'Real-Time Updates',
      description: ['Live file watching', 'via SSE'],
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: 'Dashboard Metrics',
      description: ['Progress charts', 'Stage distribution'],
      icon: <BarChart3 className="w-6 h-6" />,
    },
    {
      title: 'Deep Linking',
      description: ['Link to specific', 'features directly'],
      icon: <Target className="w-6 h-6" />,
    },
    {
      title: 'Accessible',
      description: ['WCAG 2.2 AA', 'Keyboard nav'],
      icon: <Accessibility className="w-6 h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} />
      ))}
    </div>
  );
}

// How It Works flow component
function HowItWorksFlow() {
  const steps = [
    {
      title: 'spec-kit project',
      items: ['specs/', '├─ feature/', '│  ├─ spec', '│  ├─ plan', '│  └─ tasks'],
      icon: <FolderTree className="w-6 h-6" />,
      color: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400 bg-purple-500/20',
    },
    {
      title: 'SpecBoard parses',
      items: ['spec.md', 'plan.md', 'tasks.md'],
      icon: <FileCode className="w-6 h-6" />,
      color: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400 bg-blue-500/20',
    },
    {
      title: 'Kanban Board',
      items: ['Backlog', 'In Progress', 'Done'],
      icon: <Columns3 className="w-6 h-6" />,
      color: 'from-green-500/20 to-green-600/10',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-400 bg-green-500/20',
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-4 flex-1">
          <div className={cn(
            'flex-1 rounded-xl p-4 border bg-gradient-to-br',
            step.color,
            step.borderColor
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('p-2 rounded-lg', step.iconColor)}>
                {step.icon}
              </div>
              <h4 className="font-semibold text-sm">{step.title}</h4>
            </div>
            <div className="space-y-1 font-mono text-xs text-[var(--muted-foreground)]">
              {step.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {index === 2 ? (
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-medium',
                      i === 0 ? 'bg-zinc-600/50 text-zinc-300' :
                      i === 1 ? 'bg-blue-600/50 text-blue-300' :
                      'bg-green-600/50 text-green-300'
                    )}>
                      {item}
                    </span>
                  ) : (
                    <span>{item}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="w-5 h-5 text-[var(--muted-foreground)] hidden md:block flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// Tech Stack component
function TechStackDisplay() {
  const frontend = [
    { name: 'Next.js', version: '16' },
    { name: 'Tailwind', version: 'CSS v4' },
    { name: 'Zustand', version: 'State' },
    { name: 'Recharts', version: 'Charts' },
  ];

  const backend = [
    { name: 'Next.js', version: 'API' },
    { name: 'Prisma', version: 'ORM' },
    { name: 'PostgreSQL', version: 'DB' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2 bg-blue-500/10 border-b border-[var(--border)]">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Frontend</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {frontend.map((tech, i) => (
            <div key={i} className="bg-[var(--secondary)]/50 rounded-lg p-3 text-center border border-[var(--border)]">
              <div className="font-semibold text-sm">{tech.name}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{tech.version}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2 bg-green-500/10 border-b border-[var(--border)]">
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Backend</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {backend.map((tech, i) => (
            <div key={i} className="bg-[var(--secondary)]/50 rounded-lg p-3 text-center border border-[var(--border)]">
              <div className="font-semibold text-sm">{tech.name}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{tech.version}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Check content type
function isFeaturesDiagram(content: string): boolean {
  return content.includes('KANBAN BOARD') || content.includes('KANBAN') && content.includes('SHAREABLE');
}

function isHowItWorksDiagram(content: string): boolean {
  return content.includes('spec-kit') && content.includes('SpecBoard') && content.includes('parses');
}

function isTechStackDiagram(content: string): boolean {
  return content.includes('FRONTEND') && content.includes('BACKEND') && content.includes('Next.js');
}

// Enhanced content renderer that replaces ASCII diagrams with beautiful components
function EnhancedMarkdownRenderer({ content }: { content: string }) {
  const codeBlockPattern = /```[\s\S]*?```/g;
  const parts: { type: 'text' | 'features' | 'howitworks' | 'techstack' | 'code'; content: string }[] = [];

  let lastIndex = 0;
  let match;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    const codeContent = match[0];

    if (isFeaturesDiagram(codeContent)) {
      parts.push({ type: 'features', content: codeContent });
    } else if (isHowItWorksDiagram(codeContent)) {
      parts.push({ type: 'howitworks', content: codeContent });
    } else if (isTechStackDiagram(codeContent)) {
      parts.push({ type: 'techstack', content: codeContent });
    } else {
      parts.push({ type: 'code', content: codeContent });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        switch (part.type) {
          case 'features':
            return <FeaturesGrid key={index} />;
          case 'howitworks':
            return <HowItWorksFlow key={index} />;
          case 'techstack':
            return <TechStackDisplay key={index} />;
          case 'code':
          case 'text':
          default:
            return <MarkdownRenderer key={index} content={part.content} />;
        }
      })}
    </div>
  );
}

function parseReadme(content: string): { header: string; sections: Section[] } {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let header = '';
  let currentSection: Section | null = null;
  let currentContent: string[] = [];
  let inHeader = true;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      } else if (inHeader) {
        header = currentContent.join('\n').trim();
        inHeader = false;
      }

      const title = h2Match[1];
      currentSection = {
        title,
        level: 2,
        content: '',
        icon: getIconForSection(title),
      };
      currentContent = [];
      continue;
    }

    const h3Match = line.match(/^### (.+)$/);
    if (h3Match && currentSection) {
      currentContent.push(line);
      continue;
    }

    currentContent.push(line);
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  } else if (inHeader) {
    header = currentContent.join('\n').trim();
  }

  return { header, sections };
}

function SectionCard({ section, defaultExpanded = true }: { section: Section; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-[var(--secondary)]/50',
          isExpanded && 'border-b border-[var(--border)]'
        )}
      >
        <span className="text-blue-400">
          {section.icon}
        </span>
        <span className="flex-1 font-medium text-sm">{section.title}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 bg-[var(--secondary)]/20">
          <EnhancedMarkdownRenderer content={section.content} />
        </div>
      )}
    </div>
  );
}

export function ReadmeViewer({ content }: ReadmeViewerProps) {
  const { header, sections } = useMemo(() => parseReadme(content), [content]);

  return (
    <div className="space-y-4">
      {header && (
        <div className="border-b border-[var(--border)] pb-4 mb-4">
          <MarkdownRenderer content={header} />
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, index) => (
          <SectionCard
            key={index}
            section={section}
            defaultExpanded={index < 3}
          />
        ))}
      </div>
    </div>
  );
}
