import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Image as ImageIcon, Globe, Share } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Define story type directly
type Story = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  status: string;
  category_id: string | null;
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
};

interface StoryExportProps {
  story: Story;
}

export function StoryExport({ story }: StoryExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportAsMarkdown = () => {
    let content = '';
    
    if (includeMetadata) {
      content += `# ${story.title}\n\n`;
      if (story.description) {
        content += `*${story.description}*\n\n`;
      }
      if (includeTimestamp) {
        content += `---\n`;
        content += `Created: ${new Date(story.created_at).toLocaleDateString()}\n`;
        content += `Updated: ${new Date(story.updated_at).toLocaleDateString()}\n`;
        content += `Status: ${story.status}\n`;
        content += `---\n\n`;
      }
    }
    
    content += story.content || '';
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.title}</title>
    <style>
        body {
            font-family: Georgia, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .metadata {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .description {
            font-style: italic;
            color: #666;
            margin-bottom: 2rem;
        }
        code {
            background: #f0f0f0;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
        }
        pre {
            background: #f0f0f0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 1rem 0;
            padding-left: 1rem;
            color: #666;
        }
    </style>
</head>
<body>
    ${includeMetadata ? `
    <div class="metadata">
        <h1>${story.title}</h1>
        ${story.description ? `<p class="description">${story.description}</p>` : ''}
        ${includeTimestamp ? `
        <p><small>
            Created: ${new Date(story.created_at).toLocaleDateString()} | 
            Updated: ${new Date(story.updated_at).toLocaleDateString()} | 
            Status: ${story.status}
        </small></p>
        ` : ''}
    </div>
    ` : ''}
    <div class="content">
        ${story.content ? story.content.replace(/\n/g, '<br>') : ''}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      // Create a temporary div with the story content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Georgia, serif';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#333';
      tempDiv.style.backgroundColor = 'white';

      let content = '';
      if (includeMetadata) {
        content += `<h1 style="margin-bottom: 10px;">${story.title}</h1>`;
        if (story.description) {
          content += `<p style="font-style: italic; color: #666; margin-bottom: 20px;">${story.description}</p>`;
        }
        if (includeTimestamp) {
          content += `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 30px;">`;
          content += `<small>Created: ${new Date(story.created_at).toLocaleDateString()} | `;
          content += `Updated: ${new Date(story.updated_at).toLocaleDateString()} | `;
          content += `Status: ${story.status}</small></div>`;
        }
      }
      content += story.content ? story.content.replace(/\n/g, '<br>') : '';
      
      tempDiv.innerHTML = content;
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: 'white',
        scale: 2
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Failed to export as PDF. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsText = () => {
    let content = '';
    
    if (includeMetadata) {
      content += `${story.title}\n`;
      content += '='.repeat(story.title.length) + '\n\n';
      if (story.description) {
        content += `${story.description}\n\n`;
      }
      if (includeTimestamp) {
        content += `Created: ${new Date(story.created_at).toLocaleDateString()}\n`;
        content += `Updated: ${new Date(story.updated_at).toLocaleDateString()}\n`;
        content += `Status: ${story.status}\n\n`;
        content += '-'.repeat(50) + '\n\n';
      }
    }
    
    // Strip markdown formatting for plain text
    const plainContent = story.content
      ?.replace(/#{1,6}\s/g, '') // Remove headers
      ?.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      ?.replace(/\*(.*?)\*/g, '$1') // Remove italic
      ?.replace(/`(.*?)`/g, '$1') // Remove code
      ?.replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      || '';
    
    content += plainContent;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'markdown':
          exportAsMarkdown();
          break;
        case 'html':
          exportAsHTML();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'text':
          exportAsText();
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      if (exportFormat !== 'pdf') {
        toast({
          title: 'Export successful',
          description: `Story exported as ${exportFormat.toUpperCase()}`
        });
      }
      
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'An error occurred while exporting the story.'
      });
    } finally {
      if (exportFormat !== 'pdf') {
        setIsExporting(false);
      }
    }
  };

  const shareStory = () => {
    const shareData = {
      title: story.title,
      text: story.description || 'Check out this story!',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Story link copied to clipboard'
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <Download className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Markdown (.md)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      HTML (.html)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Plain Text (.txt)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Export Options</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                />
                <label htmlFor="metadata" className="text-sm">
                  Include title and description
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp"
                  checked={includeTimestamp}
                  onCheckedChange={(checked) => setIncludeTimestamp(checked === true)}
                />
                <label htmlFor="timestamp" className="text-sm">
                  Include creation and update dates
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                onClick={shareStory}
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}